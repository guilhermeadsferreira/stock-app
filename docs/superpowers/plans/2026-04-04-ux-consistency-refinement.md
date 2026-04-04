# UX Consistency Refinement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate UI inconsistencies by creating 5 shared components and updating 9 pages to use them.

**Architecture:** Bottom-up approach — create reusable components first (PaymentBadge, FilterChips, EmptyState, PageHeader, StatCard), then sweep through each page replacing inline patterns with the new components. No business logic changes.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, shadcn/ui (CVA pattern), Lucide icons

---

## File Structure

**New files:**
- `src/components/ui/payment-badge.tsx` — PaymentBadge component
- `src/components/ui/filter-chips.tsx` — FilterChips component
- `src/components/ui/empty-state.tsx` — EmptyState component
- `src/components/ui/page-header.tsx` — PageHeader component
- `src/components/ui/stat-card.tsx` — StatCard component

**Modified files:**
- `src/pages/home/HomePage.tsx` — use StatCard, PageHeader
- `src/pages/stock/StockPage.tsx` — use FilterChips, EmptyState, PageHeader
- `src/pages/sales/SalesPage.tsx` — use PaymentBadge, FilterChips, EmptyState, PageHeader
- `src/pages/sales/CartPage.tsx` — use EmptyState, fix Input, fix pb-32
- `src/pages/sales/CheckoutPage.tsx` — use PaymentBadge, fix grid responsive
- `src/pages/customers/CustomersPage.tsx` — use StatCard, FilterChips, EmptyState, PageHeader
- `src/pages/customers/CustomerDetailPage.tsx` — use StatCard, EmptyState
- `src/pages/reports/ReportsPage.tsx` — use StatCard, FilterChips, PageHeader
- `src/pages/settings/SettingsPage.tsx` — use Badge, Card for members list

---

### Task 1: Create PaymentBadge component

**Files:**
- Create: `src/components/ui/payment-badge.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { cn } from '@/lib/utils'

type PaymentMethod = 'cash' | 'card' | 'pix' | 'credit'

const colorMap: Record<PaymentMethod, string> = {
  cash: 'bg-green-100 text-green-700',
  card: 'bg-purple-100 text-purple-700',
  pix: 'bg-teal-100 text-teal-700',
  credit: 'bg-blue-100 text-blue-700',
}

const labelMap: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  card: 'Cartão',
  pix: 'PIX',
  credit: 'Fiado',
}

export function PaymentBadge({
  method,
  size = 'md',
  className,
}: {
  method: PaymentMethod
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      className={cn(
        'rounded-full font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        colorMap[method],
        className,
      )}
    >
      {labelMap[method]}
    </span>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to payment-badge.tsx

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/payment-badge.tsx
git commit -m "feat(ui): cria componente PaymentBadge"
```

---

### Task 2: Create FilterChips component

**Files:**
- Create: `src/components/ui/filter-chips.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { cn } from '@/lib/utils'

interface FilterChipsProps<T extends string> {
  options: { label: string; value: T }[]
  value: T
  onChange: (value: T) => void
  variant?: 'default' | 'compact'
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  variant = 'default',
}: FilterChipsProps<T>) {
  if (variant === 'compact') {
    return (
      <div className="inline-flex rounded-xl bg-muted p-0.5 gap-0.5">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
              value === opt.value
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
            value === opt.value
              ? 'bg-foreground text-background'
              : 'bg-card text-muted-foreground border border-border/60',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to filter-chips.tsx

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/filter-chips.tsx
git commit -m "feat(ui): cria componente FilterChips"
```

---

### Task 3: Create EmptyState component

**Files:**
- Create: `src/components/ui/empty-state.tsx`

- [ ] **Step 1: Create the component**

```tsx
import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  message,
}: {
  icon: LucideIcon
  message: string
}) {
  return (
    <div className="py-16 text-center">
      <Icon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to empty-state.tsx

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/empty-state.tsx
git commit -m "feat(ui): cria componente EmptyState"
```

---

