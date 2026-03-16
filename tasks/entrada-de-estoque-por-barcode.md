# Entrada de Estoque por Código de Barras

**Status:** pendente
**Categoria:** feature
**Artefato:** Nova página `StockScanPage` + rota `/stock/scan` com fluxo inteligente de scan → repor ou cadastrar

---

## Objetivo

Permitir que o usuário escaneie um código de barras para iniciar o fluxo de entrada de estoque: se o produto existir, vai direto para reposição; se não existir, redireciona para cadastro com o barcode pré-preenchido.

## Contexto

Hoje o usuário que quer repor estoque de um produto precisa:
1. Navegar manualmente pela lista de estoque (`/stock`)
2. Localizar o produto
3. Acessar o detalhe (`/stock/:productId`)
4. Informar a quantidade

Isso é lento e inconveniente para o cenário real de uso: receber mercadoria e dar entrada unitária ou em lote, escaneando cada produto com a câmera. O app já possui toda a infraestrutura necessária — `findByBarcode` no `useProducts`, o `BarcodeScanner` component e o fluxo de reposição em `ProductDetailPage` — mas nenhuma página conecta essas peças para esse caso de uso.

O fluxo de venda (`NewSalePage`) já serve de referência: escaneia → busca produto → age. A mesma lógica deve ser aplicada para entrada de estoque.

## Escopo

### Etapa 1 — Nova página `StockScanPage`

**Camada:** `src/pages/stock/`
**Arquivo:** `StockScanPage.tsx`

Criar uma página com as seguintes responsabilidades:

1. Exibir o `BarcodeScanner` em modo ativo ao entrar na página
2. Ao receber um resultado de scan, chamar `findByBarcode(code)` via `useProducts`
3. **Produto encontrado:** navegar para `/stock/:productId` (ProductDetailPage já tem o formulário de reposição)
4. **Produto não encontrado:** navegar para `/stock/new?barcode=<code>` com o código pré-preenchido

**Pontos de atenção:**
- Chamar `stopScan()` do `useBarcode` obrigatoriamente no `useEffect` de cleanup (unmount)
- Exibir estado de loading entre o scan e a resposta do banco
- Evitar múltiplos scans simultâneos (debounce ou flag `scanning`)

---

### Etapa 2 — Pré-preencher barcode em `NewProductPage`

**Camada:** `src/pages/stock/`
**Arquivo:** `NewProductPage.tsx` (modificação)

Ler o query param `?barcode=` via `useSearchParams` e definir o valor inicial do campo `barcode` no formulário.

```ts
const [searchParams] = useSearchParams()
const barcodeParam = searchParams.get('barcode') ?? ''
// passar como defaultValues: { barcode: barcodeParam, ... }
```

**Critério de sucesso:** chegar em `/stock/new?barcode=7891234567890` e o campo de barcode já estar preenchido.

---

### Etapa 3 — Registrar rota no router

**Camada:** `src/router/index.tsx` (modificação)

Adicionar:
```ts
{ path: 'stock/scan', element: <StockScanPage /> }
```

A rota deve ficar dentro do grupo protegido (dentro de `AppShell`), antes de `stock/:productId` para evitar conflito de matching.

---

### Etapa 4 — Ponto de entrada na UI

**Camada:** `src/pages/stock/StockPage.tsx` (modificação)

Adicionar um botão/FAB "Escanear" ou ícone de câmera que navegue para `/stock/scan`. Avaliar também se faz sentido adicionar no bottom nav (decisão a ser tomada durante execução).

---

## Questões a responder

- O botão de acesso ao scan fica só na `StockPage` ou também no bottom nav como atalho global?
- Após repor estoque com sucesso em `ProductDetailPage`, o usuário volta para `/stock/scan` (para continuar escaneando) ou para `/stock`? Considerar adicionar `?from=scan` como query param para controlar o comportamento de navegação pós-reposição.
- Deve haver feedback visual (som/vibração via Web API) ao scanear com sucesso?

## Entregável

| Arquivo | Status |
|---|---|
| `src/pages/stock/StockScanPage.tsx` | criar |
| `src/pages/stock/NewProductPage.tsx` | modificar — ler `?barcode=` |
| `src/router/index.tsx` | modificar — adicionar rota `/stock/scan` |
| `src/pages/stock/StockPage.tsx` | modificar — adicionar botão de acesso |
