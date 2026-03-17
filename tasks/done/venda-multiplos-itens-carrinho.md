# Venda com Múltiplos Itens (Carrinho)

**Status:** pendente
**Categoria:** feature
**Artefato:** Reescrita de `src/pages/sales/NewSalePage.tsx` + adição de método em `src/application/hooks/useSales.ts` + novo tipo em `src/domain/types.ts`

---

## Objetivo

Permitir que o usuário monte uma venda com múltiplos produtos antes de confirmar, para pagamentos à vista ou fiado, sem alterar o schema do banco de dados.

## Contexto

Atualmente o fluxo de `NewSalePage` suporta apenas um produto por venda. O usuário seleciona produto → quantidade/preço → forma de pagamento → confirma. Isso cria exatamente um registro na tabela `sales`.

O modelo de dados atual (`Sale`) tem `productId` singular, sem conceito de "carrinho" ou "sessão". A abordagem escolhida é **não alterar o schema**: ao confirmar o carrinho, cada item gera um registro `Sale` independente — todos com o mesmo `paymentType` e `customerId`. Isso preserva compatibilidade total com a tela de fiado (`CreditPage`), relatórios e o histórico existente.

O novo fluxo de UX:
1. Selecionar forma de pagamento (à vista ou fiado)
2. Se fiado: selecionar/cadastrar cliente
3. Adicionar itens ao carrinho (produto → qty/preço → volta para adicionar mais)
4. Revisar carrinho (lista com totais, remover item)
5. Confirmar → cria N registros `Sale` + N movimentações + decrementa estoque N vezes

## Escopo

### 1. Tipo `CartItem` no domínio (`src/domain/types.ts`)

- Camada: `domain`
- Adicionar interface local (não persiste no banco):
  ```ts
  export interface CartItem {
    product: Product
    quantity: number
    unitPrice: number  // centavos
  }
  ```
- Critério: tipo disponível para uso em `pages` e `application`.

### 2. Método `createSalesBatch` em `useSales` (`src/application/hooks/useSales.ts`)

- Camada: `application`
- Novo método que recebe `items: CartItem[]`, `paymentType`, `customerId`.
- **Estratégia: pré-validação total antes de qualquer escrita.**
  1. **Fase 1 — validação:** busca o estoque atual de todos os produtos do carrinho; valida todos os itens com `validateSale`; se qualquer item falhar, lança erro imediatamente (`"Estoque insuficiente: {nome}"`) **sem ter gravado nada**.
  2. **Fase 2 — escrita:** só após toda validação passar, executa o loop sequencial de criação (validação → `saleRepo.create` → `stockRepo.addMovement` → `stockRepo.decrementEntry`) para cada item.
- Executa em sequência (não paralelo) para preservar consistência do estoque.
- Critério: ou tudo é gravado ou nada é gravado (dentro do que é possível sem transação no banco); erro descritivo aponta o produto problemático.
- Atenção: produtos duplicados no carrinho devem ter seus estoques somados na fase de validação antes de comparar com o disponível.

### 3. Reescrita do fluxo em `NewSalePage` (`src/pages/sales/NewSalePage.tsx`)

- Camada: `pages`
- Novos steps: `'payment' | 'customer' | 'add-item' | 'cart' | 'confirm'`
- Estado central: `cart: CartItem[]`

**Step `payment`** (primeiro step):
- Igual ao atual: botões "À Vista" / "Fiado"
- À vista → vai para `add-item`
- Fiado → vai para `customer`

**Step `customer`** (fiado):
- Igual ao atual + melhorias da task `cadastro-cliente-no-fluxo-de-venda`
- Após selecionar cliente → vai para `add-item`

**Step `add-item`** (adicionar produto ao carrinho):
- Busca de produto com debounce + scan de barcode (igual ao step atual de produto)
- Ao selecionar produto → sub-form de quantidade e preço (igual ao step atual de `quantity`)
- Botão "Adicionar ao carrinho" → push em `cart[]`, volta para `add-item` (limpa seleção)
- Botão "Ver carrinho" (visível quando `cart.length > 0`) → vai para `cart`
- Critério: permite adicionar o mesmo produto mais de uma vez; cada adição é um item separado no array.

**Step `cart`** (revisar carrinho):
- Lista os itens: nome, qtd, preço unit., subtotal
- Botão remover (×) por item
- Total geral no rodapé
- Botão "Adicionar mais" → volta para `add-item`
- Botão "Confirmar venda" → vai para `confirm`
- Critério: carrinho nunca fica vazio ao confirmar (bloquear se `cart.length === 0`).

**Step `confirm`** (resumo final):
- Exibe: lista de itens, total geral, forma de pagamento, cliente (se fiado)
- Botão "Confirmar" → chama `createSalesBatch(cart, paymentType, customerId)`
- Sucesso → toast + navigate('/')
- Critério: loading state no botão durante submissão.

### 4. Atualizar a navegação de volta (`NewSalePage`)

- Camada: `pages`
- O botão "Voltar" deve respeitar o fluxo:
  - `add-item` → `customer` (se fiado) ou `payment` (se à vista) — se carrinho vazio
  - `add-item` → `cart` — se carrinho não vazio
  - `cart` → `add-item`
  - `confirm` → `cart`
- Critério: nunca perde os dados do carrinho ao navegar entre steps.

## Questões a responder

- Nenhuma. A estratégia de pré-validação resolve o risco de escrita parcial para os cenários realistas deste app.

## Entregável

- `src/domain/types.ts` — interface `CartItem` adicionada
- `src/application/hooks/useSales.ts` — método `createSalesBatch` adicionado
- `src/pages/sales/NewSalePage.tsx` — fluxo completo reescrito com steps de carrinho