### Task 4: Create PageHeader component

**Files:**
- Create: `src/components/ui/page-header.tsx`

- [ ] **Step 1: Create the component**

```tsx
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="px-5 pt-8 pb-6 md:px-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground font-medium mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to page-header.tsx

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/page-header.tsx
git commit -m "feat(ui): cria componente PageHeader"
```

---

### Task 5: Create StatCard component

**Files:**
- Create: `src/components/ui/stat-card.tsx`

- [ ] **Step 1: Create the component**

The `bg-credit` class works because `--color-credit: #1e3a8a` is defined in `@theme` in `src/index.css`. Tailwind v4 auto-generates utility classes from `@theme` color variables.

```tsx
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | null
  variant?: 'default' | 'credit'
  icon?: LucideIcon
  onClick?: () => void
  children?: React.ReactNode
}

export function StatCard({ label, value, variant = 'default', icon: Icon, onClick, children }: StatCardProps) {
  const isCredit = variant === 'credit'

  const content = (
    <>
      <div className={cn('flex items-center gap-1.5 mb-3', isCredit ? 'text-blue-200' : 'text-muted-foreground')}>
        {Icon && <Icon className="h-4 w-4" strokeWidth={1.75} />}
        <p className={cn('font-medium', isCredit ? 'text-sm' : 'text-xs')}>{label}</p>
      </div>
      {value === null
        ? <Skeleton className={cn('h-8 w-32', isCredit && 'bg-white/20')} />
        : <p className={cn(
            'font-bold leading-none tracking-tight',
            isCredit ? 'text-3xl text-white' : 'text-2xl text-foreground',
          )}>
            {value}
          </p>
      }
      {children}
    </>
  )

  const baseClass = cn(
    'rounded-2xl p-5',
    isCredit ? 'bg-credit' : 'bg-card shadow-sm',
    onClick && 'active:scale-[0.98] transition-transform cursor-pointer w-full text-left',
  )

  if (onClick) {
    return <button onClick={onClick} className={baseClass}>{content}</button>
  }

  return <div className={baseClass}>{content}</div>
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to stat-card.tsx

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/stat-card.tsx
git commit -m "feat(ui): cria componente StatCard"
```

---

### Task 6: Update HomePage

**Files:**
- Modify: `src/pages/home/HomePage.tsx`

- [ ] **Step 1: Replace SummaryCard + credit card with StatCard and add PageHeader**

Replace the entire file. Key changes:
- Remove local `SummaryCard` component (lines 146-167)
- Replace hardcoded header (lines 26-39) with `PageHeader` — but HomePage has a custom greeting pattern, so keep its custom header and just standardize the padding
- Replace `bg-[#1e3a8a]` credit card (lines 114-132) with `StatCard variant="credit"`
- Replace SummaryCard usages (lines 99-111) with `StatCard`

Update imports — add:
```tsx
import { StatCard } from '@/components/ui/stat-card'
```

Replace **SummaryCard grid** (lines 98-111) with:
```tsx
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Package}
          label="Valor em estoque"
          value={loading ? null : centsToBRL(data?.stockValue ?? 0)}
        />
        <StatCard
          icon={TrendingUp}
          label="Vendas hoje"
          value={loading ? null : centsToBRL(data?.allSalesTotal ?? 0)}
          onClick={() => navigate('/sales?period=today')}
        />
      </div>
```

Replace **credit card block** (lines 113-132) with:
```tsx
      {/* Card de fiado */}
      <StatCard
        variant="credit"
        icon={Users}
        label="Fiado em aberto"
        value={loading ? null : centsToBRL(data?.openCreditTotal ?? 0)}
        onClick={() => navigate('/customers')}
      >
        {!loading && (data?.openCreditCustomerCount ?? 0) > 0 && (
          <span className="mt-3 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-blue-100">
            {data!.openCreditCustomerCount} cliente{data!.openCreditCustomerCount > 1 ? 's' : ''}
          </span>
        )}
      </StatCard>
```

