# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This project is in the **specification phase**. The PRD and technical spec live in `stock-app-prd-tech.md`. No source code exists yet.

## What We're Building

A mobile-first PWA for stock management, targeted at small Brazilian merchants (feirantes, revendedores). Users manage products, stock in/out, sales (cash + credit/fiado), customer debts, and get alerts for low stock and expiring items.

## Planned Tech Stack

| Concern | Technology |
|---------|-----------|
| Framework | React 18 + TypeScript + Vite |
| Routing | React Router v7 |
| UI | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Backend/Auth | Supabase (Postgres + RLS + Auth) |
| ORM | Drizzle ORM |
| Forms | react-hook-form + zod |
| Barcode | @zxing/browser |
| Dates | date-fns |
| Toasts | Sonner |
| PWA | vite-plugin-pwa |
| Testing | vitest |
| Hosting | Vercel |

## Architecture

Four strict layers — dependencies only flow downward:

```
UI Layer          → React components (Tailwind + shadcn/ui)
Application Layer → React hooks (no business logic, just connects domain ↔ UI)
Domain Layer      → Pure TypeScript: types, entities, rules, formatters (zero external deps)
Infrastructure    → Supabase repository implementations (Drizzle ORM)
```

**Domain layer isolation** is a core design goal — it must remain free of React, Supabase, and browser APIs so it can be reused if the app migrates to React Native.

### Key Domain Modules (to be created)
- `domain/types.ts` — entity interfaces
- `domain/repositories/` — repository interface contracts (abstractions)
- `domain/rules/` — business logic (stock, sales, credit rules)
- `domain/formatters/` — currency and date formatters

### Infrastructure
- `infrastructure/supabase/` — concrete Drizzle-based implementations of repository interfaces

## Commands (once project is scaffolded)

```bash
npm run dev        # start dev server
npm run build      # production build
npm run test       # run vitest
npm run test:watch # vitest in watch mode
```

## Critical Technical Decisions

- **Prices as integers (centavos)** — never use floats for monetary values. `R$ 12,99` = `1299`.
- **Cloud-first for MVP** — no offline support in v1.0 (simpler architecture).
- **Supabase RLS** — all data access is gated by Row Level Security at the DB level; each user only sees their own data.
- **Immutable stock movements** — `stock_movements` is an append-only audit log; current stock is derived from `stock_entries`.
- **No backend code** — Supabase provides Auth + REST API; the app is a static SPA deployed to Vercel.

## Database Schema Overview

Core tables: `users`, `products`, `stock_entries`, `stock_movements` (immutable log), `sales`, `customers`, `credit_payments`.

Full schema with RLS policies is documented in `stock-app-prd-tech.md` section 4.
