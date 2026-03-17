# Lista de Vendas do Dia

**Status:** pendente
**Categoria:** feature
**Artefato:** Nova tela `src/pages/sales/SalesPage.tsx` + rota `/sales` + SummaryCard clicável na HomePage

---

## Objetivo

Permitir que o usuário clique em "Vendas hoje" na Home e veja a lista detalhada das vendas do dia, com produto, quantidade, valor, forma de pagamento e cliente (se fiado).

---

## Contexto

O card "Vendas hoje" na `HomePage` mostra o total, mas não tem drill-down. O usuário quer ver o que compôs esse valor. A `ReportsPage` também pode se beneficiar de um link para a lista ao clicar no total do período.

`saleRepo.listByUser` já suporta filtros `{ from, to }` — a query existe, só falta a UI.

---

## Escopo

### 1. `SalesPage` — lista de vendas por período

Criar `src/pages/sales/SalesPage.tsx`:

- Recebe período via query param: `/sales?period=today` (default), `week`, `month`
- Filtro de período no topo (tabs ou chips: Hoje / Semana / Mês)
- Lista de vendas: nome do produto, qtd, preço unit., total, badge de pagamento (À vista / Fiado), nome do cliente se fiado
- Total no rodapé
- Estado vazio: "Nenhuma venda neste período"
- Skeleton durante loading

Usar `useSales.load(filters)` que já existe.

### 2. Rota `/sales`

Adicionar em `src/router/index.tsx`: `{ path: 'sales', element: <SalesPage /> }`

### 3. SummaryCard clicável na HomePage

Tornar o card "Vendas hoje" clicável → navega para `/sales?period=today`.

---

## Entregável

- `src/pages/sales/SalesPage.tsx`
- `src/router/index.tsx` — rota `/sales`
- `src/pages/home/HomePage.tsx` — card "Vendas hoje" clicável
