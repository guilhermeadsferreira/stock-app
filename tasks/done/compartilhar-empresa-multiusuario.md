# Compartilhar Empresa com Outro Usuário

**Status:** pendente
**Categoria:** feature
**Artefato:** Migração de esquema + código em todas as 4 camadas + fluxo de onboarding com código de convite

---

## Objetivo

Permitir que o dono de uma empresa convide um segundo usuário (acesso completo) para compartilhar os dados do negócio, usando um código de convite gerado no app.

---

## Contexto

### Decisões já tomadas

| Questão | Decisão |
|---------|---------|
| Quantos usuários por empresa? | Máximo 2: dono + 1 membro |
| Papéis/permissões? | Acesso completo para ambos (sem distinção de papel) |
| Como o segundo usuário entra? | Cria conta normalmente; após login é perguntado se quer criar empresa ou vincular por código |
| Como o vínculo acontece? | Código de convite gerado pelo dono nas configurações |

### Situação atual

Modelo atual: **one user = one business**. Todas as 7 tabelas (`products`, `stock_entries`, `stock_movements`, `customers`, `sales`, `credit_payments`, `user_profiles`) possuem `user_id` FK e RLS filtra por `user_id = auth.uid()`.

O PRD já previa essa evolução, descrevendo que `user_id` poderia virar `tenant_id` sem mudar a lógica de negócio.

### Modelo de dados resultante

**Nova tabela `businesses`:**
```sql
id          uuid PK default gen_random_uuid()
name        text NOT NULL
owner_id    uuid FK auth.users NOT NULL
invite_code text UNIQUE NOT NULL  -- 8 chars alfanumérico, gerado no create
created_at  timestamptz default now()
```

**Mudança em `user_profiles`:**
```sql
-- Adicionar coluna:
business_id uuid FK businesses NULL  -- NULL até o usuário escolher criar ou vincular
```

**Todas as outras tabelas:** trocar `user_id` → `business_id` (coluna permanece com mesmo tipo uuid, mas FK muda para `businesses.id`).

**Nova RLS (todas as tabelas de dados):**
```sql
-- Usuário tem acesso a linhas da empresa à qual pertence
USING (
  business_id IN (
    SELECT business_id FROM stock.user_profiles
    WHERE id = auth.uid()
    AND business_id IS NOT NULL
  )
)
```

---

## Escopo

### Etapa 1 — Migration de banco (Drizzle)

**Camada:** infrastructure (`src/infrastructure/db/schema.ts` + migration)

1. Adicionar tabela `businesses` no schema Drizzle
2. Adicionar coluna `business_id` em `user_profiles` (nullable)
3. Em todas as 7 tabelas de dados: renomear `user_id` → `business_id`, mudar FK para `businesses.id`
4. Rodar `npm run db:generate` para gerar a migration SQL
5. Aplicar migration no Supabase com `npm run db:push`
6. **Migração de dados existentes** (script SQL): para cada `user_profiles` existente, criar um `businesses` row e preencher `business_id` nas tabelas relacionadas

Script de migração de dados:
```sql
-- 1. Criar uma empresa para cada usuário existente
INSERT INTO stock.businesses (id, name, owner_id, invite_code)
SELECT gen_random_uuid(), up.business_name, up.id, upper(substr(md5(random()::text), 1, 8))
FROM stock.user_profiles up;

-- 2. Atualizar user_profiles com o business_id
UPDATE stock.user_profiles up
SET business_id = b.id
FROM stock.businesses b
WHERE b.owner_id = up.id;

-- 3. Atualizar todas as tabelas de dados (repetir para cada tabela)
UPDATE stock.products p
SET business_id = up.business_id
FROM stock.user_profiles up
WHERE p.user_id = up.id;
-- ... idem para stock_entries, stock_movements, customers, sales, credit_payments

-- 4. Depois de validar, dropar as colunas user_id das tabelas de dados
```

Critérios de sucesso:
- Todos os dados existentes continuam acessíveis pelo dono original
- Migration roda sem erro no ambiente de desenvolvimento

---

### Etapa 2 — RLS policies

**Camada:** infrastructure (SQL no Supabase Dashboard)

Substituir todas as policies `user_id = auth.uid()` pela nova lógica de pertencimento à empresa:

```sql
-- Para cada tabela de dados (products, stock_entries, etc.):
DROP POLICY "..." ON stock.products;
CREATE POLICY "products: business members only"
  ON stock.products FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM stock.user_profiles
      WHERE id = auth.uid() AND business_id IS NOT NULL
    )
  );

-- Para businesses: dono pode ver/editar; membro pode ver
CREATE POLICY "businesses: members can read"
  ON stock.businesses FOR SELECT
  USING (
    id IN (SELECT business_id FROM stock.user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "businesses: owner can update"
  ON stock.businesses FOR UPDATE
  USING (owner_id = auth.uid());

-- Para user_profiles: usuário vê e edita apenas o próprio
CREATE POLICY "user_profiles: own only"
  ON stock.user_profiles FOR ALL
  USING (id = auth.uid());
```

Critérios de sucesso:
- Usuário A não consegue ver dados do usuário B (mesmo após compartilhamento, só vê dados da empresa compartilhada)
- Segundo usuário vê exatamente os mesmos dados do dono

---

### Etapa 3 — Domain layer

**Camada:** domain (`src/domain/`)

1. **`types.ts`**: adicionar `Business` e atualizar todas as entidades
```ts
export interface Business {
  id: string
  name: string
  ownerId: string
  inviteCode: string
  createdAt: string
}

// Todas as entidades: trocar userId → businessId
export interface Product {
  businessId: string  // era userId
  // ...resto igual
}
```

