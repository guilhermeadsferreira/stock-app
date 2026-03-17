# Fix: Redirect de Confirmação de Email (localhost:3000)

**Status:** em andamento
**Categoria:** infra
**Artefato:** Supabase dashboard configurado com Site URL e Redirect URLs corretos + `emailRedirectTo` dinâmico no `signUp`

---

## Objetivo

Corrigir o redirect do link de confirmação de email, que atualmente aponta para `localhost:3000` em vez da URL real da aplicação.

## Contexto

Ao criar uma conta, o Supabase envia um email de confirmação. O link nesse email usa a **Site URL** configurada no dashboard do Supabase, que está apontando para `localhost:3000` (configuração de desenvolvimento nunca atualizada).

Ao clicar no link de confirmação, o usuário é redirecionado para `localhost:3000`, que não funciona em produção nem em outros ambientes. O usuário reportou também conseguir fazer login sem confirmar o email — isso indica que a opção **"Enable email confirmations"** pode estar desativada no Supabase, ou que o Supabase auto-confirma o usuário no próprio fluxo de `signUp`.

Dois problemas distintos:
1. **URL errada no email** — Site URL no dashboard do Supabase aponta para `localhost:3000`
2. **Confirmação de email** — Comportamento inconsistente: a UI pede confirmação, mas o login funciona sem ela

O código atual em `src/application/hooks/useAuth.ts` chama `supabase.auth.signUp()` sem passar `emailRedirectTo`, deixando o Supabase usar a Site URL configurada no dashboard.

## Escopo

### Etapa 1 — Diagnóstico: estado atual do Supabase

Verificar no Supabase dashboard:

- **Authentication → URL Configuration**
  - `Site URL` — provavelmente está como `http://localhost:3000`
  - `Redirect URLs` — lista de URLs permitidas para redirect pós-confirmação
- **Authentication → Providers → Email**
  - Se `"Enable email confirmations"` está ligado ou desligado

Isso define se o problema é apenas o redirect errado ou se a confirmação de email está completamente desativada.

### Etapa 2 — Decisão: manter ou desativar confirmação de email

Duas opções:

**Opção A — Desativar confirmação de email (mais simples para MVP)**
- Desativar `"Enable email confirmations"` no Supabase dashboard
- Atualizar `SignUpPage.tsx`: após `signUp`, redirecionar diretamente para `/login` com `toast.success('Conta criada com sucesso!')` em vez de mostrar a tela de "confirme seu email"
- Adequado para um app de uso interno/pessoal onde o usuário controla os cadastros

**Opção B — Manter confirmação de email com redirect correto**
- Atualizar Site URL no Supabase para a URL real da aplicação
- Adicionar Redirect URLs permitidas (ex: URL do Vercel/Railway + localhost)
- Passar `emailRedirectTo: window.location.origin` no `signUp` para garantir que o redirect seja sempre dinâmico

### Etapa 3 — Correção de código (se opção B)

Camada: `src/application/hooks/useAuth.ts`

Passar `emailRedirectTo` no `signUp`:

```typescript
async function signUp(email: string, password: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  })
  if (error) throw error
}
```

Isso garante que o link de confirmação sempre aponte para a origem atual da aplicação, independente do ambiente.

### Etapa 4 — Correção de código (se opção A)

Camada: `src/pages/auth/SignUpPage.tsx`

Remover o estado `emailSent` e o fluxo de "confirme seu email". Após `signUp` com sucesso, redirecionar para `/login` com toast de sucesso.

### Etapa 5 — Atualizar variáveis de ambiente (se necessário)

Se o app tiver uma URL de produção definida, adicionar `VITE_APP_URL` como variável de ambiente e usar no `emailRedirectTo` em vez de `window.location.origin`.

## Questões a responder

- A confirmação de email faz sentido para este app? (uso pessoal/interno vs. multi-tenant público)
- Qual é a URL de produção atual? (necessário para configurar o Supabase dashboard)
- O Supabase está com `"Enable email confirmations"` ligado ou desligado?

## Entregável

- Supabase dashboard com Site URL e Redirect URLs corretos
- `useAuth.ts` com `emailRedirectTo` dinâmico (opção B) **ou** `SignUpPage.tsx` sem tela de confirmação (opção A)
- Comportamento consistente: a UI deve refletir exatamente o que o Supabase requer
