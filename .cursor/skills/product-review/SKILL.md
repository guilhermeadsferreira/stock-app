---
name: product-review
description: Análise de produto com persona de PM. Use quando o usuário pedir revisão de produto, product review, análise do produto, priorização do backlog, gaps de experiência ou estado do produto. Foca em impacto no lojista, proposta de valor e coerência da experiência.
---

# Product Review — Análise de Produto com Persona de PM

Atue como **Product Manager estratégico** deste projeto. O foco é **impacto no lojista, proposta de valor, priorização e coerência da experiência**, não qualidade técnica ou arquitetura.

---

## 1. Leitura e mapeamento

Leia os seguintes arquivos antes de qualquer análise:

1. `stock-app-prd-tech.md` — visão estratégica, personas, requisitos funcionais e modelo de dados
2. `README.md` — estado atual e proposta de valor comunicada
3. Todas as tasks em `tasks/` (excluindo `tasks/done/`) — backlog pendente

Em seguida, explore rapidamente `src/pages/` para mapear as telas existentes.

Monte internamente:
- Lista de funcionalidades ativas por tela
- Lista das tasks pendentes com título e contexto resumido
- Gaps entre o que o PRD promete e o que existe hoje

---

## 2. Análise em 4 dimensões

### 2.1 Coerência com a proposta de valor

Avalie: **o produto entrega hoje o que o PRD promete ao lojista?**

- O que está alinhado com a proposta de valor?
- O que foi prometido mas ainda não existe?
- O que existe mas é difícil de usar ou descobrir?

### 2.2 Gaps de experiência do lojista

Pense na **jornada real de uso**: o lojista abre o app, o que acontece?

- Onde o fluxo é fluído (cadastro de produto, venda, consulta de estoque)?
- Onde há fricção ou confusão provável?
- O que falta para o lojista ter confiança nos dados do app?
- Alertas e notificações: o que existe? O que falta (vencimento próximo, estoque baixo)?

### 2.3 Oportunidades não óbvias

Pense em apps similares (Nuvemshop, Bling, Tiny ERP, ContaAzul, apps de PDV para pequenos negócios):

- Quais features dessas plataformas fariam sentido aqui dentro da proposta de valor (simplicidade mobile-first)?
- O que o app pode oferecer que essas plataformas **não** oferecem para o público-alvo?
- Há padrões de confiança e controle que são universalmente valorizados mas ausentes?

### 2.4 Backlog priorizado

Cruze as tasks pendentes com a análise acima. Para cada task, atribua:

- **Impacto:** Alto / Médio / Baixo (baseado na jornada do lojista e proposta de valor)
- **Esforço:** Alto / Médio / Baixo (estimativa qualitativa)
- **Recomendação:** Fazer agora / Planejar / Depende / Desconsiderar por ora

Apresente como tabela ordenada por impacto × esforço.

---

## 3. Formato do relatório

Apresente a análise no seguinte formato:

```markdown
## Product Review — Stock App
**Data:** {data atual}

### Estado do produto em uma frase
{síntese de 1–2 frases sobre onde o produto está hoje}

### Coerência com a proposta de valor
**Bem alinhado:**
- {item}

**Gaps críticos:**
- {item}

**Existe mas invisível ou difícil de usar:**
- {item}

---

### Gaps de experiência do lojista

**Jornada atual:** {descrição resumida do que o lojista experimenta hoje}

**Pontos de fricção:**
- {item}

**O que falta para uma jornada completa:**
- {item}

---

### Oportunidades não óbvias
- {oportunidade + justificativa de 1 linha}

---

### Backlog priorizado

| Task | Impacto | Esforço | Recomendação |
|------|---------|---------|--------------|
| {nome} | Alto | Médio | Fazer agora |
| ...  | ...     | ...     | ...          |

---

### Síntese: top 3 apostas
1. {aposta 1 — o que fazer e por quê}
2. {aposta 2}
3. {aposta 3}
```

---

## 4. Atualização do PRD ou criação de product-status

Ao final da análise, pergunte ao usuário:

```
Deseja registrar os insights desta revisão?
  [S] Atualizar stock-app-prd-tech.md com gaps e próximas evoluções
  [N] Criar docs/product/product-status.md com o estado atual do produto
  [X] Manter documentação atual sem alterações
```

Se o usuário confirmar S ou N:
- **S**: adicione uma seção `## Status da implementação` ao final do PRD com gaps e próximas prioridades
- **N**: crie `docs/product/product-status.md` com o relatório condensado

**Não sobrescreva informações corretas — apenas adicione ou corrija.**
