# UX Consistency Refinement — Design Spec

**Data:** 2026-04-04
**Tipo:** Refinamento cirúrgico — padronização de componentes e consistência visual
**Escopo:** Bottom-up — criar componentes compartilhados + atualizar páginas para usá-los

---

## Contexto

O app tem um design system maduro (shadcn/ui + Tailwind tokens + Geist font) mas as páginas divergem na implementação: cores hardcoded, badges duplicados, filter chips com 2 estilos, padding inconsistente, empty states sem padrão. Este refinamento centraliza os padrões repetidos em componentes compartilhados e atualiza todas as páginas para usá-los.

**Público:** Mobile-first (comerciante no balcão) com uso desktop para gestão.

---

## Parte 1 — Componentes Compartilhados

### 1. PaymentBadge

**Localização:** `src/components/ui/payment-badge.tsx`

**API:**
```tsx
<PaymentBadge method="cash" | "card" | "pix" | "credit" size="sm" | "md" />
```

**Mapa de cores:**
| method | bg | text |
|---|---|---|
| cash | bg-green-100 | text-green-700 |
| card | bg-purple-100 | text-purple-700 |
| pix | bg-teal-100 | text-teal-700 |
| credit | bg-blue-100 | text-blue-700 |

**Classes:**
- `md` (default): `rounded-full px-2.5 py-0.5 text-xs font-semibold`
- `sm`: `rounded-full px-2 py-0.5 text-[10px] font-semibold`

**Substitui duplicação em:** SalesPage (lista + modal, 3 ocorrências), CheckoutPage (1 ocorrência).

---

### 2. FilterChips

**Localização:** `src/components/ui/filter-chips.tsx`

**API:**
```tsx
<FilterChips
  options={[{ label: string; value: string }]}
  value={string}
  onChange={(value: string) => void}
  variant="default" | "compact"
/>
```

**Estilos:**
- **default** (pill): container `flex gap-2 flex-wrap`, chip `rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors`
  - Ativo: `bg-foreground text-background`
  - Inativo: `bg-card text-muted-foreground border border-border/60`
- **compact** (nested): container `rounded-xl bg-muted p-0.5 gap-0.5 inline-flex`, chip `px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200`
  - Ativo: `bg-white text-foreground shadow-sm`
  - Inativo: `text-muted-foreground hover:text-foreground`

**Substitui duplicação em:** StockPage, SalesPage (variant default), ReportsPage, CustomersPage (variant compact).

---

### 3. EmptyState

**Localização:** `src/components/ui/empty-state.tsx`

**API:**
```tsx
<EmptyState icon={LucideIcon} message="Nenhum produto encontrado" />
```

**Classes:**
- Container: `py-16 text-center`
- Ícone: `mx-auto mb-3 h-10 w-10 text-muted-foreground/30` com `strokeWidth={1.5}`
- Texto: `text-sm text-muted-foreground`

**Ícone obrigatório** — hoje só CustomersPage tem ícone; todas as instâncias passam a ter.

**Ícones sugeridos por página:**
| Página | Ícone |
|---|---|
| StockPage | Package |
| SalesPage | Receipt |
| CartPage | ShoppingCart |
| CustomersPage | Users |
| CustomerDetailPage | Clock |

**Substitui duplicação em:** StockPage, SalesPage, CartPage, CustomersPage, CustomerDetailPage (5+ ocorrências).

---

### 4. PageHeader

**Localização:** `src/components/ui/page-header.tsx`

**API:**
```tsx
<PageHeader
  title="Produtos"
  subtitle="23 produtos cadastrados"  // opcional
  actions={<>{buttons}</>}            // opcional
/>
```

**Classes:**
- Container: `px-5 pt-8 pb-6 md:px-8`
- Layout: `flex items-start justify-between`
- Título: `text-2xl font-bold tracking-tight`
- Subtítulo: `text-sm text-muted-foreground font-medium mt-0.5`

**Padding padronizado:** resolve a variação entre px-4/px-5/px-6 e pt-6/pt-8 entre páginas.

**Substitui duplicação em:** todas as páginas internas (Home, Stock, Sales, Customers, Reports, Settings).

