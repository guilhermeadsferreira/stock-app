# Fix: onFocus select em todos os inputs numéricos

**Status:** concluído
**Categoria:** fix
**Artefato:** `onFocus={(e) => e.target.select()}` adicionado em todos os inputs `type="number"` que ainda não tinham

---

## Objetivo

Garantir que todos os inputs numéricos da aplicação selecionem o conteúdo ao receber foco, evitando o bug de concatenação com o valor padrão (ex: digitar "5" num campo com "0" resulta em "05").

## Contexto

A correção `onFocus={(e) => e.target.select()}` foi aplicada parcialmente em uma sessão anterior (preços em `NewProductPage`, `unitPrice` em `NewSalePage`, inputs de estoque em `ProductDetailPage`). Os demais inputs numéricos ficaram sem a correção e exibem o mesmo comportamento de concatenação.

Inputs afetados identificados via grep `type="number"` em `src/`:

| Arquivo | Campo | Status antes |
|---|---|---|
| `NewProductPage.tsx:157` | Quantidade inicial | ❌ faltando |
| `NewSalePage.tsx:175` | Quantidade de venda | ❌ faltando |
| `CustomerDetailPage.tsx:104` | Valor do pagamento | ❌ faltando |
| `SettingsPage.tsx:67` | Limiar de estoque baixo | ❌ faltando |
| `SettingsPage.tsx:78` | Dias de alerta de vencimento | ❌ faltando |

## Escopo

### Etapa única — adicionar onFocus select nos 5 inputs

**Camada:** pages
Adicionar `onFocus={(e) => e.target.select()}` nos inputs listados acima.

## Entregável

5 arquivos de página alterados:
- `src/pages/stock/NewProductPage.tsx`
- `src/pages/sales/NewSalePage.tsx`
- `src/pages/credit/CustomerDetailPage.tsx`
- `src/pages/settings/SettingsPage.tsx`
