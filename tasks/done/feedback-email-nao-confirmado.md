# Feedback de Email Não Confirmado no Login

**Status:** concluída
**Categoria:** feature
**Artefato:** Páginas `LoginPage.tsx` e `SignUpPage.tsx` atualizadas com tratamento de erro específico e fluxo pós-cadastro melhorado

---

## Objetivo

Melhorar a comunicação de erro no login quando o email do usuário ainda não foi confirmado, substituindo a mensagem genérica "Email ou senha incorretos" por uma mensagem clara e acionável.

## Contexto

Atualmente, ao tentar fazer login com um email não confirmado, o Supabase retorna um erro específico (`Email not confirmed`), mas o `LoginPage.tsx` captura qualquer erro e exibe a mensagem genérica `'Email ou senha incorretos'` — o que induz o usuário a acreditar que errou a senha.

O fluxo atual:
1. `signIn` em `useAuth.ts` chama `supabase.auth.signInWithPassword` e relança o erro do Supabase
2. `LoginPage.tsx` captura qualquer erro no bloco `catch` e exibe sempre `'Email ou senha incorretos'`
3. `SignUpPage.tsx` exibe um toast de sucesso e redireciona para `/login` sem deixar claro que o email precisa ser confirmado antes do login

O erro do Supabase para email não confirmado retorna com `error.message === 'Email not confirmed'`.

## Escopo

### Etapa 1 — Tratar erro específico no LoginPage

**Camada:** `src/pages/auth/LoginPage.tsx`

No bloco `catch` do `onSubmit`, inspecionar o erro antes de exibir a mensagem:

- Se `error.message` contiver `'Email not confirmed'` (ou código equivalente), exibir:
  > "Confirme seu email antes de entrar. Verifique sua caixa de entrada."
- Para outros erros, manter a mensagem genérica `'Email ou senha incorretos'`

**Critério de sucesso:** usuário com email não confirmado vê mensagem específica ao tentar logar.

**Ponto de atenção:** o erro do Supabase retorna `{ code: 'email_not_confirmed', message: 'Email not confirmed' }` — usar `error.code === 'email_not_confirmed'` para matching robusto.

### Etapa 2 — Melhorar fluxo pós-cadastro no SignUpPage

**Camada:** `src/pages/auth/SignUpPage.tsx`

Em vez de redirecionar imediatamente para `/login` após o cadastro, exibir uma tela/estado de confirmação dentro da própria `SignUpPage` que:

- Informe claramente que um email de confirmação foi enviado
- Oriente o usuário a verificar a caixa de entrada (e spam)
- Ofereça um link para `/login` somente após o usuário reconhecer que precisa confirmar o email

Alternativa mais simples: manter o redirect para `/login`, mas exibir um banner/alerta persistente na tela de login indicando "Verifique seu email antes de entrar" quando o usuário for redirecionado do cadastro (via `state` do React Router).

**Critério de sucesso:** usuário recém-cadastrado sabe exatamente o que precisa fazer antes de tentar logar.

### Etapa 3 — (Opcional) Botão de reenvio de confirmação

**Camada:** `src/pages/auth/LoginPage.tsx` + `src/application/hooks/useAuth.ts`

Se o erro for de email não confirmado, exibir um botão "Reenviar email de confirmação" que chama `supabase.auth.resend({ type: 'signup', email })`.

**Critério de sucesso:** usuário consegue solicitar novo email sem sair da tela de login.

**Ponto de atenção:** Supabase pode ter rate limit para reenvio; tratar erro de rate limit com mensagem adequada.

## Questões a responder

- O Supabase retorna um campo `code` no erro além de `message`? Verificar se `error.code === 'email_not_confirmed'` é mais confiável que comparar a string do `message`.
- O projeto usa confirmação de email obrigatória no Supabase (configuração do projeto)? Se desabilitada, esse erro nunca ocorreria — mas vale deixar o tratamento para o caso de estar habilitada.
- Preferência de UX: estado inline na `SignUpPage` ou banner na `LoginPage` via router state?

## Entregável

- `src/pages/auth/LoginPage.tsx` — bloco `catch` com detecção do erro de email não confirmado e mensagem específica
- `src/pages/auth/SignUpPage.tsx` — fluxo pós-cadastro com instrução clara sobre confirmação de email
- `src/application/hooks/useAuth.ts` — (se Etapa 3 for implementada) novo método `resendConfirmation(email)`
