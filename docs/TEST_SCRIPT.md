# Roteiro de Testes Manuais — StockApp

> Executar em ordem. Cada bloco é independente após o setup inicial.

---

## 0. Setup

- [ ] Criar conta nova em `/signup`
- [ ] Confirmar e-mail e fazer login
- [ ] Deve redirecionar para `/` (dashboard)

---

## 1. Configurações

**Path:** `/settings`

- [ ] Alterar nome do negócio → salvar → recarregar página → nome persiste
- [ ] Alterar limiar de estoque baixo para `3` → salvar
- [ ] Alterar alerta de vencimento para `10 dias` → salvar

---

## 2. Cadastro de Produto

**Path:** `/stock/new`

**Produto A — completo:**
- [ ] Preencher nome, preço de custo R$ 5,00, preço de venda R$ 8,00, validade 5 dias a partir de hoje, quantidade inicial 10
- [ ] Salvar → redireciona para `/stock`
- [ ] Produto aparece na lista

**Produto B — sem validade:**
- [ ] Preencher nome, custo R$ 2,00, venda R$ 3,50, quantidade inicial 2
- [ ] Salvar → aparece na lista

**Produto C — estoque zerado:**
- [ ] Preencher nome, custo R$ 10,00, venda R$ 15,00, quantidade inicial 0
- [ ] Salvar → aparece na lista

---

## 3. Alertas no Dashboard e Estoque

**Path:** `/` e `/stock`

- [ ] Produto B (qtd 2 ≤ limiar 3) aparece como **estoque baixo** no dashboard
- [ ] Produto A (vence em 5 dias ≤ alerta 10 dias) aparece como **vencendo** no dashboard
- [ ] Em `/stock`, filtro "Estoque baixo" mostra Produto B e C
- [ ] Em `/stock`, filtro "Vencendo" mostra Produto A

---

## 4. Detalhe do Produto e Reposição

**Path:** `/stock/:id` do Produto C

- [ ] Tela mostra dados do produto corretamente
- [ ] Repor 5 unidades → salvar → quantidade passa para 5
- [ ] Voltar para `/stock` → quantidade atualizada na lista

---

## 5. Venda à Vista

**Path:** `/sales/new`

- [ ] Buscar Produto A pelo nome → selecionar
- [ ] Definir quantidade 2 → total calculado corretamente (2 × R$ 8,00 = R$ 16,00)
- [ ] Selecionar **à vista** → confirmar venda
- [ ] Toast de sucesso aparece
- [ ] Em `/stock`, Produto A agora tem **8 unidades** (era 10 − 2)
- [ ] Em `/reports` → hoje → vendas à vista aumentaram R$ 16,00

---

## 6. Venda Fiado (novo cliente)

**Path:** `/sales/new`

- [ ] Buscar Produto B → selecionar → quantidade 1
- [ ] Selecionar **fiado**
- [ ] Criar novo cliente "João Silva", telefone opcional → confirmar venda
- [ ] Em `/credit` → João Silva aparece com dívida de R$ 3,50
- [ ] Em `/stock`, Produto B agora tem **1 unidade**

---

## 7. Segunda Venda Fiado (cliente existente)

**Path:** `/sales/new`

- [ ] Buscar Produto A → quantidade 1 → fiado
- [ ] Selecionar cliente existente "João Silva" → confirmar
- [ ] Em `/credit` → dívida de João agora R$ 11,50 (R$ 3,50 + R$ 8,00)

---

## 8. Pagamento de Fiado

**Path:** `/credit/:id` (João Silva)

- [ ] Histórico mostra as 2 vendas em ordem cronológica
- [ ] Registrar pagamento de R$ 5,00 com observação "Pagou metade"
- [ ] Saldo atualiza para R$ 6,50
- [ ] Pagamento aparece no histórico
- [ ] Registrar pagamento do restante R$ 6,50
- [ ] João some da lista em `/credit` (saldo zerado)

---

## 9. Relatórios

**Path:** `/reports`

- [ ] Aba **hoje**: vendas à vista batem com o que foi vendido na sessão
- [ ] Valor em estoque reflete os produtos cadastrados (custo × quantidade)
- [ ] Trocar para **semana** e **mês** — sem erro

---

## 10. Busca e Filtros de Estoque

**Path:** `/stock`

- [ ] Buscar parte do nome de um produto → filtra corretamente
- [ ] Limpar busca → todos os produtos voltam
- [ ] Filtros "Estoque baixo" e "Vencendo" funcionam em combinação com busca

---

## 11. Cenários de Erro

- [ ] Tentar vender Produto C (estoque 0 após testes) → deve bloquear com mensagem de erro
- [ ] Tentar vender quantidade maior que o estoque disponível → deve bloquear
- [ ] Tentar criar produto com mesmo código de barras de outro produto → deve falhar

---

## 12. Persistência de Sessão

- [ ] Recarregar a página em qualquer rota protegida → continua logado, não redireciona para login
- [ ] Fazer logout em `/settings` → redireciona para `/login`
- [ ] Tentar acessar `/` manualmente → redireciona para `/login`
