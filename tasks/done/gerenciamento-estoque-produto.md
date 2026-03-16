# Gerenciamento de Estoque e Produto (Corrigir, Deletar)

**Status:** concluído
**Categoria:** feature
**Artefato:** Funcionalidades de correção de estoque, reset de estoque e exclusão de produto na `ProductDetailPage`, com suporte nas camadas de domínio, application e infrastructure.

---

## Objetivo

Permitir que o usuário corrija a quantidade em estoque, resete/zere o estoque e exclua um produto diretamente pela tela de detalhes, viabilizando reversão rápida durante homologação e uso no dia a dia.

## Contexto

Durante a fase de homologação o usuário cadastra produtos e movimenta estoque para testar o fluxo. Hoje não há como desfazer: a única operação disponível em `ProductDetailPage` é **repor estoque** (incremento). Isso obriga a criar e apagar manualmente pelo Supabase Dashboard.

As três operações necessárias são:

| Operação | Descrição |
|----------|-----------|
| **Corrigir estoque** | Define a quantidade exata (ex: setar para 0 ou para o valor real) |
| **Deletar estoque** | Remove a entrada de estoque do produto (zera sem histórico, útil para testes) |
| **Deletar produto** | Exclui o produto e seus dados vinculados |

**O que já existe:**
- `ProductRepository.delete()` implementado e funcional
- `StockRepository.upsertEntry()` já suporta setar quantidade arbitrária
- `MovementReason` já tem `'adjustment'` para registrar ajustes manuais
- `IStockRepository` **não** tem `deleteEntry` — precisa ser adicionado

**Ponto de atenção (CASCADE):** Deletar um produto que tem vendas registradas pode violar FK no banco. É necessário verificar as constraints no schema do Supabase antes de implementar a UI de exclusão.

---

## Escopo

### Etapa 1 — Corrigir estoque

**Camadas:** domain → infrastructure → application → pages

- **Domain** (`src/domain/repositories/IStockRepository.ts`): nenhuma alteração necessária — `upsertEntry` já existe na interface.
- **Application** (`src/application/hooks/useStock.ts`): adicionar função `adjustQuantity(productId, newQuantity, notes?)` que:
  1. Chama `stockRepo.upsertEntry(userId, productId, newQuantity)` para setar o valor exato
  2. Registra movimento com `type: 'in'` ou `'out'` conforme a diferença, `reason: 'adjustment'`
  3. Retorna o `StockEntry` atualizado
- **Pages** (`src/pages/stock/ProductDetailPage.tsx`): adicionar seção "Corrigir estoque" com:
  - Input numérico para a quantidade desejada (pré-preenchido com a quantidade atual)
  - `onFocus select` para facilitar edição
  - Botão "Corrigir" com confirmação inline (ex: texto "Definir como X unidades?")
  - Toast de sucesso/erro

**Critério de sucesso:** Após corrigir, a badge de estoque atualiza na tela e o movimento aparece no histórico com `reason: adjustment`.

---

### Etapa 2 — Deletar estoque (reset)

**Camadas:** domain → infrastructure → application → pages

- **Domain** (`src/domain/repositories/IStockRepository.ts`): adicionar `deleteEntry(userId, productId): Promise<void>`
- **Infrastructure** (`src/infrastructure/supabase/StockRepository.ts`): implementar `deleteEntry` com `.delete().eq('product_id', productId).eq('user_id', userId)`
- **Application** (`src/application/hooks/useStock.ts`): adicionar `removeEntry(productId)` que chama `stockRepo.deleteEntry`
- **Pages** (`src/pages/stock/ProductDetailPage.tsx`): botão destrutivo "Zerar estoque" com diálogo de confirmação antes de executar

**Critério de sucesso:** Após deletar, a entrada some de `stock_entries`; a badge exibe "Zerado" (quantity 0) ou some conforme comportamento do `StockBadge`.

**Ponto de atenção:** `stock_movements` são append-only — não são deletados junto. Isso é intencional (auditoria).

---

### Etapa 3 — Deletar produto

**Camadas:** application → pages (infrastructure já pronta)

- **Application** (`src/application/hooks/useProducts.ts`): verificar se já expõe `remove(productId)` — se não, adicionar função que chama `productRepo.delete(userId, productId)`
- **Pages** (`src/pages/stock/ProductDetailPage.tsx`): botão destrutivo "Excluir produto" no final da tela, com:
  - Diálogo de confirmação explícito (ex: "Tem certeza? Esta ação não pode ser desfeita.")
  - Após confirmação: executa delete e navega de volta para `/stock`
  - Toast de sucesso/erro

**Critério de sucesso:** Produto some da listagem em `/stock` e não aparece mais em buscas.

**Ponto de atenção crítico:** Verificar se o Supabase tem FK com `ON DELETE CASCADE` em `stock_entries`, `stock_movements` e `sales` referenciando `products.id`. Se não tiver, a deleção falhará silenciosamente ou retornará erro de FK. Pode ser necessário rodar uma migration ou deletar as entidades filhas antes do produto.

---

### Etapa 4 — Verificar constraints de FK no banco

**Camada:** infra / documentação

- Abrir `src/infrastructure/db/schema.ts` e verificar se as tabelas filhas (`stock_entries`, `stock_movements`, `sales`) têm `references(() => products.id, { onDelete: 'cascade' })`
- Se não tiverem: gerar migration com `npm run db:generate` adicionando `onDelete: 'cascade'` e aplicar com `npm run db:push`
- Documentar a decisão em `docs/TECH.md` (seção de schema)

**Critério de sucesso:** `productRepo.delete()` em um produto com estoque e movimentos não retorna erro de FK.

---

## Decisões técnicas

- **Deletar produto com vendas vinculadas:** bloquear a exclusão — verificar antes se existe alguma venda com `product_id` do produto; se sim, exibir toast de erro "Este produto possui vendas registradas e não pode ser excluído." Vendas são registros financeiros e não devem ser apagados junto.
- **"Deletar estoque" limpa `stock_movements`?** Não — `stock_movements` é log de auditoria append-only por design. A operação remove apenas a linha em `stock_entries`.
- **Diálogo de confirmação:** usar componente `AlertDialog` do shadcn (já disponível no projeto) para a exclusão de produto. Para "Zerar estoque", um `AlertDialog` mais simples também. Sem `alert()` nativo.

---

## Entregável

**Arquivos criados/modificados:**

| Arquivo | Tipo de alteração |
|---------|-------------------|
| `src/domain/repositories/IStockRepository.ts` | Adicionar `deleteEntry` |
| `src/infrastructure/supabase/StockRepository.ts` | Implementar `deleteEntry` |
| `src/application/hooks/useStock.ts` | Adicionar `adjustQuantity` e `removeEntry` |
| `src/application/hooks/useProducts.ts` | Adicionar/expor `remove` |
| `src/pages/stock/ProductDetailPage.tsx` | Seções de correção, reset e exclusão |
| `src/infrastructure/db/schema.ts` | Adicionar `onDelete: 'cascade'` se necessário |
| `docs/TECH.md` | Atualizar schema se migration for gerada |
