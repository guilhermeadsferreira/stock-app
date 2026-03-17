# Cadastro de Cliente no Fluxo de Venda

**Status:** concluído
**Categoria:** feature
**Artefato:** Modificações em `src/pages/sales/NewSalePage.tsx`

---

## Objetivo

Adicionar debounce na busca de clientes e permitir cadastrar um novo cliente diretamente no step "Selecionar cliente" do fluxo de venda fiada, sem sair da tela de venda.

## Contexto

No fluxo de venda fiada (`NewSalePage`), o step `customer` exibe um input de busca que chama `loadCustomers(e.target.value)` a cada tecla, sem debounce — ao contrário do step de busca de produto, que já possui debounce via `useRef`. Além disso, não existe nenhum caminho para cadastrar um novo cliente a partir desse fluxo: se o cliente não estiver cadastrado, o usuário fica travado.

O `useCustomers` já expõe um método `create(name, phone?)` pronto para uso. Não há necessidade de criar rotas novas, repositórios ou regras de domínio — toda a infraestrutura existe. O cadastro básico (nome + telefone) deve ser feito inline, em um `Dialog` ou `Sheet`, sem interromper o fluxo de venda.

## Escopo

### 1. Debounce na busca de clientes (`NewSalePage`)

- Camada: `pages`
- Seguir o mesmo padrão já usado no step de produto: `useRef<ReturnType<typeof setTimeout>>` + `useEffect` sobre um estado `customerSearch`.
- Trocar o `onChange` atual (`loadCustomers(e.target.value)`) por `setCustomerSearch(e.target.value)`.
- Delay: 400ms (mesmo do produto).
- Critério: o request de busca só dispara após o usuário parar de digitar por 400ms.

### 2. Botão "Novo cliente" no step `customer` (`NewSalePage`)

- Camada: `pages`
- Adicionar um botão "＋ Novo cliente" abaixo (ou ao lado) do input de busca.
- Ao clicar, abre um `Dialog` (shadcn/ui) com o formulário de cadastro.
- Critério: o botão é sempre visível no step `customer`, independente dos resultados da busca.

### 3. Formulário de cadastro inline (`NewSalePage`)

- Camada: `pages`
- Usar `Dialog` + `useForm` + `zodResolver` com schema:
  ```ts
  z.object({
    name: z.string().min(2, 'Nome obrigatório'),
    phone: z.string().optional(),
  })
  ```
- Campos: nome (obrigatório) e telefone (opcional, `inputMode="tel"`).
- Submit chama `create(name, phone)` de `useCustomers`.
- Pós-criação:
  1. Fecha o dialog.
  2. Define o novo cliente como `selectedCustomer`.
  3. Avança para o step `confirm` automaticamente.
  4. Toast de sucesso: "Cliente cadastrado".
- Critério: formulário bloqueia submit enquanto `submitting`; exibe erros de validação inline; limpa campos ao fechar.

## Questões a responder

- Nenhuma. Escopo fechado com base na infraestrutura existente.

## Entregável

- `src/pages/sales/NewSalePage.tsx` — único arquivo modificado:
  - Estado `customerSearch` + debounce via `useRef`
  - Estado `newCustomerOpen` (controla o Dialog)
  - Formulário de novo cliente com schema Zod
  - Lógica de criação + auto-seleção + avanço de step
