# Product Status — StockApp

> Última atualização: 2026-03-16 (rev 7)

## Estado Geral

**Fase:** MVP funcional — pronto para uso real por usuário único
**Estabilidade:** Beta (infraestrutura de produção ainda não validada em produção)

---

## O que está pronto

### Autenticação
- [x] Login com email/senha
- [x] Cadastro com confirmação de e-mail
- [x] Logout
- [x] Rotas protegidas (redirect para `/login` sem sessão)

### Produtos
- [x] Cadastro de produto (nome, código de barras, preço de custo, preço de venda, validade)
- [x] Scanner de código de barras na criação
- [x] Listagem com busca por nome
- [x] Filtro por estoque baixo e produtos vencendo
- [x] Tela de detalhe do produto
- [x] Reposição de estoque na tela de detalhe
- [x] Correção manual de quantidade em estoque (ajuste para valor exato, registra movimento `adjustment`)
- [x] Zeragem de estoque (remove `stock_entry`, mantém histórico de movimentações)
- [x] Exclusão de produto com confirmação (bloqueada se o produto tiver vendas registradas)
- [ ] Edição de produto (hook existe, UI não implementada)

### Vendas
- [x] Fluxo multi-step com carrinho: pagamento → cliente (fiado) → adicionar itens → revisar carrinho → confirmação
- [x] Múltiplos produtos por venda — cada item gera um registro `Sale` independente (sem alterar schema)
- [x] Pré-validação de estoque de todos os itens antes de qualquer escrita (`createSalesBatch`)
- [x] Busca de produto com debounce automático (400ms) — sem necessidade de Enter ou botão
- [x] Scanner de código de barras no fluxo de venda
- [x] Pagamento à vista (dinheiro)
- [x] Pagamento a prazo (fiado) com vínculo ao cliente
- [x] Cadastro de cliente inline no fluxo de venda fiada (dialog + auto-seleção + avanço automático)
- [x] Busca de cliente com debounce (400ms) no step de seleção
- [x] Log de movimentação de estoque gerado automaticamente
- [x] Decremento atômico de estoque na venda

### Clientes & Fiado
- [x] Listagem de clientes (todos) com aba "Fiado em aberto" — substitui a antiga CreditPage
- [x] Badge de saldo devedor na listagem (calculado sem N+1 queries)
- [x] Busca de cliente com debounce (300ms)
- [x] Cadastro de cliente inline via dialog (nome + telefone)
- [x] Detalhe do cliente: saldo devedor, formulário de pagamento, histórico interleaved
- [x] Validação de pagamento — bloqueia valor acima do saldo devedor
- [x] Toast diferenciado ao quitar dívida ("Dívida quitada!")
- [x] Registro de pagamento com observação
- [x] Saldo derivado (nunca armazenado — calculado em runtime)
- [ ] Edição de cliente (hook existe, UI não implementada)
- [ ] Exclusão de cliente (hook não implementado)

### Estoque
- [x] Controle de quantidade por produto
- [x] Audit log append-only de todas as movimentações (tipo, razão, quantidade)
- [x] Entrada de estoque por leitura de código de barras (tela dedicada `/stock/scan`)
- [x] Alertas de vencimento com filtros na tela de estoque (filtro "vencendo" e "vencidos")
- [ ] Tela de histórico de movimentações por produto (dados existem, UI não implementada)

### Relatórios / Home
- [x] Valor total em estoque (custo)
- [x] Vendas à vista por período (hoje / semana / mês)
- [x] Total de fiado em aberto (valor + contagem de clientes)
- [x] Alertas: produtos com estoque baixo (banner + lista com badge na Home)
- [x] Alertas: produtos perto do vencimento (banner + lista com badge na Home)
- [x] Dialog de confirmação ao clicar em produto sem estoque na listagem (redireciona para detalhe)
- [ ] Exportação CSV/PDF
- [ ] Relatório de rentabilidade por produto

### Configurações
- [x] Nome do negócio
- [x] Limiar de estoque baixo (qtd)
- [x] Dias de antecedência para alerta de vencimento
- [x] Persistência local (localStorage) + Supabase

### Clientes
- [x] Cadastro de cliente (nome, telefone)
- [x] Busca por nome no fluxo de venda
- [ ] Edição de cliente (hook existe, UI não implementada)

---

## O que está faltando (backlog priorizado)

### Alta prioridade
1. **Edição de produto** — UI para atualizar nome, preços, validade
2. **Edição de cliente** — UI básica de update
3. **Tela de movimentações por produto** — visualizar histórico do audit log

### Média prioridade
4. **Cadastro de cliente inline no fluxo de venda** — hoje precisa sair do fluxo para criar
5. **PWA / instalável** — manifest + service worker para experiência nativa no mobile

### Baixa prioridade / futuro
7. Exportação de relatórios (CSV/PDF)
8. Notificações push (estoque baixo, vencimento)
9. Múltiplos usuários / planos
10. Import em lote de produtos (CSV)
11. Fotos de produto
12. Conciliação de inventário físico

---

## Dívida técnica

| Item | Impacto | Urgência |
|---|---|---|
| Schema `stock` não exposto no Supabase | Bloqueante em produção | Alta |
| RLS não configurada nas tabelas | Segurança crítica | Alta |
| Sem testes de integração (apenas unit) | Risco em refactors | Média |
| Sem CI/CD configurado | Qualidade | Baixa |

---

## Métricas de cobertura de testes

- **Domain rules**: 100% cobertura (stock.rules, sale.rules, credit.rules)
- **Hooks/Application**: 0% (não testados)
- **Infrastructure/Repositories**: 0% (não testados)
- **Pages/UI**: 0% (não testados)
