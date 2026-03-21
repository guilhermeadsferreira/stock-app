# PRD + Especificação Técnica — StockApp

> **Status:** v1.2 (revisado e consolidado)
> **Última atualização:** 2026-03-17
> **Autor:** Guilherme Augusto
> **Contexto:** Projeto pessoal com potencial de evolução para produto comercial

---

## Sumário

1. [Visão do Produto](#1-visão-do-produto)
2. [Definição do MVP](#2-definição-do-mvp)
3. [Stack e Arquitetura](#3-stack-e-arquitetura)
4. [Modelagem de Dados](#4-modelagem-de-dados)
5. [Fluxos de Uso](#5-fluxos-de-uso)
6. [Decisões Técnicas](#6-decisões-técnicas)
7. [Design System](#7-design-system)
8. [Roadmap de Evolução](#8-roadmap-de-evolução)

---

## 1. Visão do Produto

### 1.1 Problema

Pequenos comerciantes gerenciam estoque de forma manual — em cadernos, planilhas ou de memória. Isso gera:

- Falta de visibilidade sobre o que tem e o que precisa repor
- Perdas por vencimento de produtos não rastreados
- Dificuldade em saber o valor total investido em estoque
- Vendas no fiado sem controle: quem deve, quanto e há quanto tempo
- Vendas registradas de forma imprecisa ou não registradas

### 1.2 Solução

Um aplicativo web mobile (PWA) simples e rápido que centraliza o controle de produtos, estoque, vendas e fiado — pensado para quem não tem familiaridade com tecnologia, mas precisa de informação confiável no dia a dia.

Roda no celular como se fosse um app instalado (via "Adicionar à tela inicial"), sem precisar de loja de aplicativos.

### 1.3 Público-Alvo

**Primário (MVP):** Pequenos comerciantes autônomos — revendedores, feirantes, pequenos mercadinhos — com operação individual ou com pequena equipe.

**Futuro:** Pequenos negócios com 2–10 funcionários, operando com necessidade de controle multi-usuário, múltiplos dispositivos e relatórios avançados.

### 1.4 Proposta de Valor

> Controle de estoque e fiado no bolso — rápido de cadastrar, fácil de consultar, acessível de qualquer celular.

| Atributo         | Posicionamento                                                   |
| ---------------- | ---------------------------------------------------------------- |
| Simplicidade     | Interface focada, sem menus complexos ou configurações           |
| Velocidade       | Leitura de código de barras para cadastro e venda em 2 toques   |
| Acessibilidade   | PWA — funciona em Android e iOS sem instalação de loja           |
| Fiado integrado  | Controle de crédito de clientes sem sair do fluxo de venda      |
| Multi-usuário    | Múltiplos colaboradores no mesmo negócio via convite             |
| Evolução gradual | Começa simples, cresce conforme o negócio cresce                 |

### 1.5 Métricas de Sucesso (MVP)

| Métrica                                 | Meta                            |
| --------------------------------------- | ------------------------------- |
| Produtos cadastrados após 30 dias        | ≥ 20                            |
| Vendas registradas por semana            | ≥ 5                             |
| Fiados registrados após 30 dias          | ≥ 3                             |
| Sessões de uso por semana                | ≥ 3                             |
| Feedback qualitativo                    | "Uso todo dia" ou "ajuda muito" |

---

## 2. Definição do MVP

### 2.1 Critério de Corte

O MVP deve ser **acessível via link no navegador**, **utilizável sem treinamento** e **resolver os três problemas centrais** do usuário: saber o que tem no estoque, registrar uma venda e controlar o fiado dos clientes.

### 2.2 O que ENTRA no MVP

#### Autenticação e Onboarding
- Login com email e senha
- Sessão persistente (não precisa logar a cada acesso)
- Cadastro de empresa (negócio) no primeiro acesso
- Convite por código para adicionar colaboradores à mesma empresa

#### Cadastro de Produtos
- Nome do produto (obrigatório)
- Código de barras (leitura pela câmera ou digitação manual)
- Valor de compra (custo)
- Valor sugerido de venda
- Data de validade (opcional)
- Quantidade inicial em estoque

#### Leitura de Código de Barras
- Leitura via câmera para cadastrar produto
- Leitura via câmera para buscar produto ao registrar venda

#### Gestão de Estoque
- Entrada manual de quantidade (reposição)
- Decremento automático ao registrar venda
- Indicador visual de estoque baixo (quantidade ≤ limiar configurável, padrão: 5)
- Alerta de produto próximo ao vencimento (≤ 7 dias)

#### Registro de Vendas
- Selecionar produto (por busca ou leitura de código de barras)
- Informar quantidade vendida
- Confirmar ou alterar valor de venda (permite desconto/promoção)
- Venda com múltiplos itens (carrinho)
- Escolher forma de pagamento: **à vista** ou **fiado**
- Se fiado: selecionar ou cadastrar cliente na hora

#### Controle de Fiado
- Cadastro simples de clientes (nome + telefone opcional)
- Visualizar saldo devedor por cliente
- Registrar pagamento parcial ou total de dívida
- Histórico de compras fiadas por cliente

#### Relatórios Básicos
- Valor total em estoque (soma de `qtd × valor_de_compra`)
- Total de vendas à vista e fiado: hoje / semana / mês / período customizado
- Total de fiado em aberto (quanto está a receber)
- Lista de produtos com estoque baixo
- Lista de produtos próximos ao vencimento
- Histórico de vendas recentes (lista cronológica)

#### Configurações
- Nome do negócio (exibido na tela inicial)
- Limiar de estoque baixo (padrão: 5 unidades)
- Janela de alerta de vencimento (padrão: 7 dias)
- Gestão de membros do negócio (ver, remover)
- Regenerar código de convite

### 2.3 O que NÃO ENTRA no MVP

| Funcionalidade                    | Motivo do adiamento                              |
| --------------------------------- | ------------------------------------------------ |
| Gráficos de evolução              | Requer histórico acumulado — faz sentido na v2   |
| Categorias de produtos            | Pode ser adicionado sem refatoração na v1.1      |
| Export de relatórios (CSV/PDF)    | Aumenta escopo, baixa prioridade no MVP          |
| Notificações push                 | iOS PWA tem suporte limitado, adia para v1.1     |
| Offline-first                     | Cloud-first adequado para o perfil de uso do MVP |

### 2.4 Condição de Sucesso do MVP

O MVP está pronto quando for possível:

1. Acessar o app via navegador no celular e adicionar à tela inicial
2. Cadastrar um produto com código de barras em menos de 30 segundos
3. Registrar uma venda à vista em menos de 15 segundos
4. Registrar uma venda no fiado selecionando o cliente em menos de 20 segundos
5. Ver o total de fiado em aberto na tela inicial

---

## 3. Stack e Arquitetura

### 3.1 Stack

| Camada              | Tecnologia                          | Versão  |
| ------------------- | ----------------------------------- | ------- |
| Plataforma          | PWA (Progressive Web App)           | —       |
| UI Framework        | React                               | 19.2    |
| Linguagem           | TypeScript                          | 5.x     |
| Bundler             | Vite                                | 6.x     |
| Roteamento          | React Router                        | 7.x     |
| Estado global       | Zustand                             | 5.x     |
| Formulários         | react-hook-form + Zod               | 7.x / 4.x |
| UI Components       | shadcn/ui + Tailwind CSS            | 4.x     |
| Backend / BaaS      | Supabase (PostgreSQL + Auth + PostgREST) | 2.x |
| ORM / Migrations    | Drizzle ORM + Drizzle Kit           | 0.45    |
| Barcode Scanner     | @zxing/browser                      | —       |
| Datas               | date-fns                            | 4.x     |
| Notificações        | Sonner                              | 2.x     |
| Testes              | Vitest                              | —       |

### 3.2 Arquitetura de Camadas

Quatro camadas com **fluxo de imports descendente apenas** (pages → application → domain ← infrastructure):

```
┌──────────────────────────────────────────────────────────┐
│                       UI Layer                            │
│          src/pages/ — React pages + componentes           │
│          Tailwind + shadcn/ui                             │
├──────────────────────────────────────────────────────────┤
│                   Application Layer                       │
│          src/application/ — Hooks + Zustand stores        │
│          Conecta Domain ↔ UI, sem lógica de negócio       │
├──────────────────────────────────────────────────────────┤
│                    Domain Layer                           │
│          src/domain/ — TypeScript puro, zero deps externas│
│          Types, entidades, regras, interfaces             │
│          (100% reutilizável — nenhum import de React/Supabase) │
├──────────────────────────────────────────────────────────┤
│                 Infrastructure Layer                      │
│          src/infrastructure/ — Implementações Supabase    │
│          Drizzle ORM + Supabase client                    │
└──────────────────────────────────────────────────────────┘
```

### 3.3 Domain (`src/domain/`)

Núcleo da aplicação — zero dependência de framework ou banco.

- **`types.ts`** — todas as interfaces e enums; valores monetários são **inteiros em centavos**
- **`repositories/`** — contratos de interface (sem import do Supabase)
- **`rules/`** — funções puras com 100% de cobertura de testes unitários
  - `stock.rules.ts`: `isLowStock`, `isExpired`, `isNearExpiry`, `daysUntilExpiry`, `calcStockValue`
  - `sale.rules.ts`: `validateSale`, `calcSaleTotal`, `calcMargin`, `calcMarginValue`
  - `credit.rules.ts`: `calcDebtBalance`, `isDebtSettled`
- **`formatters/`**
  - `currency.ts`: `floatToCents()`, `centsToBRL()`, `centsToFloat()` — **único ponto** de conversão de moeda
  - `date.ts`: `formatDate`, `formatDateTime`, `formatExpiryLabel`

### 3.4 Infrastructure (`src/infrastructure/`)

- **`supabase/client.ts`** — singleton do Supabase; usa `db: { schema: 'stock' }`
- **`supabase/*Repository.ts`** — implementam as interfaces do domain; cada um tem `mapRow()` privado (snake_case DB → camelCase domain)
- **`supabase/StockRepository.ts`** — método `deleteEntry` remove a linha de `stock_entries` (os `stock_movements` são mantidos por serem append-only)
- **`supabase/SaleRepository.ts`** — método `hasProductSales` (count query) verifica se existem vendas para um produto antes da exclusão
- **`supabase/CreditRepository.ts`** — `listAllPayments(userId)` retorna todos os pagamentos do usuário (usado na listagem de clientes para calcular saldos sem N+1 queries)
- **`db/schema.ts`** — Drizzle: fonte da verdade do schema DB

### 3.5 Application (`src/application/`)

- **`stores/authStore.ts`** — sessão, usuário e empresa atual (`currentBusiness: Business | null`) via Zustand. `isLoading` só é resolvido para `false` após carregar a empresa no `onAuthStateChange`.
- **`stores/settingsStore.ts`** — stub vazio; configurações migradas para `businesses`
- **`hooks/useSales.ts`** — **orquestrador crítico**: única entrada de escrita em `sales`, `stock_movements` e `stock_entries`; `createSalesBatch` cria múltiplas vendas com pré-validação (fase 1: valida tudo sem escrever; fase 2: grava sequencialmente)
- **`hooks/useBusiness.ts`** — `createBusiness`, `joinByCode`, `removeMember`, `getInviteCode`, `regenerateInviteCode`, `listMembers`; atualiza `currentBusiness` no authStore após cada operação
- **`hooks/useBarcode.ts`** — sempre chamar `stopScan()` no unmount do componente
- **`hooks/useStock.ts`** — expõe `replenish` (incremento + movimento `purchase`), `adjustQuantity` (ajuste exato + movimento `adjustment`) e `removeEntry` (deleta `stock_entry`)
- **`hooks/useProducts.ts`** — `remove` verifica `hasProductSales` antes de deletar; lança erro se houver vendas vinculadas
- **`hooks/useReports.ts`** — `ReportData` expõe `allSalesTotal`, `cashSalesTotal`, `creditSalesTotal` (derivado: `allSalesTotal - cashSalesTotal`, sem query extra), `stockEntries[]` e listas de alertas
- **`hooks/useCredit.ts`** — `loadCustomerCredit`, `registerPayment`, `balance` (derivado); `registerPayment` não valida teto máximo — validação feita na UI
- **`hooks/useCustomers.ts`** — `load(search?)`, `create`, `update`

### 3.6 Rotas

| Path | Componente | Proteção |
|---|---|---|
| `/login` | LoginPage | Pública |
| `/signup` | SignUpPage | Pública |
| `/onboarding` | OnboardingPage | Autenticada sem empresa |
| `/` | HomePage | Autenticada |
| `/stock` | StockPage | Autenticada |
| `/stock/new` | NewProductPage | Autenticada |
| `/stock/scan` | StockScanPage | Autenticada |
| `/stock/:productId` | ProductDetailPage | Autenticada |
| `/sales/new` | NewSalePage | Autenticada |
| `/customers` | CustomersPage | Autenticada |
| `/customers/:customerId` | CustomerDetailPage | Autenticada |
| `/reports` | ReportsPage | Autenticada |
| `/settings` | SettingsPage | Autenticada |

`ProtectedRoute` redireciona para `/login` sem sessão e para `/onboarding` se `currentBusiness === null`.

### 3.7 PWA — Instalação como App

**Android (Chrome / Samsung Internet):** O browser dispara o evento `beforeinstallprompt`. A aplicação captura esse evento e exibe um botão de instalação customizado no onboarding. Resultado: ícone próprio na tela inicial, splash screen, modo standalone.

**iOS (Safari):** Não existe equivalente ao `beforeinstallprompt`. Fluxo: Safari → Compartilhar → "Adicionar à Tela de Início". Estratégia: modal educativo com passo a passo ilustrado na primeira visita.

**Configurações essenciais iOS** (o Safari ignora parcialmente o manifest padrão):

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Nome do App">
<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">
```

| Aspecto                      | Status      | Impacto                                                   |
| ---------------------------- | ----------- | --------------------------------------------------------- |
| Câmera (`getUserMedia`)      | ✅ Funciona  | Leitura de barcode OK — exige HTTPS                       |
| Modo standalone              | ✅ Funciona  | App parece nativo quando instalado                        |
| Push notifications           | ⚠️ Parcial  | Requer iOS 16.4+ e app instalado                          |
| Install prompt automático    | ❌ Não existe | Mitigado com modal educativo                             |

### 3.8 Hospedagem — Vercel

App 100% estático (React + Vite → `dist/`). O backend é o Supabase. A Vercel serve apenas os assets.

Configuração mínima (`vercel.json`):
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

---

## 4. Modelagem de Dados

### 4.1 Schema PostgreSQL: `stock`

Todas as tabelas vivem no schema `stock` (não `public`). Configuração necessária no Supabase:

```sql
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, stock';
NOTIFY pgrst, 'reload config';
GRANT USAGE ON SCHEMA stock TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA stock TO authenticated;
```

### 4.2 Tabelas

#### `businesses` — Empresa (tenant)

| Campo                    | Tipo      | Descrição                                          |
| ------------------------ | --------- | -------------------------------------------------- |
| `id`                     | UUID (PK) | Identificador único                                |
| `name`                   | text      | Nome do negócio                                    |
| `owner_id`               | UUID      | ID do usuário dono (auth.users)                    |
| `invite_code`            | text      | Código de 8 caracteres para convite (UNIQUE)       |
| `low_stock_threshold`    | integer   | Limiar de estoque baixo (padrão: 5)                |
| `expiration_alert_days`  | integer   | Janela de alerta de vencimento (padrão: 7)         |
| `created_at`             | timestamp | Data de criação                                    |

#### `user_profiles` — Perfil de usuário

| Campo         | Tipo      | Descrição                                                  |
| ------------- | --------- | ---------------------------------------------------------- |
| `id`          | UUID (PK) | Mesmo UUID do `auth.users`                                 |
| `email`       | text      | Email do usuário                                           |
| `business_id` | UUID (FK) | Empresa a que pertence (nullable — null antes do onboarding) |
| `created_at`  | timestamp | Data de criação                                            |

#### `products` — Produto cadastrado

| Campo             | Tipo      | Descrição                                                     |
| ----------------- | --------- | ------------------------------------------------------------- |
| `id`              | UUID (PK) | Identificador único                                           |
| `business_id`     | UUID (FK) | Empresa dona do produto (RLS)                                 |
| `name`            | text      | Nome do produto                                               |
| `barcode`         | text      | Código de barras (UNIQUE por `business_id`)                   |
| `purchase_price`  | integer   | Custo em centavos (ex: R$ 12,50 → 1250)                      |
| `sale_price`      | integer   | Preço sugerido de venda em centavos                           |
| `expiration_date` | timestamp | Data de validade (opcional)                                   |
| `created_at`      | timestamp | Data de criação                                               |
| `updated_at`      | timestamp | Última atualização                                            |

**Nota:** Todos os preços são inteiros em centavos. A conversão fica em `domain/formatters/currency.ts`.

#### `stock_entries` — Saldo atual de estoque

Uma linha por produto. Representa a quantidade disponível agora.

| Campo        | Tipo      | Descrição                                          |
| ------------ | --------- | -------------------------------------------------- |
| `id`         | UUID (PK) | Identificador único                                |
| `business_id`| UUID (FK) | Para RLS                                           |
| `product_id` | UUID (FK) | Produto (UNIQUE — uma linha por produto)           |
| `quantity`   | integer   | Quantidade atual disponível                        |
| `updated_at` | timestamp | Última atualização                                 |

**Design decision:** Separada de `products` para suportar futura extensão multi-localização sem alterar o schema de produto.

#### `stock_movements` — Histórico de movimentações

Log append-only imutável. Permite auditar e reconstruir o saldo a qualquer momento.

| Campo        | Tipo                                                              | Descrição                                     |
| ------------ | ----------------------------------------------------------------- | --------------------------------------------- |
| `id`         | UUID (PK)                                                         | Identificador único                           |
| `business_id`| UUID (FK)                                                         | Para RLS                                      |
| `product_id` | UUID (FK)                                                         | Produto movimentado                           |
| `type`       | enum: `in` \| `out`                                               | Direção da movimentação                       |
| `reason`     | enum: `purchase` \| `adjustment` \| `sale` \| `loss` \| `return` | Motivo                                        |
| `quantity`   | integer                                                           | Quantidade (sempre positivo; `type` define direção) |
| `sale_id`    | UUID (FK, nullable)                                               | Referência à venda que originou a saída       |
| `notes`      | text (nullable)                                                   | Observação livre                              |
| `created_at` | timestamp                                                         | Timestamp da movimentação                     |

#### `customers` — Clientes (para fiado)

| Campo        | Tipo      | Descrição                            |
| ------------ | --------- | ------------------------------------ |
| `id`         | UUID (PK) | Identificador único                  |
| `business_id`| UUID (FK) | Para RLS                             |
| `name`       | text      | Nome do cliente                      |
| `phone`      | text      | Telefone (opcional)                  |
| `created_at` | timestamp | Data de cadastro                     |

#### `sales` — Registro de venda

| Campo                     | Tipo                        | Descrição                                                         |
| ------------------------- | --------------------------- | ----------------------------------------------------------------- |
| `id`                      | UUID (PK)                   | Identificador único                                               |
| `business_id`             | UUID (FK)                   | Para RLS                                                          |
| `product_id`              | UUID (FK)                   | Produto vendido                                                   |
| `quantity`                | integer                     | Quantidade vendida                                                |
| `unit_price`              | integer                     | Preço unitário praticado (centavos) — pode diferir do sugerido   |
| `total_price`             | integer                     | `quantity × unit_price` (calculado e persistido)                 |
| `purchase_price_snapshot` | integer                     | Custo no momento da venda — garante precisão em relatórios históricos |
| `payment_type`            | enum: `cash` \| `credit`    | Forma de pagamento                                                |
| `customer_id`             | UUID (FK, nullable)         | Obrigatório quando `payment_type = credit`                        |
| `created_at`              | timestamp                   | Data e hora da venda                                              |

**Notas:**
- `purchase_price_snapshot` garante margem histórica precisa mesmo após atualização do custo do produto.
- Vendas são **imutáveis** após criação. Cancelamentos geram nova `stock_movement` tipo `in`.

#### `credit_payments` — Pagamentos de fiado

| Campo         | Tipo      | Descrição                               |
| ------------- | --------- | --------------------------------------- |
| `id`          | UUID (PK) | Identificador único                     |
| `business_id` | UUID (FK) | Para RLS                                |
| `customer_id` | UUID (FK) | Cliente que pagou                       |
| `amount`      | integer   | Valor pago em centavos                  |
| `notes`       | text      | Observação (ex: "pagou metade")         |
| `created_at`  | timestamp | Data do pagamento                       |

**Saldo devedor** = Σ `sales.total_price` WHERE `customer_id` AND `payment_type = credit` − Σ `credit_payments.amount` WHERE `customer_id`

Cálculo em `domain/rules/credit.rules.ts` como função pura — nunca armazenado.

### 4.3 Diagrama de Relacionamento

```
businesses
  │
  ├── 1:N → user_profiles (business_id)
  │
  ├── 1:N → products (business_id)
  │             │
  │             ├── 1:1 → stock_entries (product_id)
  │             │
  │             └── 1:N → stock_movements (product_id)
  │                            ▲
  │                            │ sale_id (FK nullable)
  │                            │
  ├── 1:N → sales (business_id)
  │             └── N:1 → customers (customer_id, nullable)
  │
  └── 1:N → customers (business_id)
                  └── 1:N → credit_payments (customer_id)
```

### 4.4 RLS (Row Level Security)

> **Status atual:** RLS ainda não configurada nas tabelas — bloqueador de segurança antes do onboarding público.

Policy padrão para todas as tabelas de dados:

```sql
CREATE POLICY "business members only"
ON stock.<table>
USING (
  business_id IN (
    SELECT business_id FROM stock.user_profiles
    WHERE id = auth.uid() AND business_id IS NOT NULL
  )
);
```

---

## 5. Fluxos de Uso

### 5.1 Cadastro de Produto

```
Usuário abre "Estoque" → toca "+"
    ├── [Opção A] Digitar manualmente
    │       → Preenche nome, preço de compra, preço de venda, quantidade
    │       → Salva → stock_entry + stock_movement "in/purchase" criados
    │
    └── [Opção B] Ler código de barras
            → Câmera abre via @zxing/browser
            → Se produto já existe: abre tela de edição
            → Se não existe: preenche barcode automaticamente
            → Usuário completa os demais campos
            → Salva → stock_entry + stock_movement "in/purchase" criados
```

### 5.2 Registro de Venda — À Vista

```
Usuário abre "Vender"
    ├── [Opção A] Busca produto por nome
    └── [Opção B] Lê código de barras
            ↓
    Produto adicionado ao carrinho (quantidade + preço confirmável)
            ↓
    Pode adicionar mais itens ao carrinho
            ↓
    Seleciona: "À Vista" → Confirma
            ↓
    Para cada item:
        ├── sale criado (payment_type: cash)
        ├── stock_movement "out/sale" criado
        └── stock_entry.quantity decrementado
            ↓
    Toast de sucesso
    └── Se estoque ≤ limiar → badge de alerta na tela de estoque
```

### 5.3 Registro de Venda — Fiado

```
[... mesmo início até escolha de pagamento ...]
    ↓
Seleciona: "Fiado"
    ↓
Busca cliente por nome
    ├── [Cliente encontrado] → seleciona
    └── [Cliente não cadastrado] → "Novo cliente" → modal → salva e seleciona
    ↓
Confirma
    ├── sale criado (payment_type: credit, customer_id preenchido)
    ├── stock_movement "out/sale" criado
    └── stock_entry.quantity decrementado
    ↓
Toast: "Venda no fiado registrada para [Nome]"
```

### 5.4 Registro de Pagamento de Fiado

```
Usuário abre "Fiado" → seleciona cliente
    ↓
Tela do cliente:
    ├── Saldo devedor total
    ├── Lista de compras no fiado (com data e valor)
    └── Botão "Registrar Pagamento"
            ↓
    Informa valor pago (pode ser parcial)
            ↓
    Confirma → credit_payment criado → saldo recalculado e exibido
```

### 5.5 Reposição de Estoque

```
Usuário abre produto → "Repor Estoque"
    ↓
Informa quantidade a adicionar
    ↓
Confirma
    ├── stock_movement "in/purchase" criado
    └── stock_entry.quantity incrementado
```

### 5.6 Onboarding / Convite de Empresa

```
Novo usuário faz signup → redirecionado para /onboarding
    ├── [Opção A] Criar empresa → preenche nome → empresa criada com invite_code
    └── [Opção B] Entrar em empresa existente → digita código de 8 chars
            ↓
    user_profile.business_id atualizado
    authStore.currentBusiness preenchido
    Redirecionado para /
```

---

## 6. Decisões Técnicas

### 6.1 Multi-tenancy via `businesses`

**Decisão: modelo tenant por empresa, não por usuário.**

Cada empresa tem um `business_id`. Usuários pertencem a uma empresa via `user_profiles.business_id`. O convite é feito por `invite_code` (8 chars, único, regenerável).

RLS usa `business_id` — todos os membros da empresa veem os mesmos dados. Isso já suporta múltiplos usuários sem refatoração futura.

### 6.2 PWA vs React Native

**Decisão: PWA.**

| Critério                | PWA                                            | React Native                              |
| ----------------------- | ---------------------------------------------- | ----------------------------------------- |
| Suporte iOS             | ✅ Safari, sem App Store                       | ✅ Mas exige conta Apple Developer (US$99/ano) |
| Distribuição            | ✅ Link direto                                 | ❌ App Store + review                     |
| Câmera / Barcode        | ✅ getUserMedia funciona bem                   | ✅ expo-camera                            |
| Migração futura         | ✅ Domain layer reutilizável                   | —                                         |
| Push notifications iOS  | ⚠️ Parcial (iOS 16.4+ / homescreen)           | ✅ Nativo                                 |

Trade-off aceito: notificações push limitadas no iOS. No MVP, alertas in-app são suficientes.

### 6.3 Supabase vs Neon

**Decisão: Supabase.**

Neon é excelente como Postgres serverless, mas é apenas banco. Supabase entrega no free tier: Auth completo com JWT, RLS nativo, API REST auto-gerada via PostgREST, Realtime via WebSockets e backups automáticos.

### 6.4 Cloud-first vs Offline-first

**Decisão: Cloud-first no MVP.**

O perfil de uso — comércio fixo com Wi-Fi ou 4G — torna a dependência de internet aceitável. Cloud-first elimina complexidade de sincronização e conflitos.

**Caminho para offline parcial (v1.1, se necessário):** Service Worker cacheia leituras (produtos, clientes) + fila de mutações pendentes em IndexedDB. Quando online, fila é processada. Conflitos resolvidos por `created_at` (last-write-wins).

### 6.5 Isolamento do Domain Layer

O domain layer em TypeScript puro é o principal ativo arquitetural. Regras:

- Nenhum import de React, React Native, Supabase ou bibliotecas de terceiros
- Recebe e retorna tipos de `domain/types.ts`
- Interfaces de repositório definem contratos — implementações ficam na infra
- Testável com `vitest` sem banco ou DOM

Se a plataforma mudar (PWA → React Native), o custo de migração é limitado às camadas de UI e infraestrutura.

### 6.6 Preços em Centavos (Integer)

Preços armazenados como inteiro em centavos (`R$ 12,50` → `1250`). Elimina erros de ponto flutuante em operações financeiras acumuladas. Conversão centralizada em `domain/formatters/currency.ts`.

### 6.7 RLS como Primeira Camada de Segurança

Row Level Security no Supabase garante que nenhum usuário acesse dados de outra empresa, mesmo com bug na aplicação. Filtros JS não são a fronteira de segurança.

### 6.8 `useSales.createSale` como Único Ponto de Escrita

`createSale` / `createSalesBatch` são as **únicas entradas de escrita** para vendas. Nenhum componente deve escrever em `stock_entries` ou `stock_movements` diretamente.

Sequência para cada item:
1. `validateSale()` — verifica estoque e tipo de pagamento (fase 1: valida tudo sem escrever)
2. `saleRepo.create()` — insere em `sales`
3. `stockRepo.addMovement()` — registra em `stock_movements` (tipo `out`, razão `sale`)
4. `stockRepo.decrementStock()` — atualiza quantidade em `stock_entries`

### 6.9 Convenções de Código

- **Dinheiro**: sempre inteiros em centavos. Nunca usar `float`. Converter apenas em `src/domain/formatters/currency.ts`
- **Parsing de datas**: usar `new Date(value + 'T00:00:00')` (sem Z) para forçar meia-noite no fuso local — `new Date("YYYY-MM-DD")` sem sufixo é UTC e causa deslocamento de 1 dia em UTC-3
- **`z.coerce.number()` + zodResolver**: requer cast `as any` (incompatibilidade zod v4 / react-hook-form v7); usar `z.output<typeof schema>` para o tipo do form
- **Repositórios**: cada um tem `mapRow()` privado para conversão snake_case → camelCase
- **Camera cleanup**: todo componente que chama `useBarcode.startScan()` deve chamar `stopScan()` no unmount
- **`erasableSyntaxOnly` desabilitado**: permite class parameter properties (`private readonly` em construtores)

---

## 7. Design System

### 7.1 Benchmarks de Referência

| Referência     | O que absorver                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------ |
| **Square POS** | Fluxo de venda: produto → quantidade → pagamento → confirmação. Toques grandes, zero distração   |
| **Nubank**     | Apresentação de valores financeiros: número em destaque, hierarquia clara, cores com significado |
| **SumUp**      | Simplicidade para usuário não-técnico em contexto brasileiro. Feedback visual imediato           |

### 7.2 Princípios de Design

O perfil real do usuário define as regras:

- Usa o app em pé, com cliente esperando → **ações rápidas e óbvias**
- Pode estar com uma mão ocupada → **toques grandes (min. 48×48px)**
- Ambiente com luz variável (loja, mercadinho) → **alto contraste**
- Não lê ícone sem label → **sempre texto + ícone**
- Lida com dinheiro o dia todo → **números precisos em destaque**

### 7.3 Paleta de Cores

Base: shadcn/ui com tema customizado. Tailwind CSS como primitivas.

| Role        | Nome        | Hex       | Tailwind         | Uso                                                          |
| ----------- | ----------- | --------- | ---------------- | ------------------------------------------------------------ |
| Primary     | Verde       | `#16a34a` | `green-600`      | Ações principais, botão de venda, estoque ok                 |
| Danger      | Vermelho    | `#dc2626` | `red-600`        | Estoque zerado, vencimento crítico, erro                     |
| Warning     | Âmbar       | `#d97706` | `amber-600`      | Estoque baixo (não crítico), vencimento próximo              |
| Credit      | Azul        | `#2563eb` | `blue-600`       | Tudo relacionado a fiado — distingue de dinheiro             |
| Background  | Cinza claro | `#f9fafb` | `gray-50`        | Fundo de tela                                                |
| Surface     | Branco      | `#ffffff` | `white`          | Cards, modais, formulários                                   |
| Text        | Cinza escuro| `#111827` | `gray-900`       | Texto principal                                              |
| Text muted  | Cinza médio | `#6b7280` | `gray-500`       | Labels secundários, datas, descrições                        |
| Border      | Cinza leve  | `#e5e7eb` | `gray-200`       | Bordas de cards e separadores                                |

**Verde como primary:** associação direta com dinheiro e positivo no contexto brasileiro.

**Azul para fiado:** fiado é crédito a receber, não perda. Vermelho = problema; Azul = valor em trânsito.

### 7.4 Tipografia

Fonte: **Inter** (padrão shadcn/ui).

| Uso                                  | Tamanho | Peso      |
| ------------------------------------ | ------- | --------- |
| Valores de destaque (estoque, totais) | 28–32px | Semibold  |
| Títulos de página                    | 22px    | Semibold  |
| Títulos de card / seção              | 18px    | Medium    |
| Corpo / labels                       | 16px    | Regular   |
| Texto auxiliar                       | 14px    | Regular   |

Regra absoluta: **nunca abaixo de 14px**.

### 7.5 Layout e Navegação

Navegação inferior com 4 tabs + FAB "Vender" centralizado elevado:

```
┌─────────────────────────────────────┐
│          Conteúdo da tela           │
├─────────────────────────────────────┤
│  🏠 Início  📦 Estoque  💳 Fiado   │
│                  ╋ Vender           │
└─────────────────────────────────────┘
```

**Tela Inicial (Dashboard):** três cards grandes, nada mais:

```
┌─────────────────────────────────────┐
│  Nome do Negócio                    │
├──────────────┬──────────────────────┤
│ Em Estoque   │  Vendas hoje         │
│ R$ 4.820,00  │  R$ 340,00           │
├──────────────┴──────────────────────┤
│ Fiado em aberto                     │
│ R$ 185,00  •  3 clientes            │
├─────────────────────────────────────┤
│ ⚠️  2 produtos com estoque baixo    │
│ ⚠️  1 produto vence em 3 dias       │
└─────────────────────────────────────┘
```

### 7.6 Indicadores Visuais de Estoque

Semáforo com **cor + ícone + texto** — nunca só cor (acessibilidade):

| Estado     | Badge                    | Cor              |
| ---------- | ------------------------ | ---------------- |
| OK         | `● 24 unid.`             | Verde            |
| Baixo      | `⚠ 3 unid.`              | Âmbar            |
| Zerado     | `✕ Zerado`               | Vermelho         |
| Vencendo   | `⏱ Vence em 3 dias`      | Âmbar / Vermelho |

### 7.7 Feedback e Microinterações

- Toast de sucesso (Sonner) ao registrar venda ou pagamento de fiado
- Confirmação antes de ações destrutivas (excluir produto, remover membro)
- Feedback de carregamento em operações com Supabase (skeleton ou spinner)
- Pull-to-refresh em listas de estoque e fiado
- Vibração haptica ao confirmar venda (Vibration API — Android)

---

## 8. Roadmap de Evolução

### MVP — "Funciona, resolve o problema" ✅

| Funcionalidade                        | Status |
| ------------------------------------- | ------ |
| Login com email e senha               | ✅ |
| Onboarding com criação de empresa     | ✅ |
| Convite de colaboradores por código   | ✅ |
| Cadastro de produtos                  | ✅ |
| Leitura de código de barras           | ✅ |
| Gestão de estoque (entrada/saída)     | ✅ |
| Registro de vendas (à vista e fiado)  | ✅ |
| Venda com múltiplos itens (carrinho)  | ✅ |
| Cadastro de clientes (para fiado)     | ✅ |
| Registro de pagamento de fiado        | ✅ |
| Alertas de estoque baixo              | ✅ |
| Alertas de vencimento próximo         | ✅ |
| Relatórios: estoque, vendas, fiado    | ✅ |
| Configurações do negócio              | ✅ |
| PWA instalável (homescreen)           | ✅ |

### Versão 1.1 — "Mais controle, mesma simplicidade"

| Funcionalidade                          |
| --------------------------------------- |
| Categorias de produtos                  |
| Export de relatórios para CSV           |
| Relatório de lucro/margem por período   |
| Gráfico simples de vendas por semana    |
| Filtro de histórico de vendas por data  |
| Suporte offline parcial (cache + fila)  |
| Google login                            |
| RLS configurada (bloqueador de segurança) |

### Versão 2.0 — "Negócio conectado"

| Funcionalidade                              |
| ------------------------------------------- |
| Permissões por papel (dono / operador)      |
| Atualização em tempo real entre dispositivos (Supabase Realtime) |
| Dashboard web com gráficos de evolução       |
| Histórico detalhado de compras por cliente   |
| Notificações in-app para estoque baixo       |
| Impressão de recibos simples (PDF)           |

### Versão 3.0 — "Plataforma SaaS"

| Funcionalidade                                |
| --------------------------------------------- |
| Onboarding self-service com planos de assinatura |
| Dashboards avançados e relatórios customizáveis  |
| Integração com WhatsApp (cobrança de fiado)      |
| Impressão de etiquetas com código de barras       |
| Múltiplos pontos de estoque / depósitos           |
| API pública para integrações                     |

---

## Apêndice: Bibliotecas

| Função                     | Biblioteca                    | Observação                                              |
| -------------------------- | ----------------------------- | ------------------------------------------------------- |
| Framework                  | `react` + `vite`              | —                                                       |
| Roteamento                 | `react-router` v7             | —                                                       |
| UI / Componentes           | `tailwindcss` + `shadcn/ui`   | —                                                       |
| Estado global              | `zustand`                     | —                                                       |
| Backend / Auth / DB        | `@supabase/supabase-js`       | —                                                       |
| ORM / Migrations           | `drizzle-orm` + `drizzle-kit` | Modo Postgres                                           |
| Barcode scanner            | `@zxing/browser`              | Mais maduro que html5-qrcode para browsers modernos     |
| Formulários                | `react-hook-form` + `zod`     | —                                                       |
| Datas                      | `date-fns`                    | —                                                       |
| Notificações in-app        | `sonner`                      | Toasts acessíveis                                       |
| PWA                        | `vite-plugin-pwa`             | Gera manifest e service worker automaticamente          |
| Geração de ícones / splash | `pwa-asset-generator`         | Gera ~25 splash screens iOS a partir de 1 ícone fonte   |
| Testes                     | `vitest`                      | Para testar domain/rules sem dependências de framework  |

## Apêndice: Testes

Cobertura atual:
- `stock.rules.ts` — 100%
- `sale.rules.ts` — 100%
- `credit.rules.ts` — 100%
- Hooks, repositórios e páginas — não cobertos

## Apêndice: Variáveis de Ambiente

```
VITE_SUPABASE_URL=https://<projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
DATABASE_URL=<connection-string>  # apenas para db:push — nunca commitar
```

## Apêndice: Comandos

```bash
npm run dev           # servidor de desenvolvimento
npm run build         # tsc + vite build → dist/
npm test              # vitest (todos os testes unitários)
npm run test:watch    # vitest em modo watch
npm run test:coverage # cobertura de testes
npm run db:generate   # gera migration a partir do schema.ts
npm run db:push       # aplica schema no Supabase (requer DATABASE_URL)
```
