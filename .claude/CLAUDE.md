# StockApp — contexto local Claude Code

## Arquitetura em camadas (imports só downward)

```
pages → application (hooks/stores) → domain (types/rules/formatters) → infrastructure (Supabase repos)
```

Violação de camada = **Crítico** — pare e alerte antes de qualquer commit.

## Convenções críticas

- **Dinheiro:** sempre em centavos (inteiros). Converter APENAS em `domain/formatters/currency.ts`. Nunca usar float.
- **Estoque:** `useSales.createSale()` é o ÚNICO caminho de escrita que decrementa estoque. Escrita direta em `stock_entries` ou `stock_movements` fora desse hook = **Crítico**.
- **Barcode:** todo componente que chama `useBarcode.startScan()` DEVE chamar `stopScan()` no unmount.
- **Zod + React Hook Form:** `z.coerce.number()` requer cast `as any` no zodResolver.
- **Fiado:** saldo sempre derivado — nunca armazenado no banco.
- **RLS:** é a fronteira de segurança. Toda query assume que RLS está ativo no Supabase.

## PM Agent

Contexto de produto: `~/Documents/workspace-projects/pm-agent/projects/stock-app/`
Tasks ativas: `pm-agent/projects/stock-app/tasks/active.md`
