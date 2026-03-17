# Sessão e Lembrar Email

**Status:** pendente
**Categoria:** feature + infra
**Artefato:** Config de sessão no Supabase Dashboard + "Lembrar email" no formulário de login

---

## Objetivo

Aumentar a duração da sessão de autenticação para um valor alto (ex: 30 dias) e adicionar funcionalidade de "lembrar email" no formulário de login.

---

## Contexto

### Situação atual

O cliente Supabase está configurado sem opções de autenticação customizadas em `src/infrastructure/supabase/client.ts`:

```ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'stock' },
})
```

Isso significa que o projeto usa os defaults do Supabase JS v2:
- `persistSession: true` — sessão salva no IndexedDB/localStorage do browser
- `autoRefreshToken: true` — token renovado automaticamente em background
- **JWT expiry: 3600 segundos (1 hora)** — padrão do Supabase

Na prática, o `autoRefreshToken` renova o access token silenciosamente enquanto o usuário estiver com o browser aberto. Mas ao fechar o browser e reabrir depois de um tempo, a sessão pode expirar dependendo do tempo de vida do **refresh token** (configurado separadamente no Dashboard).

O formulário de login (`src/pages/auth/LoginPage.tsx`) não tem "lembrar email" — só usa `autoComplete="email"` nativo do browser.

### Por que é necessário

- Usuários relatam que precisam fazer login frequentemente
- O app é um PDV de uso diário — login frequente é fricção desnecessária
- Não há feature de "lembrar email", o que obriga redigitar a cada login em dispositivos sem autocomplete confiável

---

## Escopo

### Etapa 1 — Investigar e ajustar configuração de sessão no Supabase

**Camada:** infra (Supabase Dashboard — sem código)

O que fazer:
1. Acessar o Supabase Dashboard → Authentication → Configuration → **JWT expiry**
   - Valor atual padrão: `3600` segundos (1h)
   - Aumentar para `2592000` (30 dias) ou o máximo permitido
2. Verificar também **Refresh token** expiry (Sessions → Refresh Token Expiry)
   - Padrão: 604800 segundos (7 dias)
   - Aumentar para `2592000` (30 dias) ou conforme a política desejada
3. Habilitar **"Refresh token reuse interval"** se necessário para evitar revogação prematura

Critérios de sucesso:
- Usuário que fecha o browser e reabre após dias continua autenticado
- Nenhuma alteração de código necessária (Supabase JS já respeita os novos valores via refresh token)

Pontos de atenção:
- Aumentar JWT expiry reduz o tempo de revogação efetiva em caso de token comprometido — decisão de segurança consciente para um app de uso pessoal/pequeno negócio
- Documentar os valores configurados em `docs/TECH.md`

---

### Etapa 2 — Feature "Lembrar email" no formulário de login

**Camada:** pages (`src/pages/auth/LoginPage.tsx`) + application (lógica de persistência no hook ou diretamente na page)

O que fazer:
1. Adicionar checkbox "Lembrar email" abaixo do campo de email
2. Ao fazer login com o checkbox marcado, salvar o email em `localStorage` (`key: "rememberedEmail"`)
3. Ao carregar a página de login, ler `localStorage` e pré-preencher o campo email se existir
4. Se o checkbox estiver desmarcado ao fazer login, remover a chave do `localStorage`

**Não implementar**: armazenamento manual de senha. O browser já oferece gerenciamento nativo de senhas via `autoComplete="current-password"` — armazenar senha em `localStorage` seria uma vulnerabilidade de segurança.

Critérios de sucesso:
- Campo email pré-preenchido automaticamente quando "Lembrar email" foi marcado em login anterior
- Checkbox desmarcado por padrão quando não há email salvo
- Checkbox marcado por padrão quando há email salvo (UX: mostra que há um email lembrado)
- Limpar email salvo quando o checkbox for desmarcado e o usuário fizer login

Implementação sugerida em `LoginPage.tsx`:

```tsx
// ao carregar
const savedEmail = localStorage.getItem('rememberedEmail') ?? ''
const [rememberEmail, setRememberEmail] = useState(!!savedEmail)

// defaultValues do form
defaultValues: { email: savedEmail, password: '' }

// no onSubmit
if (rememberEmail) {
  localStorage.setItem('rememberedEmail', values.email)
} else {
  localStorage.removeItem('rememberedEmail')
}
```

Pontos de atenção:
- Usar `defaultValues` do `react-hook-form` para pré-preencher — não usar `setValue` em `useEffect` para evitar bugs de hidratação
- Manter `autoComplete="email"` no input (compatível com a feature)

---

### Etapa 3 — Atualizar documentação

**Camada:** docs

- `docs/TECH.md`: documentar os valores de JWT expiry e refresh token configurados, e a feature de "lembrar email" com `localStorage`
- `docs/PRODUCT_STATUS.md`: marcar a feature como concluída

---

## Questões a responder

- Qual é o tempo de sessão desejado? 30 dias? 90 dias? Indefinido (máximo)?
- Ao aumentar o JWT expiry, existe alguma política de segurança que deve ser respeitada (ex: revogar sessão ao trocar senha)?
- "Lembrar senha" via browser autocomplete é suficiente, ou o usuário quer algo além disso?

---

## Entregável

- **Infra:** JWT expiry e refresh token expiry atualizados no Supabase Dashboard com valores documentados
- **Feature:** `src/pages/auth/LoginPage.tsx` com checkbox "Lembrar email" e lógica de `localStorage`
- **Docs:** `docs/TECH.md` e `docs/PRODUCT_STATUS.md` atualizados