Remove the `SummaryCard` function at the bottom of the file (lines 146-167) — it's now replaced by `StatCard`.

Remove `Skeleton` from imports (StatCard handles its own loading state).

- [ ] **Step 2: Verify it compiles and renders**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/pages/home/HomePage.tsx
git commit -m "refactor(home): usa StatCard no lugar de SummaryCard e card azul hardcoded"
```

---

### Task 7: Update StockPage

**Files:**
- Modify: `src/pages/stock/StockPage.tsx`

- [ ] **Step 1: Replace filter chips, empty state, and header**

Update imports — add:
```tsx
import { FilterChips } from '@/components/ui/filter-chips'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Package } from 'lucide-react'
```

Update existing lucide import to include `Package` (it's not currently imported in StockPage). Remove `cn` import if no longer used.

Replace **header block** (lines 68-81). The current structure is:
```tsx
    <div className="space-y-4 px-5 pt-8 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
        <div className="flex gap-2">
          ...buttons...
        </div>
      </div>
```

Replace with — note the outer div loses its padding since PageHeader provides it:
```tsx
    <div className="space-y-4">
      <PageHeader
        title="Produtos"
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => navigate('/stock/scan')} className="rounded-xl gap-1.5">
              <ScanLine className="h-3.5 w-3.5" strokeWidth={2.5} />
              Scan
            </Button>
            <Button size="sm" onClick={() => navigate('/stock/new')} className="rounded-xl gap-1.5">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Novo
            </Button>
          </>
        }
      />
