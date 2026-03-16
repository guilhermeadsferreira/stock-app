# Alertas de Vencimento no Estoque

**Status:** concluído
**Categoria:** feature
**Artefato:** Filtro "A vencer" na StockPage + badge visual por produto + seção de destaque na HomePage

---

## Objetivo

Exibir, dentro do próprio app, quais produtos estão próximos do vencimento ou já vencidos, aproveitando as regras de domínio e configurações já existentes.

## Contexto

O app já possui toda a infraestrutura necessária para esse recurso:

- `src/domain/rules/stock.rules.ts` — funções `isNearExpiry(date, alertDays)`, `isExpired(date)` e `daysUntilExpiry(date)` implementadas e testadas
- `src/application/stores/settingsStore.ts` — `expirationAlertDays` (padrão: 7 dias) já persistido no localStorage
- `src/domain/types.ts` — `Product.expirationDate: Date | null`

O problema: nenhuma página consome essas regras. O usuário não tem visibilidade sobre produtos próximos do vencimento sem verificar um por um manualmente. Como o app é uma PWA e web notifications são pouco confiáveis (especialmente no iOS), a solução mais robusta é uma experiência in-app proativa.

## Escopo

### Etapa 1 — Filtro "A vencer" na StockPage

**Camada:** `src/pages/stock/StockPage.tsx` (modificação)

Adicionar um toggle/chip de filtro rápido na StockPage, ao lado (ou abaixo) da barra de busca:

- **Todos** (padrão) | **A vencer** | **Vencidos**
- Ao ativar "A vencer": filtra produtos onde `isNearExpiry(p.expirationDate, expirationAlertDays)` retorna `true`
- Ao ativar "Vencidos": filtra produtos onde `isExpired(p.expirationDate)` retorna `true`
- Filtro de busca textual e filtro de vencimento devem funcionar em conjunto

**Pontos de atenção:**
- Importar `isNearExpiry` e `isExpired` de `src/domain/rules/stock.rules.ts` (não da infra)
- Obter `expirationAlertDays` do `useSettingsStore()`

---

### Etapa 2 — Badge de vencimento por produto na lista

**Camada:** `src/pages/stock/StockPage.tsx` (modificação)

Na linha de cada produto da lista, ao lado do `StockBadge`, exibir um indicador visual de vencimento:

- Produto **vencido**: badge vermelho "Vencido"
- Produto **próximo** (dentro de `expirationAlertDays`): badge amarelo/laranja com "X dias" (usando `daysUntilExpiry`)
- Produtos sem `expirationDate` ou fora da janela de alerta: nada exibido

---

### Etapa 3 — Seção de destaque na HomePage

**Camada:** `src/pages/home/HomePage.tsx` (modificação)

Adicionar um card de alerta na HomePage quando houver produtos a vencer ou vencidos:

- Exibe contagem: "3 produtos próximos do vencimento" / "1 produto vencido"
- Toque no card navega para `/stock` com o filtro "A vencer" pré-ativado (via query param `?filter=expiring` ou estado de navegação via `useNavigate` state)
- Só aparece quando há produtos afetados (sem card = tudo ok)

**Pontos de atenção:**
- Reusar os dados já carregados; evitar nova chamada ao banco só para esse card
- Se `products` ainda não estiver carregado na HomePage, não exibir o card (evitar flash)

---

### Etapa 4 — Suporte a query param na StockPage (opcional, necessário se Etapa 3 usar URL)

**Camada:** `src/pages/stock/StockPage.tsx`

Ler `?filter=expiring` ou `?filter=expired` via `useSearchParams` para inicializar o filtro ativo ao chegar da HomePage. Permite que o link da HomePage abra a StockPage já filtrada.

---

## Questões a responder

- O filtro da StockPage deve ser chips/tabs acima da lista ou um seletor dropdown?
- A seção da HomePage deve ficar no topo (antes das métricas) ou no final?
- Quando `expirationAlertDays = 0`, desabilitar os alertas completamente ou tratar como "só expirados"?

## Entregável

| Arquivo | Operação |
|---|---|
| `src/pages/stock/StockPage.tsx` | modificar — filtros + badges |
| `src/pages/home/HomePage.tsx` | modificar — card de alerta |
