# Documentação Técnica — StockApp

> Última atualização: 2026-03-16 (rev 2)

## Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| UI | React | 19.2 |
| Linguagem | TypeScript | 5.x |
| Bundler | Vite | 6.x |
| Roteamento | React Router | 7.x |
| Estado global | Zustand | 5.x |
| Formulários | react-hook-form + Zod | 7.x / 4.x |
| Backend | Supabase (PostgreSQL + Auth + PostgREST) | 2.x |
| ORM / migrations | Drizzle ORM + Drizzle Kit | 0.45 |
| Scanner | @zxing/browser | — |
| UI components | shadcn/ui + Tailwind CSS | 4.x |
| Testes | Vitest | — |
| Datas | date-fns | 4.x |
| Notificações | Sonner | 2.x |

---

## Arquitetura

Quatro camadas com **fluxo de imports descendente apenas** (pages → application → domain ← infrastructure).

```
src/
├── pages/           # UI: React pages + componentes
├── application/     # Hooks + Zustand stores (sem lógica de negócio)
├── domain/          # TypeScript puro: tipos, regras, formatters (zero deps externas)
└── infrastructure/  # Implementações Supabase dos repositórios
```

### Domain (`src/domain/`)

Núcleo da aplicação — zero dependência de framework ou banco.

- **`types.ts`** — todas as interfaces e enums; valores monetários são **inteiros em centavos**
- **`repositories/`** — contratos de interface (sem import do Supabase)
- **`rules/`** — funções puras com 100% de cobertura de testes unitários
  - `stock.rules.ts`: `isLowStock`, `isExpired`, `isNearExpiry`, `daysUntilExpiry`, `calcStockValue`
  - `sale.rules.ts`: `validateSale`, `calcSaleTotal`
  - `credit.rules.ts`: `calcDebtBalance`, `isDebtSettled`
- **`formatters/`**
  - `currency.ts`: `floatToCents()`, `centsToBRL()`, `centsToFloat()` — **único ponto** de conversão de moeda
  - `date.ts`: `formatDate`, `formatDateTime`, `formatExpiryLabel`

### Infrastructure (`src/infrastructure/`)

- **`supabase/client.ts`** — singleton do Supabase; usa `db: { schema: 'stock' }`
- **`supabase/*Repository.ts`** — implementam as interfaces do domain; cada um tem `mapRow()` privado (snake_case DB → camelCase domain)
- **`supabase/StockRepository.ts`** — método `deleteEntry` remove a linha de `stock_entries` (os `stock_movements` são mantidos por serem append-only)
- **`supabase/SaleRepository.ts`** — método `hasProductSales` (count query) verifica se existem vendas para um produto antes da exclusão
- **`db/schema.ts`** — Drizzle: fonte da verdade do schema DB

### Application (`src/application/`)

- **`stores/authStore.ts`** — sessão e usuário via Zustand
- **`stores/settingsStore.ts`** — Zustand com persist no `localStorage` (`businessName`, `lowStockThreshold`, `expirationAlertDays`)
- **`hooks/useSales.ts`** — **orquestrador crítico**: única entrada de escrita em `sales`, `stock_movements` e `stock_entries`
- **`hooks/useBarcode.ts`** — sempre chamar `stopScan()` no unmount do componente
- **`hooks/useStock.ts`** — expõe `replenish` (incremento + movimento `purchase`), `adjustQuantity` (ajuste exato + movimento `adjustment`) e `removeEntry` (deleta `stock_entry`)
- **`hooks/useProducts.ts`** — `remove` verifica `hasProductSales` antes de deletar; lança erro se houver vendas vinculadas
- **`hooks/useReports.ts`** — `ReportData` expõe `stockEntries[]` além das listas de alertas

### Pages (`src/pages/`)

Consomem hooks e stores. Validação de formulários via Zod + react-hook-form.

---

## Rotas

| Path | Componente | Proteção |
|---|---|---|
| `/login` | LoginPage | Pública |
| `/signup` | SignUpPage | Pública |
| `/` | HomePage | Autenticada |
| `/stock` | StockPage | Autenticada |
| `/stock/new` | NewProductPage | Autenticada |
| `/stock/scan` | StockScanPage | Autenticada |
| `/stock/:productId` | ProductDetailPage | Autenticada |
| `/sales/new` | NewSalePage | Autenticada |
| `/credit` | CreditPage | Autenticada |
| `/credit/:customerId` | CustomerDetailPage | Autenticada |
| `/reports` | ReportsPage | Autenticada |
| `/settings` | SettingsPage | Autenticada |

