# Plan Task — Planejar Execução de uma Task

Planeje a execução da task indicada abaixo.

**Task:** $ARGUMENTS

**IMPORTANTE: Entre no modo Plan antes de fazer qualquer coisa.**

---

## 1. Localizar a task

Procure o arquivo correspondente em `tasks/`. O argumento pode ser:

- O nome exato do arquivo (ex: `historico-de-vendas`)
- Um trecho do título (ex: `historico`, `barcode`)

Se não encontrar correspondência, liste as tasks disponíveis em `tasks/` e pergunte qual o usuário quis dizer.

---

## 2. Analisar a task

Leia o arquivo da task e identifique:

- Objetivo
- **Categoria** (campo `Categoria:` no arquivo — se ausente, infira a partir do conteúdo)
- Escopo e etapas
- Questões em aberto
- Entregável esperado

---

## 3. Coletar contexto do projeto

Antes de planejar, explore o estado atual do projeto para embasar o plano:

- Leia arquivos relevantes em `src/` seguindo as camadas (pages → application → domain → infrastructure)
- Leia `stock-app-prd-tech.md` se a task envolver regras de negócio ou modelo de dados
- Verifique testes existentes em `src/test/` para entender cobertura atual
- Identifique dependências, riscos e decisões arquiteturais

---

## 4. Elaborar o plano de execução

O conteúdo e a profundidade do plano dependem da **categoria da task**:

### Se `decisão-técnica`

O entregável é um ADR — não há implementação de código nesta task.

O plano deve incluir:
- Mapeamento do estado atual relevante
- Opções a avaliar (mínimo 2, máximo 4)
- Critérios de decisão (alinhamento com a arquitetura de 4 camadas, impacto em RLS, manutenibilidade)
- Próximo número de ADR disponível em `docs/adrs/` (verificar ADRs existentes)
- Etapa final: criar `docs/adrs/ADR-NNN-titulo-descritivo.md`
- Marcar task como `Status: concluído` e mover para `tasks/done/`

**Após apresentar o plano:** perguntar se o usuário quer que a pesquisa e a escrita do ADR sejam feitas imediatamente.

---

### Se `feature` ou `refactor`

O plano deve incluir:

**Visão geral** — resumo em 2-3 frases da abordagem.

**Decisões técnicas** — opções com prós/contras e recomendação, respeitando:
- Imports fluem apenas para baixo: pages → application → domain ← infrastructure
- Valores monetários são sempre inteiros em centavos
- RLS é a camada de segurança — não duplicar filtros no JS

**Etapas de execução** — ordenadas, com:
- O que será feito
- Quais arquivos serão criados ou modificados (indicar camada)
- Se há testes a escrever em `src/test/`
- Dependências com outras etapas

**Última etapa obrigatória:** marcar a task como `Status: concluído` e mover para `tasks/done/`.

**Riscos e pontos de atenção.**

**Após apresentar o plano:** perguntar se o usuário quer iniciar a implementação imediatamente ou prefere revisar o plano primeiro.

---

### Se `auditoria`

O plano deve incluir:
- Escopo da auditoria (quais arquivos, quais critérios)
- Metodologia (o que será verificado e como — ex: imports cruzando camadas, floats em valores monetários, streams de câmera sem cleanup)
- Entregável: relatório inline ou arquivo em `docs/`
- Se houver correções, listar como etapas separadas pós-auditoria

**Após apresentar o plano:** perguntar se o usuário quer executar a auditoria imediatamente.

---

### Se `produto` ou `infra`

O plano segue o formato padrão (visão geral → etapas → riscos), adaptado ao tipo de entregável.

- `produto` → atualização no `stock-app-prd-tech.md` ou novo documento em `docs/product/`
- `infra` → configuração de Supabase, Vercel, variáveis de ambiente, schema migrations via Drizzle

**Após apresentar o plano:** perguntar se o usuário quer prosseguir.

---

## 5. Validar com o usuário

Apresente o plano completo e pergunte:

- O plano faz sentido?
- Alguma etapa precisa ser ajustada?
- Alguma decisão técnica precisa de mais discussão?

Aguarde aprovação antes de iniciar qualquer execução.
