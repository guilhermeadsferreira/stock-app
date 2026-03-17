# Relatórios — Visão Unificada de Vendas (à vista + fiado)

**Status:** pendente
**Categoria:** feature
**Artefato:** `src/pages/reports/ReportsPage.tsx` e `src/pages/sales/SalesPage.tsx` revisados + `src/application/hooks/useReports.ts` ajustado

---

## Objetivo

Reestruturar a tela de Relatórios para exibir o **total de vendas do período (à vista + fiado)** como métrica principal, com detalhamento por tipo de pagamento — eliminando a visão parcial atual que mostra apenas "Vendas à vista".

---

## Contexto

### Situação atual

A tela de Relatórios exibe:
- **"Vendas à vista"** — soma de `cashSalesTotal` (apenas `paymentType === 'cash'`)
- **"Fiado em aberto"** — débito total acumulado de todos os clientes (sem filtro de período)
- Filtros de período: Hoje / Semana / Mês

O problema: venda fiado **não aparece no total de vendas do período**. Um negócio que faz muitas vendas fiado enxerga um número enganoso — parece que vendeu menos do que realmente vendeu.

A lógica correta já existe no hook: `allSalesTotal` (`cash + credit` no período) e `cashSalesTotal` (só cash). A correção é majoritamente de **apresentação**, com um ajuste na semântica do que é exibido.

### O que já existe e funciona

```typescript
// useReports.ts — ReportData já tem:
allSalesTotal: number      // vendas à vista + fiado no período ✓
cashSalesTotal: number     // só à vista no período ✓
openCreditTotal: number    // fiado em aberto (todos os clientes, sem filtro de período) ✓
openCreditCustomerCount: number
```

A HomePoage já foi corrigida (commit `147a36e`) para usar `allSalesTotal` em "Vendas hoje". O mesmo raciocínio deve ser aplicado à ReportsPage.

### Como os tipos de venda se comportam no período

- **À vista** (`paymentType: 'cash'`): a venda acontece e é paga no mesmo momento → faz sentido somar no período da venda
- **Fiado** (`paymentType: 'credit'`): a venda acontece em um momento, o pagamento em outro → o `allSalesTotal` considera **quando a venda foi feita**, não quando foi paga. Isso é correto para "quanto vendi neste período".

---

## Escopo

### Etapa 1 — Revisar e ajustar `useReports.ts`

**Camada:** application (`src/application/hooks/useReports.ts`)

Verificar se `ReportData` precisa de um campo adicional para exibir o breakdown:

```typescript
export interface ReportData {
  // já existem:
  allSalesTotal: number           // total do período (cash + credit)
  cashSalesTotal: number          // só cash no período
  openCreditTotal: number         // débito acumulado (sem filtro de período)
  openCreditCustomerCount: number

  // adicionar:
  creditSalesTotal: number        // só fiado no período (= allSalesTotal - cashSalesTotal)
  // (pode ser calculado no hook sem query extra, pois allSalesTotal já existe)
}
```

`creditSalesTotal` pode ser derivado sem nova query:
```typescript
creditSalesTotal: allSalesTotal - cashSalesTotal
```

Critérios de sucesso:
- `ReportData` expõe os três valores: `allSalesTotal`, `cashSalesTotal`, `creditSalesTotal`
- Nenhuma query extra no banco (cálculo derivado)

---

### Etapa 2 — Reestruturar `ReportsPage.tsx`

**Camada:** pages (`src/pages/reports/ReportsPage.tsx`)

**Layout proposto para a seção de vendas:**

```
┌─────────────────────────────────────┐
│  Total de Vendas            R$ X.XX │  ← allSalesTotal (principal)
│  Hoje / Semana / Mês                │
└─────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐
│  À vista         │  │  Fiado vendido   │
│  R$ X.XX         │  │  R$ X.XX         │  ← breakdown secundário
└──────────────────┘  └──────────────────┘

┌─────────────────────────────────────┐
│  Fiado em aberto            R$ X.XX │  ← openCreditTotal (mantém)
│  X clientes com débito              │
└─────────────────────────────────────┘
```

Mudanças:
- Card principal: "Total de Vendas" usando `allSalesTotal` (não mais "Vendas à vista")
- Dois cards secundários menores: "À vista" (`cashSalesTotal`) e "Fiado vendido" (`creditSalesTotal`)
- Card "Fiado em aberto" permanece igual (acumulado, sem filtro de período)
- Labels mais claros: "Fiado vendido no período" vs "Fiado em aberto"

Critérios de sucesso:
- Dono que faz 50% das vendas fiado enxerga o total correto no período
- A distinção entre "fiado vendido" (quando a venda ocorreu) e "fiado em aberto" (o que ainda deve) está visualmente clara
- Filtros Hoje/Semana/Mês continuam funcionando para todos os cards de período

Pontos de atenção:
- "Fiado em aberto" (`openCreditTotal`) **não é filtrado por período** — representa o saldo devedor atual de todos os clientes. Isso deve estar claro no label (ex: "Total em aberto" sem mencionar período)
- Evitar confusão entre "fiado vendido no período" e "fiado em aberto" — são coisas diferentes

---

### Etapa 3 — Revisar `SalesPage.tsx`

**Camada:** pages (`src/pages/sales/SalesPage.tsx`)

A SalesPage já lista todas as vendas (cash + credit) mas calcula totais separados localmente:
```typescript
const cashTotal = sales.filter(s => s.paymentType === 'cash').reduce(...)
const creditTotal = sales.filter(s => s.paymentType === 'credit').reduce(...)
```

Verificar e ajustar o cabeçalho de totais para que o **total geral** seja destacado, com breakdown por tipo como informação secundária — alinhando com a mudança de linguagem dos Relatórios.

Critérios de sucesso:
- Total de vendas do período (cash + credit) é o número em destaque
- Breakdown por tipo é informação secundária (menor, abaixo)
- Lista de vendas individuais permanece igual (já mostra tipo de pagamento por item)

---

### Etapa 4 — Atualizar documentação

**Camada:** docs

- `docs/PRODUCT_STATUS.md`: atualizar descrição da feature de relatórios, marcar melhoria como concluída
- `docs/TECH.md`: se a interface `ReportData` mudar, atualizar a seção de hooks

---

## Questões a responder

- O "Fiado em aberto" deve opcionalmente ser filtrado por período (ex: débitos gerados neste mês)? Ou sempre mostrar o saldo acumulado total? Atualmente é sempre acumulado — manter assim parece correto para gestão de caixa.
- Os labels "À vista", "Fiado vendido", "Fiado em aberto" fazem sentido para o público-alvo (lojistas)? Ou termos mais simples como "Dinheiro/Pix" e "A receber"?

---

## Entregável

- `src/application/hooks/useReports.ts` — `ReportData` com `creditSalesTotal` adicionado
- `src/pages/reports/ReportsPage.tsx` — layout reestruturado com total geral em destaque
- `src/pages/sales/SalesPage.tsx` — totais ajustados para destacar total geral
- `docs/PRODUCT_STATUS.md` e `docs/TECH.md` atualizados
