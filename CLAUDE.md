# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and to Cursor when working with code in this repository.

## ⚠️ PRODUÇÃO COM DADOS REAIS

**Este projeto está em produção desde 2026-03-21 com clientes reais cadastrando estoque.**

Antes de qualquer mudança:
- **NUNCA** rodar `TRUNCATE` ou `DELETE` sem cláusula `WHERE` no banco de produção
- **NUNCA** fazer `db:push` direto em produção sem revisar a migration gerada
- Migrations destrutivas (drop column, rename table) exigem confirmação explícita do usuário
- Mudanças em RLS policies podem bloquear acesso dos clientes — testar localmente antes
- Em caso de dúvida sobre impacto: **perguntar antes de executar**

## PM Agent

Este projeto é gerenciado pelo PM Agent. Todo o contexto de produto vive lá:

**Caminho:** `/Users/guilhermeaugusto/Documents/workspace-projects/pm-agent/projects/stock-app/`

```
pm-agent/projects/stock-app/
├── README.md          → visão geral, status, decisões-chave
├── PRD.md             → requisitos e escopo
├── decisions/         → PDRs (decisões arquiteturais e de produto)
├── tasks/
│   ├── backlog.md     → tasks priorizadas
│   ├── active.md      → em andamento
│   └── done/          → tasks concluídas com contexto completo
├── docs/              → pitch, tech, product status, roteiro de testes
└── cycles/            → ciclos Shape Up planejados
```

Antes de implementar qualquer feature, consulte `tasks/backlog.md` ou `tasks/active.md` para entender o escopo e critérios de aceite.

**Cursor:** Os fluxos equivalentes aos comandos do Claude estão em `.cursor/skills/` (git-commit, plan-task, product-review, new-task). Use-os ao pedir "commitar", "planejar a task X", "revisão de produto" ou "criar uma task".

## Living Documentation

A documentação de produto vive no PM Agent — não neste repo. Ao fazer qualquer alteração relevante, atualize os arquivos correspondentes em:

**`/Users/guilhermeaugusto/Documents/workspace-projects/pm-agent/projects/stock-app/docs/`**

| Documento | Onde | Quando atualizar |
|---|---|---|
| `docs/PRODUCT_STATUS.md` | pm-agent | Ao adicionar, concluir ou remover uma feature |
| `docs/PITCH.md` | pm-agent | Ao mudar escopo ou público-alvo |
| `PRD_TECH.md` | raiz deste repo | Ao mudar stack, arquitetura, rotas, schema DB ou convenções técnicas |

**MANDATORY — no exceptions:** before every commit (including bug fixes and UX changes), run through this checklist:

- [ ] Adicionei, conclui ou removi uma feature? → atualizar `docs/PRODUCT_STATUS.md` no pm-agent
- [ ] Mudei stack, arquitetura, schema, rotas ou convenções técnicas? → atualizar `PRD_TECH.md` na raiz deste repo
- [ ] Mudei escopo ou público-alvo? → atualizar `docs/PITCH.md` no pm-agent
- [ ] Conclui uma task? → mover de `tasks/active.md` para `tasks/done/` no pm-agent
- [ ] Atualizei algum doc? → bumpar "Última atualização" nesse doc

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

- Produto: `/Users/guilhermeaugusto/Documents/workspace-projects/pm-agent/projects/stock-app/PRD.md`
- Técnico: `PRD_TECH.md` (raiz deste repo)
