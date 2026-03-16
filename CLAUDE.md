# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Living Documentation

The `docs/` folder contains three documents that must stay in sync with the codebase:

- `docs/PITCH.md` — product pitch (update when scope, target audience, or key features change)
- `docs/PRODUCT_STATUS.md` — current feature status and backlog (update when features are added, completed, or reprioritized; always update "Última atualização" date)
- `docs/TECH.md` — technical reference (update when stack, architecture, routes, DB schema, or conventions change; always update "Última atualização" date)

**MANDATORY — no exceptions:** before every commit (including bug fixes and UX changes), run through this checklist:

- [ ] Did I add, complete, or remove a feature? → update `PRODUCT_STATUS.md` (check/uncheck items, adjust backlog)
- [ ] Did I add/change a hook, repository method, route, convention, or DB schema? → update `TECH.md`
- [ ] Did I change the product scope or target audience? → update `PITCH.md`
- [ ] Did I update any doc? → bump "Última atualização" date in that doc

Docs are never optional. A commit that changes behavior without updating the relevant doc is incomplete.

## Commands

```bash
npm run dev          # dev server
npm run build        # tsc + vite build → dist/
npm test             # vitest run (all unit tests)
npm run test:watch   # vitest watch mode
npm run test:coverage
npm run db:generate  # drizzle-kit generate migration from schema.ts
npm run db:push      # push schema to Supabase (requires DATABASE_URL env var)
```

## Environment Variables

```
VITE_SUPABASE_URL=https://<projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

For `db:push`, also set `DATABASE_URL` (Supabase direct connection string — never commit this).

Copy `.env.local.example` → `.env.local`.

## Architecture

Four strict layers — imports flow downward only:

```
src/pages/          UI: React pages + components
src/application/    Hooks + Zustand stores (no business logic)
src/domain/         Pure TypeScript: types, rules, formatters (zero external deps)
src/infrastructure/ Supabase repository implementations
```

### Domain layer (`src/domain/`)
- `types.ts` — all entity interfaces and enums; all monetary values are **integers in centavos**
- `repositories/` — interface contracts (no Supabase imports)
- `rules/` — pure business functions (`stock.rules.ts`, `sale.rules.ts`, `credit.rules.ts`) — all unit-tested
- `formatters/currency.ts` — only place that converts cents ↔ display; `floatToCents()` / `centsToBRL()`

### Infrastructure layer (`src/infrastructure/`)
- `supabase/client.ts` — singleton Supabase client
- `supabase/*Repository.ts` — implement domain interfaces; each has a private `mapRow()` that converts snake_case DB columns to camelCase domain types
- `db/schema.ts` — Drizzle table definitions (source of truth for the DB schema)

### Application layer (`src/application/`)
- `stores/authStore.ts` — Zustand; session/user state
- `stores/settingsStore.ts` — Zustand with `localStorage` persist; `businessName`, `lowStockThreshold`, `expirationAlertDays`
- `hooks/useSales.ts` — **critical orchestration**: `createSale` is the only entry point that writes to `sales`, `stock_movements`, and `stock_entries`
- `hooks/useAuth.ts` — exports both `useAuthListener()` (call once in App) and `useAuth()` for components
- `hooks/useBarcode.ts` — wraps `@zxing/browser`; always call `stopScan()` on component unmount

### Routing
- `src/router/index.tsx` — React Router v7 `createBrowserRouter`
- `src/components/layout/ProtectedRoute.tsx` — redirects to `/login` if no session
- `src/components/layout/AppShell.tsx` — bottom nav + `<Outlet />`; all authenticated pages render inside this

## Key Technical Rules

- **All monetary values are integers (centavos).** Never use floats for money. Only `src/domain/formatters/currency.ts` converts for display.
- **`useSales.createSale`** is the single write path for stock decrements. No component should write to `stock_entries` directly.
- **RLS is the security layer.** Row Level Security policies in Supabase control data access. JS filters are not the security boundary.
- **Camera streams must be cleaned up.** Every component using `useBarcode.startScan()` must call `stopScan()` on unmount.
- **`z.coerce.number()` + zodResolver requires `as any` cast** (known zod v4 / react-hook-form v7 type compatibility issue). Use `z.output<typeof schema>` for the form type alias.
- **`erasableSyntaxOnly` is disabled** to allow class parameter properties (`private readonly` in constructors).

## Database Schema

Drizzle schema is at `src/infrastructure/db/schema.ts`. Tables: `user_profiles`, `products`, `stock_entries` (one row per product), `stock_movements` (append-only audit log), `customers`, `sales`, `credit_payments`. RLS must be applied manually after migration (see PRD section 4 for SQL).

Debt balance is always derived: `calcDebtBalance(creditSales, payments)` from `credit.rules.ts` — never stored.

## PRD

Full product requirements and data model: `stock-app-prd-tech.md`.
