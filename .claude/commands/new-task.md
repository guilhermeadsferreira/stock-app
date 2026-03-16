# New Task — Criar Task de Projeto

Crie uma nova task de projeto com base no contexto abaixo.

**Contexto:** $ARGUMENTS

---

## 1. Classificar a task

A partir de `$ARGUMENTS`, determine a **categoria** da task. Use a tabela abaixo como guia:

| Categoria | Quando usar | Artefato de saída esperado |
|-----------|-------------|---------------------------|
| `feature` | Nova funcionalidade de produto | Código implementado nas camadas corretas |
| `refactor` | Melhoria interna sem mudança de comportamento | Código refatorado |
| `decisão-técnica` | Pesquisa + decisão arquitetural sem implementação imediata | ADR em `docs/adrs/` |
| `auditoria` | Revisão de qualidade (código, arquitetura, regras de negócio) | Relatório + correções |
| `produto` | Estratégia, PRD, backlog, regras de negócio | Documento em `docs/product/` |
| `infra` | Supabase, Vercel, Drizzle migrations, variáveis de ambiente | Config + documentação |

Se o contexto for vago, infira a categoria e confirme com o usuário antes de prosseguir.

---

## 2. Destrinchar a task

Expanda o contexto em uma task completa, incluindo:

### Objetivo

Uma frase clara sobre o que deve ser alcançado.

### Contexto

Explique o cenário atual, por que essa task é necessária e como ela se encaixa no projeto. Consulte quando relevante:

- `stock-app-prd-tech.md` — PRD completo com regras de negócio e modelo de dados
- Arquitetura de 4 camadas em `src/` (pages / application / domain / infrastructure)
- Testes existentes em `src/test/`

### Escopo detalhado

Quebre a task em subtópicos ou etapas claras. Para cada etapa, descreva:

- O que precisa ser feito
- Em qual camada (pages / application / domain / infrastructure)
- Critérios de sucesso
- Pontos de atenção (ex: imports entre camadas, valores em centavos, cleanup de streams)

### Questões a responder (se aplicável)

Liste perguntas que precisam ser respondidas durante a execução.

### Entregável

Descreva o resultado concreto esperado com base na categoria:

- `feature` / `refactor` → arquivos criados/modificados por camada
- `infra` → config files, migration, variáveis de ambiente
- `decisão-técnica` → `docs/adrs/ADR-NNN-titulo.md`
- `auditoria` → relatório inline ou arquivo em `docs/`
- `produto` → arquivo em `docs/product/`

---

## 3. Gerar o arquivo

Crie o arquivo em:

```
tasks/{nome-da-task}.md
```

Onde `{nome-da-task}` é o título em kebab-case (ex: `historico-de-vendas`, `leitor-de-barcode`).

Se a pasta `tasks/` não existir, crie-a.

### Formato do arquivo

```markdown
# {Título da Task}

**Status:** pendente
**Categoria:** {feature | refactor | decisão-técnica | auditoria | produto | infra}
**Artefato:** {descrição do entregável concreto}

---

## Objetivo

{objetivo claro}

## Contexto

{contexto expandido e detalhado}

## Escopo

### {Etapa 1}

{descrição detalhada — camada afetada, o que criar/modificar}

### {Etapa 2}

{descrição detalhada}

...

## Questões a responder

- {pergunta 1}
- {pergunta 2}

## Entregável

{resultado concreto esperado}
```

---

## 4. Confirmar

Apresente um resumo da task criada:

```
Task criada: {título}
Categoria: {categoria}
Artefato: {entregável}
Arquivo: tasks/{nome-da-task}.md
Escopo: {n} etapas
```

Pergunte se o usuário quer ajustar algo antes de finalizar.
