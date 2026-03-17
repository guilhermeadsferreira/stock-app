# Clientes & Fiado — Listagem, Histórico e Revisão do Fluxo

**Status:** concluído
**Categoria:** feature + auditoria
**Artefato:** Unificação de clientes + fiado em `/customers` com abas, detalhe do cliente com histórico e pagamento, revisão do fluxo fiado

---

## Objetivo

Unificar a gestão de clientes e o fluxo de fiado em uma única área (`/customers`), substituindo a rota `/credit` no bottom nav. Garantir que listagem, detalhe, histórico de compras e abatimento de dívida funcionem corretamente, com validações adequadas.

---

## Contexto

Hoje o fluxo de fiado está ~75% completo, mas fragmentado:

- `CreditPage` (`/credit`) lista apenas clientes com saldo devedor — não há listagem geral de clientes.
- `CustomerDetailPage` (`/credit/:customerId`) tem base funcional (saldo + histórico + pagamento), mas sem validação de valor máximo.
- Não existe tela de cadastro standalone de cliente — só via fluxo de venda (e mesmo lá, falta o cadastro inline).
- Edição e exclusão de clientes não têm UI (hooks existem).

**Decisão arquitetural tomada:** unificar tudo em `/customers`. O dono da loja pensa em "clientes", não em "sistema de fiado". Fiado é uma visão filtrada dentro de clientes. Trocar "Fiado" por "Clientes" no bottom nav — o contexto de dívida fica dentro do detalhe do cliente.

---

## Escopo

### 1. Auditoria do fluxo fiado (pente-fino antes de mexer em código)

**Camada:** pages + application + domain

Verificar cada ponto antes de implementar:

- [ ] `CustomerDetailPage`: o formulário de pagamento permite digitar valor maior que o saldo? → deve bloquear.
- [ ] `CustomerDetailPage`: ao zerar a dívida, o cliente some da aba "Fiado em aberto" — confirmar comportamento.
- [ ] `NewSalePage` step 4: se não há clientes cadastrados, a lista fica vazia sem saída — gap crítico (task `cadastro-cliente-no-fluxo-de-venda.md` cobre isso).
- [ ] `useCredit.loadCustomerCredit`: confirmar que a query filtra corretamente por `customerId` e `paymentType = 'credit'`.
- [ ] `calcDebtBalance`: aceita pagamentos que ultrapassem o saldo? Verificar se domain rule ou infra protege.
- [ ] Refresh após pagamento: saldo atualiza imediatamente na tela de detalhe?

Critério de sucesso: todos os gaps identificados e corrigidos ou documentados como tasks futuras.

---

### 2. `CustomersPage` — listagem unificada com abas

**Camada:** pages (nova) + router

Criar `src/pages/customers/CustomersPage.tsx`:

- **Aba "Todos"**: lista todos os clientes independente de saldo.
- **Aba "Fiado em aberto"**: lista apenas clientes com `balance > 0` (substitui `CreditPage`).
- Campo de busca por nome com debounce 400ms (mesmo padrão de `NewSalePage`).
- Cada item: nome, telefone (se houver), badge de saldo (vermelho se `> 0`, sem badge se zerado).
- Clique no item → `/customers/:id`.
- Botão "+" para cadastrar novo cliente (modal inline ou navega para `/customers/new`).
- Estado vazio por aba: "Nenhum cliente cadastrado" / "Nenhum fiado em aberto".

**Performance:** para exibir o badge de saldo na listagem sem N+1 queries, carregar todos os `sales` (credit) e `payments` do usuário de uma vez e agrupar por `customerId` no cliente — mesmo padrão que a `CreditPage` atual usa.

Atualizar `src/router/index.tsx`:
- Adicionar `/customers` → `CustomersPage`
- Adicionar `/customers/:customerId` → `CustomerDetailPage` (mover de `/credit/:customerId`)
- Manter `/credit` e `/credit/:customerId` como redirects para não quebrar deep links existentes (opcional)

---

### 3. `CustomerDetailPage` — melhorias

**Camada:** pages (existente, mover de `pages/credit/` para `pages/customers/`)

- **Validação de pagamento**: schema Zod deve receber `balance` como teto máximo:
  ```ts
  const paymentSchema = (maxCents: number) => z.object({
    amount: z.coerce.number()
      .min(0.01, 'Valor mínimo R$ 0,01')
      .max(maxCents / 100, `Máximo ${centsToBRL(maxCents)}`),
    notes: z.string().optional(),
  })
  ```
- **Toast ao quitar**: quando o balance chega a zero após pagamento, exibir toast diferenciado "Dívida quitada!".
- **Histórico**: manter apenas vendas fiado + pagamentos interleaved (vendas à vista fica para task futura).
- **Edição de cliente**: botão "Editar" no header → modal com campos nome e telefone usando `useCustomers.update()`.

---

### 4. Bottom nav — trocar "Fiado" por "Clientes"

**Camada:** `src/components/layout/AppShell.tsx`

- Substituir item "Fiado" (rota `/credit`, ícone `BookOpen` ou similar) por "Clientes" (rota `/customers`, ícone `Users`).
- O acesso ao fiado de um cliente específico passa a ser via `/customers/:id`.

---

### 5. Documentar tasks futuras

Ao finalizar, criar/atualizar os seguintes arquivos em `tasks/`:

- `cadastro-cliente-no-fluxo-de-venda.md` — já existe, revisar se cobre o cenário de lista vazia.
- `edicao-cliente.md` — UI de update (se não implementado na etapa 3).
- `exclusao-cliente.md` — delete com confirmação + bloqueio se tiver vendas.
- `historico-compras-a-vista-por-cliente.md` — incluir vendas cash no histórico do cliente.
- `exportacao-historico-cliente.md` — CSV/PDF do histórico.

---

## Questões respondidas

| Questão | Decisão |
|---------|---------|
| `/credit` separado ou unificado em `/customers`? | **Unificado** — `/customers` com abas "Todos" / "Fiado em aberto" |
| Badge de saldo na listagem — N+1 ou query agregada? | **Query agregada** — carregar todos os sales/payments de uma vez e agrupar no cliente |
| Histórico: só fiado ou incluir à vista? | **Só fiado por ora** — à vista documentado como task futura |
| Refresh ao quitar dívida? | **Imediato** — recarregar após `registerPayment` resolve |

---

## Entregável

| Artefato | Caminho |
|----------|---------|
| Nova tela de listagem com abas | `src/pages/customers/CustomersPage.tsx` |
| Detalhe do cliente (movido) | `src/pages/customers/CustomerDetailPage.tsx` |
| Rotas atualizadas | `src/router/index.tsx` |
| Bottom nav atualizado | `src/components/layout/AppShell.tsx` |
| Validação de pagamento | `CustomerDetailPage` (schema Zod) |
| Tasks futuras documentadas | `tasks/*.md` |
| Docs atualizados | `docs/PRODUCT_STATUS.md`, `docs/TECH.md` |
