# Git Commit — Commit Semântico com Pré-Revisão

Execute o fluxo abaixo.

## 1. Analisar mudanças

Execute `git status` e `git diff` para entender o que mudou. Liste os arquivos alterados e o tipo de alteração.

## 2. Pré-revisão crítica

Verifique nos arquivos editados:

| Verificação | Ação se falhar |
|-------------|----------------|
| Erros de lint/TypeScript (`npm run build` dry-check) | **Crítico** — pausar e alertar o usuário |
| Imports quebrados ou cruzando camadas (ex: `domain` importando `infrastructure`) | **Crítico** — pausar e alertar o usuário |
| Valores monetários usando `float` em vez de inteiros em centavos | **Crítico** — pausar e alertar o usuário |
| Componente usando `useBarcode.startScan()` sem chamar `stopScan()` no unmount | **Crítico** — pausar e alertar o usuário |
| Escrita direta em `stock_entries` ou `stock_movements` fora de `useSales.createSale` | **Crítico** — pausar e alertar o usuário |
| `z.coerce.number()` sem cast `as any` no zodResolver | **Crítico** — pausar e alertar o usuário |
| `console.log` esquecido em produção | **Menor** — corrigir ou alertar |
| Formatação inconsistente (trailing commas, espaços) | **Menor** — corrigir automaticamente |

**Se algum ponto crítico for detectado**: pare, liste os problemas e pergunte ao usuário se deseja que você corrija ou se ele prefere resolver manualmente.

**Se apenas pontos menores**: corrija automaticamente e prossiga.

## 3. Gerar mensagem semântica

Use Conventional Commits:

| Tipo | Uso |
|------|-----|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem mudar comportamento |
| `docs` | Apenas documentação |
| `style` | Formatação, espaços (não altera lógica) |
| `chore` | Tarefas de manutenção, deps |
| `test` | Testes |

**Formato**: `tipo(escopo): descrição curta em PT-BR`

Exemplos:

- `feat(produtos): adiciona leitura de barcode na tela de cadastro`
- `fix(vendas): corrige cálculo de troco com valores em centavos`
- `refactor(domain): extrai regra de validade para sale.rules.ts`
- `test(credit): adiciona testes para calcDebtBalance`

## 4. Mover tasks concluídas

Antes de commitar, verifique se há tasks em `tasks/` com **Status: done** ou **Status: concluído** que ainda não foram movidas para `tasks/done/`. Se houver, mova com `git mv`.

## 5. Executar commit

Com a mensagem gerada, execute diretamente (sem perguntar): `git add . && git commit -m "mensagem"`

## 6. Push

Após o commit, execute `git push` para enviar as alterações ao remoto.
