# Dialog: Produto Sem Estoque

**Status:** pendente
**Categoria:** feature
**Artefato:** Modificação em `src/pages/stock/StockPage.tsx`

---

## Objetivo

Interceptar o clique em um produto sem estoque na listagem e exibir um dialog perguntando se o usuário deseja adicionar estoque, redirecionando para a `ProductDetailPage` caso confirme.

## Contexto

Atualmente, ao clicar em qualquer produto na `StockPage`, o usuário é levado diretamente para `/stock/:productId` (ProductDetailPage), independente do estoque. Para produtos com quantidade 0, isso pode ser confuso — o usuário pode não saber que precisa adicionar estoque antes de tentar vender.

A `StockPage` já possui o `entryMap` (um `Map<productId, quantity>`) populado com as quantidades de cada produto. A `ProductDetailPage` já contém os formulários de "Repor estoque" e "Corrigir estoque". Não há necessidade de criar nova rota ou nova página.

O `AlertDialog` do shadcn/ui já está disponível e em uso na `ProductDetailPage`, basta utilizá-lo na `StockPage`.

## Escopo

### 1. Adicionar estado de controle do dialog (`StockPage`)

- Camada: `pages`
- Adicionar `useState<Product | null>(null)` para `pendingProduct` — armazena o produto clicado que está sem estoque.
- Critério: estado inicia como `null`; é definido quando o usuário clica num produto com `quantity === 0`.

### 2. Interceptar clique no card do produto (`StockPage`)

- Camada: `pages`
- Alterar o `onClick` do botão de cada produto:
  - Se `(entryMap.get(product.id) ?? 0) === 0` → `setPendingProduct(product)` (abre o dialog)
  - Caso contrário → `navigate(\`/stock/${product.id}\`)` (comportamento atual)
- Critério: produtos com estoque seguem navegando normalmente; apenas os zerados abrem o dialog.

### 3. Renderizar o `AlertDialog` na `StockPage`

- Camada: `pages`
- Importar os componentes `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction`, `AlertDialogCancel` de `@/components/ui/alert-dialog`.
- Dialog controlado via `open={pendingProduct !== null}` e `onOpenChange` que limpa `pendingProduct`.
- Conteúdo:
  - Título: `"Produto sem estoque"`
  - Descrição: `"{nome do produto} está sem estoque. Deseja adicionar agora?"`
  - Botão cancelar: fecha o dialog (`setPendingProduct(null)`)
  - Botão confirmar: navega para `/stock/${pendingProduct.id}` e fecha o dialog
- Critério: dialog fecha ao cancelar ou confirmar; ao confirmar, usuário chega na `ProductDetailPage` com o formulário de reposição visível.

## Questões a responder

- Nenhuma. Fluxo está completamente definido pelo contexto atual.

## Entregável

- `src/pages/stock/StockPage.tsx` — único arquivo modificado
  - Estado `pendingProduct`
  - Lógica de interceptação no `onClick`
  - `AlertDialog` controlado renderizado fora do loop de lista