`ProtectedRoute` redireciona para `/login` sem sessão. Todas as páginas autenticadas renderizam dentro de `AppShell` (bottom nav + `<Outlet />`).

---

## Banco de Dados

### Schema PostgreSQL: `stock`

Todas as tabelas vivem no schema `stock` (não `public`). O PostgREST precisa ser configurado para expô-lo:

```sql
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, stock';
NOTIFY pgrst, 'reload config';
GRANT USAGE ON SCHEMA stock TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA stock TO authenticated;
```

### Tabelas

| Tabela | Descrição |
|---|---|
| `user_profiles` | Configurações por usuário (PK = UUID do auth.users) |
| `products` | Catálogo de produtos (barcode único por usuário) |
| `stock_entries` | Quantidade em estoque (1 linha por produto) |
| `stock_movements` | Log append-only de movimentações (auditoria) |
| `customers` | Clientes para controle de fiado |
| `sales` | Registro de vendas (à vista e fiado) |
| `credit_payments` | Pagamentos de dívidas de clientes |

### Regras de negócio no banco

- `stock_entries`: uma linha por produto (`UNIQUE(product_id)`)
- `stock_movements`: append-only — nunca atualizar ou deletar
- Saldo de dívida: **sempre derivado** via `calcDebtBalance(creditSales, payments)` — nunca armazenado
- Valores monetários: **inteiros em centavos** em todas as colunas de preço/valor

### RLS (Row Level Security)

Todas as tabelas devem ter RLS habilitado. Policy padrão: `user_id = auth.uid()` (ou `id = auth.uid()` em `user_profiles`).

```sql
-- Exemplo para products (replicar para todas as tabelas)
ALTER TABLE stock.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products: owner only"
  ON stock.products FOR ALL
  USING (user_id = auth.uid());
```

---

## Fluxo de Venda (crítico)

`useSales.createSale()` é a **única entrada de escrita** para vendas. Sequência:

1. `validateSale()` — verifica estoque disponível e tipo de pagamento
2. `saleRepo.create()` — insere na tabela `sales`
3. `stockRepo.addMovement()` — registra em `stock_movements` (tipo `out`, razão `sale`)
4. `stockRepo.decrementStock()` — atualiza quantidade em `stock_entries`

Nenhum componente deve escrever em `stock_entries` diretamente.

---

## Variáveis de Ambiente

```
VITE_SUPABASE_URL=https://<projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
DATABASE_URL=<connection-string>  # apenas para db:push — nunca commitar
```

Copiar `.env.local.example` → `.env.local`.

---

## Comandos

```bash
npm run dev           # servidor de desenvolvimento
npm run build         # tsc + vite build → dist/
npm test              # vitest (todos os testes unitários)
npm run test:watch    # vitest em modo watch
npm run test:coverage # cobertura de testes
npm run db:generate   # gera migration a partir do schema.ts
npm run db:push       # aplica schema no Supabase (requer DATABASE_URL)
```

---

## Convenções de Código

- **Dinheiro**: sempre inteiros em centavos. Nunca usar `float` para valores monetários. Converter apenas em `src/domain/formatters/currency.ts`
- **Parsing de datas de input `type="date"`**: usar `new Date(value + 'T00:00:00')` (sem Z) para forçar interpretação como meia-noite no fuso local. `new Date("YYYY-MM-DD")` sem sufixo é tratado como UTC pelo ECMAScript e causa deslocamento de 1 dia em fusos negativos (ex: UTC-3).
- **`z.coerce.number()` + zodResolver**: requer cast `as any` (incompatibilidade conhecida zod v4 / react-hook-form v7). Usar `z.output<typeof schema>` como alias de tipo de formulário
- **`erasableSyntaxOnly` desabilitado**: permite `private readonly` em parâmetros de construtores de classe
- **Repositórios**: cada um tem `mapRow()` privado para conversão snake_case → camelCase
- **Camera cleanup**: todo componente que chama `useBarcode.startScan()` deve chamar `stopScan()` no unmount

---

## Testes

Rodar com `npm test`. Todos os testes ficam em `src/domain/rules/*.test.ts`.

Cobertura atual:
- `stock.rules.ts` — 100%
- `sale.rules.ts` — 100%
- `credit.rules.ts` — 100%
- Hooks, repositórios e páginas — não cobertos