2. **`repositories/IBusinessRepository.ts`** (novo):
```ts
export interface IBusinessRepository {
  findById(businessId: string): Promise<Business | null>
  findByInviteCode(code: string): Promise<Business | null>
  create(name: string, ownerId: string): Promise<Business>
  regenerateInviteCode(businessId: string): Promise<string>
}
```

3. **Interfaces existentes**: todos os métodos trocam `userId` → `businessId` na assinatura

Critérios de sucesso:
- Sem imports externos no domain layer
- Tipos consistentes com o novo schema

---

### Etapa 4 — Infrastructure layer

**Camada:** infrastructure (`src/infrastructure/supabase/`)

1. **`BusinessRepository.ts`** (novo): implementa `IBusinessRepository`
2. **Todos os repositórios existentes**: trocar `user_id` → `business_id` em todas as queries e no `mapRow()`
   - `ProductRepository.ts`
   - `StockRepository.ts`
   - `SaleRepository.ts`
   - `CustomerRepository.ts`
   - `CreditRepository.ts`

Critérios de sucesso:
- Nenhuma query usa `user_id` após a migração
- `mapRow()` de cada repositório mapeia `business_id` corretamente

---

### Etapa 5 — Application layer

**Camada:** application (`src/application/`)

1. **`authStore.ts`**: adicionar `currentBusiness: Business | null` e setter

2. **`useAuth.ts`**: após `getSession()`, buscar o `business_id` do `user_profiles` e popular o store
```ts
// após autenticar, resolver a empresa do usuário:
const profile = await userProfileRepo.findById(user.id)
setCurrentBusiness(profile?.businessId ? await businessRepo.findById(profile.businessId) : null)
```

3. **`useBusiness.ts`** (novo hook):
```ts
// Expõe:
createBusiness(name: string): Promise<void>
joinByCode(code: string): Promise<void>  // vincula user_profiles.business_id
getInviteCode(): string
regenerateInviteCode(): Promise<void>
```

4. **`settingsStore.ts`**: `businessName` deixa de viver no localStorage — passa a ser lido de `Business.name` do store. Manter `lowStockThreshold` e `expirationAlertDays` por empresa (mover para `businesses` table ou manter em `user_profiles` do dono).

Critérios de sucesso:
- Todos os hooks passam `businessId` (não `userId`) para os repositórios
- `createSale` em `useSales.ts` usa `businessId`

---

### Etapa 6 — Fluxo de onboarding pós-cadastro

**Camada:** pages (`src/pages/auth/` ou `src/pages/onboarding/`)

Após login, se `currentBusiness === null`, redirecionar para tela de onboarding:

**`OnboardingPage.tsx`** (nova):
- Dois cards: "Criar minha empresa" e "Entrar em uma empresa existente"
- **Criar empresa**: input para nome do negócio → chama `useBusiness.createBusiness()` → redireciona para `/`
- **Entrar em empresa**: input para código de 8 caracteres → chama `useBusiness.joinByCode()` → redireciona para `/`

**`ProtectedRoute.tsx`**: ajustar lógica — se há sessão mas não há `currentBusiness`, redirecionar para `/onboarding` em vez de `/`

Critérios de sucesso:
- Novo usuário não consegue acessar o app sem escolher criar ou vincular empresa
- Código inválido exibe mensagem de erro clara
- Código válido mas empresa já com 2 membros exibe mensagem de "empresa cheia"

---

### Etapa 7 — Tela de membros nas Configurações

**Camada:** pages (`src/pages/settings/` ou componente dentro de Settings)

Na tela de configurações, nova seção "Membros":
- Exibe o código de convite (copiável com um toque)
- Botão "Gerar novo código" (invalida o anterior)
- Lista os membros atuais (no máximo 2): nome/email + badge "Dono" ou "Membro"
- Botão "Remover membro" (só visível para o dono, remove `business_id` do `user_profiles` do membro)

Critérios de sucesso:
- Dono consegue ver e compartilhar o código
- Dono consegue remover o membro (segundo usuário perde acesso imediatamente via RLS)

---

### Etapa 8 — Atualizar documentação

**Camada:** docs

- `docs/TECH.md`: novo schema (`businesses`), nova RLS, novo fluxo de onboarding
- `docs/PRODUCT_STATUS.md`: marcar feature como concluída, remover de backlog
- `stock-app-prd-tech.md`: atualizar seção de multi-tenancy com as decisões tomadas

---

## Questões a responder durante a execução

- `lowStockThreshold` e `expirationAlertDays` são por empresa (ficam em `businesses`) ou por usuário (ficam em `user_profiles`)? Se o segundo usuário mudar o threshold, o dono é afetado?
- O que acontece se o dono sair da empresa? (Edge case: transferir ownership ou bloquear remoção do dono)
- Validação de "empresa cheia": onde fica — na RLS (policy com `COUNT`) ou no repositório?

---

## Entregável

- **Migration Drizzle** + script SQL de migração de dados existentes
- **`businesses` table** com `invite_code`
- **Domain**: `Business` type + `IBusinessRepository` + entidades atualizadas (`businessId`)
- **Infrastructure**: `BusinessRepository` + todos os repositórios existentes atualizados
- **Application**: `useBusiness` hook + `authStore` atualizado + `useAuth` resolvendo empresa
- **Pages**: `OnboardingPage` (criar/vincular) + seção "Membros" em Settings + `ProtectedRoute` atualizado
- **Docs**: `TECH.md`, `PRODUCT_STATUS.md`, `stock-app-prd-tech.md` atualizados