---

### 5. StatCard

**Localização:** `src/components/ui/stat-card.tsx`

**API:**
```tsx
<StatCard
  label="Fiado em aberto"
  value="R$ 3.200"
  variant="default" | "credit"
  icon={LucideIcon}       // opcional
  onClick={() => void}    // opcional, torna clicável
/>
```

**Estilos:**
- **default**: `rounded-2xl bg-card p-5 shadow-sm`
  - Label: `text-xs text-muted-foreground font-medium`
  - Value: `text-2xl font-bold tracking-tight`
- **credit**: `rounded-2xl bg-credit p-5` (usa token CSS `--color-credit` que já existe)
  - Label: `text-sm text-blue-200 font-medium`
  - Value: `text-3xl font-bold text-white leading-none tracking-tight`
- **clickable** (quando onClick presente): adiciona `active:scale-[0.98] transition-transform cursor-pointer`

**Resolve:** eliminação do hardcoded `bg-[#1e3a8a]` em 4 páginas, passando a usar o token `--color-credit`.

**Substitui duplicação em:** HomePage (SummaryCard local + card azul), SalesPage, ReportsPage, CustomersPage.

---

## Parte 2 — Padronização por Página

### HomePage
- SummaryCard local → `StatCard` (default + credit)
- Card azul `bg-[#1e3a8a]` → `StatCard variant="credit"`
- Header → `PageHeader` (padroniza padding)
- Empty states dos alertas (hoje somem) → `EmptyState` se relevante

### StockPage
- Filter chips inline → `FilterChips`
- Empty state texto → `EmptyState icon={Package}`
- Header → `PageHeader`

### CartPage
- Input raw de preço (`<input>` puro) → componente `Input` do shadcn
- Empty state carrinho → `EmptyState icon={ShoppingCart}`
- `pb-32` hardcoded → variável CSS ou calc baseado na altura do BottomNav

### CheckoutPage
- Badges de pagamento inline → `PaymentBadge`
- Grid `grid-cols-2` fixo → `sm:grid-cols-2` (responsive)

### SalesPage
- Badges inline (lista + modal) → `PaymentBadge` (sm na lista, md no modal)
- Period chips → `FilterChips`
- Empty state → `EmptyState icon={Receipt}`
- Header → `PageHeader`

### CustomersPage
- Card azul hardcoded → `StatCard variant="credit"`
- Empty state → migrar para `EmptyState` component
- Header → `PageHeader`
- Tab chips → `FilterChips variant="compact"`

### CustomerDetailPage
- Card de saldo `bg-blue-50` → `StatCard variant="credit"`
- Empty state histórico → `EmptyState icon={Clock}`

### ReportsPage
- Period selector → `FilterChips variant="compact"`
- Card azul → `StatCard variant="credit"`
- Header → `PageHeader`

### SettingsPage
- Lista de membros com estilos inline → usar `Card` do shadcn
- Status badge inline → `Badge` do shadcn

---

## Parte 3 — Regras Transversais

| Aspecto | Antes | Depois |
|---|---|---|
| Padding horizontal | px-4 / px-5 / px-6 (varia) | `px-5 md:px-8` (via PageHeader) |
| Press feedback | Só em algumas telas | `active:scale-[0.99]` em todo item clicável |
| Cores hardcoded | `bg-[#1e3a8a]`, `bg-white` | `bg-credit`, `bg-card` (tokens CSS) |
| List item cards | Classes inline repetidas | Padrão: `rounded-2xl bg-card px-4 py-3.5 shadow-sm active:scale-[0.99] transition-all duration-150` |

---

## Escopo Negativo

- **Não muda fluxos** — navegação, rotas, ordem de telas inalterados
- **Não muda identidade visual** — cores, tipografia, border-radius, shadows mantêm padrão atual
- **Não muda lógica de negócio** — hooks, stores, repositórios intocados
- **Não cria ListItem component** — classes inline consistentes são suficientes
- **Não mexe em auth pages** — Login/Signup/Reset funcionam bem isoladas
- **Não adiciona animações novas** — só padroniza o `active:scale` existente