```

All content below the PageHeader needs horizontal padding since the outer div no longer provides it. Wrap the remaining content (search, chips, list) in a `<div className="px-5 md:px-8 space-y-4">`:

```tsx
      <div className="px-5 md:px-8 space-y-4">
        {/* search input stays the same */}
        ...

        {/* Replace filter chips (lines 93-108) */}
        <FilterChips
          options={chips}
          value={activeFilter}
          onChange={setFilter}
        />

        {/* Replace empty state (lines 114-117) */}
        ...
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            message={search || activeFilter !== 'all' ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado ainda'}
          />
        ) : (
        ...
      </div>
```

Remove `cn` import if it's no longer used elsewhere in the file.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/stock/StockPage.tsx
git commit -m "refactor(stock): usa PageHeader, FilterChips e EmptyState"
```

---

### Task 8: Update SalesPage

**Files:**
- Modify: `src/pages/sales/SalesPage.tsx`

- [ ] **Step 1: Replace payment badges, period chips, empty state, and header**

Update imports — add:
```tsx
import { PaymentBadge } from '@/components/ui/payment-badge'
import { FilterChips } from '@/components/ui/filter-chips'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Receipt } from 'lucide-react'
```

**Remove** the `paymentBadge` record (lines 51-56) — no longer needed. Keep `paymentLabel` (used for summary text) and `statusBadge`/`statusLabel` (used in modal).

**Replace header** (lines 127-128). Current:
```tsx
    <div className="space-y-4 px-5 pt-8 pb-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
```

Replace outer div and header:
```tsx
    <div className="space-y-4">
      <PageHeader title="Vendas" />
      <div className="px-5 pb-8 md:px-8 space-y-4">
```

Close the inner `</div>` before the closing `</div>` of the component (before the Dialog).

**Replace period chips** (lines 131-146):
```tsx
        <FilterChips
          options={Object.entries(periodLabels).map(([value, label]) => ({ value: value as Period, label }))}
          value={period}
          onChange={(p) => setSearchParams({ period: p })}
        />
```

**Replace payment badge in list item** (lines 207-212):
```tsx
                    <PaymentBadge method={sale.paymentType as 'cash' | 'card' | 'pix' | 'credit'} size="sm" />
```

**Replace payment badge in modal** (line 272):
```tsx
                  <PaymentBadge method={selectedSale.paymentType as 'cash' | 'card' | 'pix' | 'credit'} />
```

**Replace empty state** (lines 171-174):
```tsx
        <EmptyState icon={Receipt} message="Nenhuma venda neste período" />
```

Remove `cn` import only if no longer used (it is still used for `statusBadge` in the modal).

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/sales/SalesPage.tsx
git commit -m "refactor(sales): usa PaymentBadge, FilterChips, EmptyState e PageHeader"
```

---

### Task 9: Update CartPage

**Files:**
- Modify: `src/pages/sales/CartPage.tsx`

- [ ] **Step 1: Replace empty state and fix raw input**

Update imports — add:
```tsx
import { EmptyState } from '@/components/ui/empty-state'
import { ShoppingCart } from 'lucide-react'
```

**Replace raw `<input>` for price editing** (lines 182-192). Replace:
```tsx
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            inputMode="decimal"
                            value={editPriceValue}
                            onChange={e => setEditPriceValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && confirmEditPrice(item.product.id)}
                            className="w-20 rounded border px-1 py-0.5 text-sm"
                            autoFocus
                          />
```
With:
```tsx
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            inputMode="decimal"
                            value={editPriceValue}
                            onChange={e => setEditPriceValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && confirmEditPrice(item.product.id)}
                            className="w-20 h-7 px-1.5 text-sm"
                            autoFocus
                          />
```

`Input` is already imported in CartPage.

**Replace empty state** (lines 248-252):
```tsx
        {items.length === 0 && !showSearchResults && (
          <EmptyState icon={ShoppingCart} message="Busque um produto ou escaneie o código de barras para começar" />
        )}
```

**Fix pb-32 hardcoded** (line 106). Replace:
```tsx
        <div className="flex-1 space-y-4 px-4 pt-6 pb-32">
```
With:
```tsx
        <div className="flex-1 space-y-4 px-4 pt-6 pb-[calc(theme(spacing.16)+env(safe-area-inset-bottom)+4rem)]">
```

Actually, `pb-32` (128px) is roughly correct for the fixed footer (h ~60px) + bottom nav (h ~60px) + some padding. The issue is fragility, but changing to a calc would be over-engineering. A simpler fix: use `pb-36` which gives more breathing room and matches other patterns. Actually, let's keep `pb-32` — it works and changing it introduces risk. Skip this sub-step.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/sales/CartPage.tsx
git commit -m "refactor(cart): usa EmptyState e Input do shadcn no editor de preço"
```

---

### Task 10: Update CheckoutPage

**Files:**
- Modify: `src/pages/sales/CheckoutPage.tsx`

- [ ] **Step 1: Fix grid responsive**

The payment method buttons on CheckoutPage (lines 151-196) use hardcoded colors per method. These are **selection buttons** (not badges), so PaymentBadge doesn't replace them — they have a fundamentally different UI pattern (large tappable cards with emoji + label). The spec says to use PaymentBadge here, but these are selectable cards, not inline badges.

What we **can** fix: make the grid responsive by changing line 151:
```tsx
      <div className="grid grid-cols-2 gap-3">
```
To:
```tsx
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
```

This gives a 2-col layout on mobile and 4-col on wider screens.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/sales/CheckoutPage.tsx
git commit -m "refactor(checkout): torna grid de pagamento responsivo"
```

---

### Task 11: Update CustomersPage

**Files:**
- Modify: `src/pages/customers/CustomersPage.tsx`

- [ ] **Step 1: Replace credit card, tabs, empty state, and header**

Update imports — add:
```tsx
import { StatCard } from '@/components/ui/stat-card'
import { FilterChips } from '@/components/ui/filter-chips'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
```

**Replace header** (lines 116-126). Current outer div has padding. Change to:
```tsx
    <div className="space-y-4 pb-8">
      <PageHeader
        title="Clientes"
        actions={
          <button
            onClick={() => setDialogOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm active:scale-95 transition-transform"
            aria-label="Novo cliente"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        }
      />
      <div className="px-5 md:px-8 space-y-4">
```

Close inner `</div>` before the Dialog.

**Replace credit card** (lines 128-136):
```tsx
      {!loading && creditCount > 0 && (
        <StatCard
          variant="credit"
          label="Total em fiado"
          value={centsToBRL(totalCredit)}
        >
          <p className="text-xs text-blue-300 mt-2">
            {creditCount} cliente{creditCount !== 1 ? 's' : ''} com saldo em aberto
          </p>
        </StatCard>
      )}
```

**Replace tab chips** (lines 138-154):
```tsx
        <FilterChips
          options={[
            { label: 'Todos', value: 'all' as Tab },
            { label: 'Fiado em aberto', value: 'credit' as Tab },
          ]}
          value={tab}
          onChange={setTab}
          variant="compact"
        />
```

**Replace empty state** (lines 166-172):
```tsx
        <EmptyState
          icon={Users}
          message={tab === 'credit' ? 'Nenhum fiado em aberto' : 'Nenhum cliente cadastrado'}
        />
```

Remove `cn` import if no longer used elsewhere. Remove `Users` from lucide import only if the empty state was the last usage — but `Users` is still used by EmptyState via the icon prop, so keep the import.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/customers/CustomersPage.tsx
git commit -m "refactor(customers): usa StatCard, FilterChips, EmptyState e PageHeader"
```

---

### Task 12: Update CustomerDetailPage

**Files:**
- Modify: `src/pages/customers/CustomerDetailPage.tsx`

- [ ] **Step 1: Replace balance card and empty state**

Update imports — add:
```tsx
import { StatCard } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Clock } from 'lucide-react'
```

**Replace balance card** (lines 95-101):
```tsx
      <StatCard
        variant="credit"
        label="Saldo devedor"
        value={loading ? null : centsToBRL(balance)}
      />
```

**Replace empty state** (lines 155-156). Current:
```tsx
          <p className="text-sm text-muted-foreground">Nenhum registro ainda</p>
```
Replace with:
```tsx
          <EmptyState icon={Clock} message="Nenhum registro ainda" />
```

Remove `Skeleton` import if no longer used directly (StatCard handles its own). Check: Skeleton is still used on line 154 for the history loading state, so keep it.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/customers/CustomerDetailPage.tsx
git commit -m "refactor(customer-detail): usa StatCard e EmptyState"
```

---

### Task 13: Update ReportsPage

**Files:**
- Modify: `src/pages/reports/ReportsPage.tsx`

- [ ] **Step 1: Replace period selector, credit card, and header**

Update imports — add:
```tsx
import { StatCard } from '@/components/ui/stat-card'
import { FilterChips } from '@/components/ui/filter-chips'
import { PageHeader } from '@/components/ui/page-header'
```

**Replace outer div and header** (lines 22-24). Current:
```tsx
    <div className="space-y-4 px-5 pt-8 pb-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
```

Replace:
```tsx
    <div className="space-y-4">
      <PageHeader title="Relatórios" />
      <div className="px-5 pb-8 md:px-8 space-y-4">
```

Close inner `</div>` before the component's closing `</div>`.

**Replace stock value card** (lines 27-33). Current:
```tsx
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <p className="text-xs font-medium text-muted-foreground mb-3">Valor total em estoque</p>
        {loading
          ? <Skeleton className="h-8 w-36" />
          : <p className="text-3xl font-bold text-foreground leading-none tracking-tight">{centsToBRL(data?.stockValue ?? 0)}</p>
        }
      </div>
```

Replace:
```tsx
      <StatCard
        label="Valor total em estoque"
        value={loading ? null : centsToBRL(data?.stockValue ?? 0)}
      />
```

**Replace period selector** (lines 39-54). Current inline buttons inside the sales card. Replace:
```tsx
          <div className="flex rounded-xl bg-muted p-0.5 gap-0.5">
            {(Object.keys(periodLabels) as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                  period === p
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
```

With:
```tsx
          <FilterChips
            options={Object.entries(periodLabels).map(([value, label]) => ({ value: value as Period, label }))}
            value={period}
            onChange={setPeriod}
            variant="compact"
          />
```

**Replace credit card** (lines 76-88). Current:
```tsx
      <button
        onClick={() => navigate('/customers')}
        className="w-full rounded-2xl bg-[#1e3a8a] p-5 text-left transition-opacity active:opacity-90"
      >
        <p className="text-sm font-medium text-blue-200 mb-3">Fiado em aberto</p>
        {loading
          ? <Skeleton className="h-8 w-32 bg-white/20" />
          : <p className="text-3xl font-bold text-white leading-none tracking-tight">{centsToBRL(data?.openCreditTotal ?? 0)}</p>
        }
        {!loading && (data?.openCreditCustomerCount ?? 0) > 0 && (
          <p className="text-xs text-blue-300 mt-2">{data!.openCreditCustomerCount} clientes</p>
        )}
      </button>
```

Replace:
```tsx
      <StatCard
        variant="credit"
        label="Fiado em aberto"
        value={loading ? null : centsToBRL(data?.openCreditTotal ?? 0)}
        onClick={() => navigate('/customers')}
      >
        {!loading && (data?.openCreditCustomerCount ?? 0) > 0 && (
          <p className="text-xs text-blue-300 mt-2">{data!.openCreditCustomerCount} clientes</p>
        )}
      </StatCard>
```

Remove `cn` import if no longer used. Remove `Skeleton` import if no longer used directly (check: Skeleton is used on line 57 for sales total loading — but that will be replaced if we use StatCard... actually the sales total card is a more complex card with breakdown, so it stays as-is). Keep `Skeleton` if still referenced.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/reports/ReportsPage.tsx
git commit -m "refactor(reports): usa StatCard, FilterChips e PageHeader"
```

---

### Task 14: Update SettingsPage

**Files:**
- Modify: `src/pages/settings/SettingsPage.tsx`

- [ ] **Step 1: Replace members list styling with Card and Badge**

Update imports — add:
```tsx
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
```

**Replace header** (lines 150-151). Current:
```tsx
    <div className="space-y-6 px-4 pt-6 pb-8">
      <h1 className="text-xl font-bold">Configurações</h1>
```

Replace:
```tsx
    <div className="space-y-6">
      <PageHeader title="Configurações" />
      <div className="px-5 md:px-8 space-y-6 pb-8">
```

Close inner `</div>` before the component's closing `</div>`.

**Replace member row** (lines 283-304). Current:
```tsx
              <div key={member.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-sm">{member.email}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    member.isOwner
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {member.isOwner ? 'Dono' : 'Membro'}
                  </span>
                </div>
```

Replace with:
```tsx
              <div key={member.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-sm">{member.email}</span>
                  <Badge variant={member.isOwner ? 'default' : 'secondary'}>
                    {member.isOwner ? 'Dono' : 'Membro'}
                  </Badge>
                </div>
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/settings/SettingsPage.tsx
git commit -m "refactor(settings): usa Badge do shadcn e PageHeader"
```

---

### Task 15: Final verification and build

- [ ] **Step 1: Run full type check**

Run: `npx tsc --noEmit --pretty`
Expected: 0 errors

- [ ] **Step 2: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: All existing tests pass (domain rules + cart store tests are unaffected since we changed no business logic)

- [ ] **Step 4: Visual smoke test**

Run: `npm run dev`

Open browser and verify:
- HomePage: StatCards render with correct colors, credit card uses bg-credit
- StockPage: FilterChips work, empty state shows Package icon
- SalesPage: PaymentBadge shows in list + modal, FilterChips work
- CartPage: Price editor uses Input component, empty state shows ShoppingCart icon
- CheckoutPage: Grid is responsive
- CustomersPage: StatCard credit, FilterChips compact, EmptyState with Users icon
- CustomerDetailPage: StatCard credit for balance, EmptyState with Clock icon
- ReportsPage: StatCard, FilterChips compact, credit card uses bg-credit
- SettingsPage: Members use Badge component, PageHeader consistent

- [ ] **Step 5: Commit any final fixes if needed**

```bash
git add -A
git commit -m "fix(ui): ajustes finais da revisão visual"
```
