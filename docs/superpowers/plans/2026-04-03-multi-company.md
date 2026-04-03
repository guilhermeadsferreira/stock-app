# Multi-Company por Usuário — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que um usuário pertença a múltiplas empresas sem limite, com tela dedicada para trocar de empresa e fluxo de criação/ingresso aditivo.

**Architecture:** Expand-contract seguro para produção — adicionamos a junction table `user_business` com backfill dos dados existentes, sem remover `user_profiles.business_id` neste ciclo. O app passa a ler da nova tabela. Remoção da coluna antiga fica para um ciclo futuro após validação.

**Tech Stack:** React, TypeScript, Zustand, Supabase JS, Drizzle ORM, React Router v7, Tailwind CSS, Lucide Icons

> ⚠️ **PRODUÇÃO COM DADOS REAIS**: Produtos e todos os dados de negócio têm `business_id` e NÃO são tocados. Apenas o vínculo usuário↔empresa muda. O backfill preserva todos os vínculos existentes.

---

## File Map

| Arquivo | Ação | O que muda |
|---|---|---|
| `src/infrastructure/db/schema.ts` | Modificar | Adiciona tabela `userBusiness` |
| `src/domain/types.ts` | Modificar | Adiciona `UserBusiness`, mantém `UserProfile` |
| `src/infrastructure/supabase/BusinessRepository.ts` | Modificar | `listForUser()`, dual-write em `create/addMember/removeMember`, `listMembers` e `getMemberCount` via junction |
| `src/application/stores/authStore.ts` | Modificar | Adiciona `businesses: Business[]` e `setBusinesses()` |
| `src/application/hooks/useAuth.ts` | Modificar | `loadBusinessesForUser()` lê da junction table, persiste `selectedBusinessId` no localStorage |
| `src/application/hooks/useBusiness.ts` | Modificar | `createBusiness/joinByCode` aditivos, adiciona `switchBusiness()` |
| `src/components/layout/ProtectedRoute.tsx` | Modificar | Sem `currentBusiness` → `/companies` (não mais `/onboarding`) |
| `src/components/layout/AppShell.tsx` | Modificar | Header com nome da empresa atual + link para `/companies` |
| `src/pages/companies/CompaniesPage.tsx` | Criar | Tela dedicada: lista empresas, troca, cria, entra por código |
| `src/pages/onboarding/OnboardingPage.tsx` | Modificar | Se `businesses.length > 0` → redireciona para `/companies` |
| `src/router/index.tsx` | Modificar | Adiciona rota `/companies` |

---

## Task 1: Schema — Adiciona tabela `userBusiness`

**Files:**
- Modify: `src/infrastructure/db/schema.ts`

- [ ] **Step 1: Adicionar import de `primaryKey` e a nova tabela**

Em `src/infrastructure/db/schema.ts`, adicionar `primaryKey` ao import e a definição da tabela ao final:

```typescript
import {
  pgSchema,
  uuid,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,  // ← adicionar
} from 'drizzle-orm/pg-core'

// ... restante do arquivo sem alteração ...

export const userBusiness = stockSchema.table('user_business', {
  userId: uuid('user_id').notNull(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'), // 'owner' | 'member'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.businessId] }),
  index('user_business_user_id_idx').on(t.userId),
])
```

- [ ] **Step 2: Gerar migration**

```bash
npm run db:generate
```

Esperado: novo arquivo em `drizzle/` com o `CREATE TABLE stock.user_business`.

- [ ] **Step 3: Verificar o SQL gerado**

Abrir o arquivo gerado e confirmar que contém apenas `CREATE TABLE stock.user_business` — não deve haver `DROP` ou `ALTER` de tabelas existentes.

---

## Task 2: Migration — Aplicar em produção com backfill

> ⚠️ NÃO usar `db:push` em produção. Executar manualmente no Supabase SQL Editor.

**Files:** (nenhum arquivo do app)

- [ ] **Step 1: Abrir Supabase Dashboard → SQL Editor**

- [ ] **Step 2: Executar a migration completa (criar tabela + backfill)**

Copiar e executar o SQL abaixo no editor:

```sql
-- 1. Criar a junction table
CREATE TABLE IF NOT EXISTS stock.user_business (
  user_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES stock.businesses(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, business_id)
);

CREATE INDEX IF NOT EXISTS user_business_user_id_idx ON stock.user_business(user_id);

-- 2. Backfill: copiar vínculos existentes de user_profiles para user_business
-- Determina role pelo owner_id na tabela businesses
INSERT INTO stock.user_business (user_id, business_id, role)
SELECT
  up.id,
  up.business_id,
  CASE
    WHEN b.owner_id = up.id THEN 'owner'
    ELSE 'member'
  END
FROM stock.user_profiles up
JOIN stock.businesses b ON b.id = up.business_id
WHERE up.business_id IS NOT NULL
ON CONFLICT (user_id, business_id) DO NOTHING;
```

- [ ] **Step 3: Verificar backfill**

```sql
-- Deve retornar o mesmo número de linhas que user_profiles com business_id preenchido
SELECT COUNT(*) FROM stock.user_business;
SELECT COUNT(*) FROM stock.user_profiles WHERE business_id IS NOT NULL;
```

Os dois counts devem ser iguais.

- [ ] **Step 4: Verificar integridade dos vínculos**

```sql
-- Nenhuma linha deve retornar (todos os vínculos têm business válida)
SELECT ub.user_id, ub.business_id
FROM stock.user_business ub
LEFT JOIN stock.businesses b ON b.id = ub.business_id
WHERE b.id IS NULL;
```

Esperado: 0 linhas.

---

## Task 3: Domain Types — Adiciona `UserBusiness`

**Files:**
- Modify: `src/domain/types.ts`

- [ ] **Step 1: Adicionar tipo `UserBusiness` e `BusinessRole`**

Após a interface `UserProfile`:

```typescript
export type BusinessRole = 'owner' | 'member'

export interface UserBusiness {
  userId: string
  businessId: string
  role: BusinessRole
  createdAt: Date
}
```

> `UserProfile` permanece intacta (com `businessId: string | null`) durante a transição. Não remover.

- [ ] **Step 2: Confirmar que não há erros de TypeScript**

```bash
npx tsc --noEmit
```

Esperado: nenhum erro.

---

## Task 4: BusinessRepository — Dual-write e listagem via junction

**Files:**
- Modify: `src/infrastructure/supabase/BusinessRepository.ts`

- [ ] **Step 1: Adicionar `listForUser()`**

Após o método `findByInviteCode`, adicionar:

```typescript
async listForUser(userId: string): Promise<Business[]> {
  const { data, error } = await this.client
    .from('user_business')
    .select('business_id, businesses(*)')
    .eq('user_id', userId)
  if (error || !data) return []
  return data
    .map((row: any) => row.businesses) // eslint-disable-line @typescript-eslint/no-explicit-any
    .filter(Boolean)
    .map(mapBusiness)
}
```

- [ ] **Step 2: Atualizar `create()` — dual-write**

Substituir o método `create` completo:

```typescript
async create(name: string, ownerId: string, ownerEmail: string): Promise<Business> {
  const inviteCode = generateCode()
  const id = crypto.randomUUID()
  const createdAt = new Date()

  const { error: bizError } = await this.client
    .from('businesses')
    .insert({ id, name, owner_id: ownerId, invite_code: inviteCode })
  if (bizError) throw new Error(bizError.message)

  // Dual-write: mantém user_profiles.business_id + escreve na junction
  await this.client
    .from('user_profiles')
    .upsert({ id: ownerId, email: ownerEmail, business_id: id })

  await this.client
    .from('user_business')
    .upsert({ user_id: ownerId, business_id: id, role: 'owner' })

  return { id, name, ownerId, inviteCode, lowStockThreshold: 5, expirationAlertDays: 7, createdAt }
}
```

- [ ] **Step 3: Atualizar `addMember()` — dual-write**

```typescript
async addMember(businessId: string, userId: string, userEmail: string): Promise<void> {
  // Dual-write: mantém user_profiles.business_id + escreve na junction
  await this.client
    .from('user_profiles')
    .upsert({ id: userId, email: userEmail, business_id: businessId })

  await this.client
    .from('user_business')
    .upsert({ user_id: userId, business_id: businessId, role: 'member' })
}
```

- [ ] **Step 4: Atualizar `removeMember()` — remove da junction**

```typescript
async removeMember(businessId: string, userId: string): Promise<void> {
  // Remove da junction table
  await this.client
    .from('user_business')
    .delete()
    .eq('user_id', userId)
    .eq('business_id', businessId)

  // Mantém user_profiles.business_id como null (transição segura)
  await this.client
    .from('user_profiles')
    .update({ business_id: null })
    .eq('id', userId)
    .eq('business_id', businessId)
}
```

- [ ] **Step 5: Atualizar `getMemberCount()` — usa junction**

```typescript
async getMemberCount(businessId: string): Promise<number> {
  const { count } = await this.client
    .from('user_business')
    .select('user_id', { count: 'exact', head: true })
    .eq('business_id', businessId)
  return count ?? 0
}
```

- [ ] **Step 6: Atualizar `listMembers()` — usa junction**

```typescript
async listMembers(businessId: string): Promise<BusinessMember[]> {
  const { data: biz } = await this.client
    .from('businesses')
    .select('owner_id')
    .eq('id', businessId)
    .single()

  const { data: members } = await this.client
    .from('user_business')
    .select('user_id, role, user_profiles(email)')
    .eq('business_id', businessId)

  if (!members) return []

  return members.map((m: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    id: m.user_id,
    email: m.user_profiles?.email ?? '',
    isOwner: m.user_id === biz?.owner_id,
  }))
}
```

- [ ] **Step 7: Confirmar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: nenhum erro.

---

## Task 5: authStore — Estado multi-empresa

**Files:**
- Modify: `src/application/stores/authStore.ts`

- [ ] **Step 1: Adicionar `businesses` e `setBusinesses` ao store**

Substituir o arquivo completo:

```typescript
import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import type { Business } from '@/domain/types'

interface AuthState {
  user: User | null
  session: Session | null
  businesses: Business[]
  currentBusiness: Business | null
  isLoading: boolean
  setAuth: (user: User | null, session: Session | null) => void
  setBusinesses: (businesses: Business[]) => void
  setCurrentBusiness: (business: Business | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  businesses: [],
  currentBusiness: null,
  isLoading: true,
  setAuth: (user, session) => set({ user, session }),
  setBusinesses: (businesses) => set({ businesses }),
  setCurrentBusiness: (currentBusiness) => set({ currentBusiness }),
  setLoading: (isLoading) => set({ isLoading }),
}))
```

- [ ] **Step 2: Confirmar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: nenhum erro (ou erros resolvíveis nas tasks seguintes).

---

## Task 6: useAuth — Carregamento multi-empresa com persistência

**Files:**
- Modify: `src/application/hooks/useAuth.ts`

- [ ] **Step 1: Substituir `loadBusinessForUser` por `loadBusinessesForUser`**

Substituir o arquivo completo:

```typescript
import { useEffect } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { router } from '@/router'
import { BusinessRepository } from '@/infrastructure/supabase/BusinessRepository'
import { useAuthStore } from '@/application/stores/authStore'
import type { Business } from '@/domain/types'

const businessRepo = new BusinessRepository(supabase)
const SELECTED_BUSINESS_KEY = 'selectedBusinessId'

async function loadBusinessesForUser(userId: string): Promise<Business[]> {
  const timeout = new Promise<Business[]>((resolve) => setTimeout(() => resolve([]), 8000))
  const fetch = businessRepo.listForUser(userId)
  return Promise.race([fetch, timeout])
}

function pickCurrentBusiness(businesses: Business[]): Business | null {
  if (businesses.length === 0) return null
  const savedId = localStorage.getItem(SELECTED_BUSINESS_KEY)
  if (savedId) {
    const saved = businesses.find((b) => b.id === savedId)
    if (saved) return saved
  }
  return businesses[0]
}

export function useAuthListener() {
  const { setAuth, setLoading, setBusinesses, setCurrentBusiness } = useAuthStore()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null
      setAuth(user, session)

      if (event === 'PASSWORD_RECOVERY') {
        router.navigate('/reset-password', { replace: true })
        return
      }

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        try {
          if (!user) {
            setBusinesses([])
            setCurrentBusiness(null)
          } else if (useAuthStore.getState().businesses.length === 0) {
            // Só busca se ainda não temos businesses carregadas.
            // Evita re-fetch em refreshes de token que disparam SIGNED_IN.
            const businesses = await loadBusinessesForUser(user.id)
            setBusinesses(businesses)
            setCurrentBusiness(pickCurrentBusiness(businesses))
          }
        } finally {
          setLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
        setBusinesses([])
        setCurrentBusiness(null)
        localStorage.removeItem(SELECTED_BUSINESS_KEY)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [setAuth, setLoading, setBusinesses, setCurrentBusiness])
}

export function useAuth() {
  const { user, session, isLoading } = useAuthStore()

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { user, session, isLoading, signIn, signUp, signOut }
}
```

- [ ] **Step 2: Confirmar TypeScript**

```bash
npx tsc --noEmit
```

---

## Task 7: useBusiness — Operações aditivas + switchBusiness

**Files:**
- Modify: `src/application/hooks/useBusiness.ts`

- [ ] **Step 1: Substituir o hook completo**

```typescript
import { useCallback } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { BusinessRepository } from '@/infrastructure/supabase/BusinessRepository'
import { useAuthStore } from '@/application/stores/authStore'
import type { Business, BusinessMember } from '@/domain/types'

const businessRepo = new BusinessRepository(supabase)
const SELECTED_BUSINESS_KEY = 'selectedBusinessId'

export function useBusiness() {
  const { user, businesses, currentBusiness, setBusinesses, setCurrentBusiness } = useAuthStore()

  const switchBusiness = useCallback((business: Business) => {
    localStorage.setItem(SELECTED_BUSINESS_KEY, business.id)
    setCurrentBusiness(business)
  }, [setCurrentBusiness])

  const createBusiness = useCallback(async (name: string) => {
    if (!user) throw new Error('Não autenticado')
    const business = await businessRepo.create(name, user.id, user.email ?? '')
    const updated = [...businesses, business]
    setBusinesses(updated)
    switchBusiness(business)
  }, [user, businesses, setBusinesses, switchBusiness])

  const joinByCode = useCallback(async (code: string) => {
    if (!user) throw new Error('Não autenticado')
    const business = await businessRepo.findByInviteCode(code.toUpperCase())
    if (!business) throw new Error('Código inválido')
    const alreadyMember = businesses.some((b) => b.id === business.id)
    if (alreadyMember) throw new Error('Já é membro desta empresa')
    await businessRepo.addMember(business.id, user.id, user.email ?? '')
    const updated = [...businesses, business]
    setBusinesses(updated)
    switchBusiness(business)
  }, [user, businesses, setBusinesses, switchBusiness])

  const removeMember = useCallback(async (memberId: string) => {
    if (!currentBusiness) throw new Error('Sem empresa ativa')
    await businessRepo.removeMember(currentBusiness.id, memberId)
  }, [currentBusiness])

  const getInviteCode = useCallback(() => {
    return currentBusiness?.inviteCode ?? ''
  }, [currentBusiness])

  const regenerateInviteCode = useCallback(async () => {
    if (!currentBusiness) throw new Error('Sem empresa ativa')
    const newCode = await businessRepo.regenerateInviteCode(currentBusiness.id)
    const updated = currentBusiness ? { ...currentBusiness, inviteCode: newCode } : null
    if (updated) {
      setBusinesses(businesses.map((b) => b.id === currentBusiness.id ? updated : b))
      setCurrentBusiness(updated)
    }
    return newCode
  }, [currentBusiness, businesses, setBusinesses, setCurrentBusiness])

  const listMembers = useCallback(async (): Promise<BusinessMember[]> => {
    if (!currentBusiness) return []
    return businessRepo.listMembers(currentBusiness.id)
  }, [currentBusiness])

  return { switchBusiness, createBusiness, joinByCode, removeMember, getInviteCode, regenerateInviteCode, listMembers }
}
```

- [ ] **Step 2: Confirmar TypeScript**

```bash
npx tsc --noEmit
```

---

## Task 8: ProtectedRoute — Redirect atualizado

**Files:**
- Modify: `src/components/layout/ProtectedRoute.tsx`

- [ ] **Step 1: Atualizar lógica de redirect**

Quando autenticado mas sem `currentBusiness`, vai para `/companies` (não mais `/onboarding`). Onboarding só para quem não tem nenhuma empresa.

```typescript
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/application/stores/authStore'

interface Props {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const { session, businesses, currentBusiness, isLoading } = useAuthStore()

  if (session && currentBusiness) {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Autenticado, sem empresa selecionada
  if (businesses.length === 0) {
    return <Navigate to="/onboarding" replace />
  }

  // Tem empresas mas nenhuma selecionada (ex: saiu de uma empresa)
  return <Navigate to="/companies" replace />
}
```

- [ ] **Step 2: Confirmar TypeScript**

```bash
npx tsc --noEmit
```

---

## Task 9: CompaniesPage — Tela dedicada de empresas

**Files:**
- Create: `src/pages/companies/CompaniesPage.tsx`

- [ ] **Step 1: Criar a página**

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, Plus, LogIn, ChevronLeft, Building2 } from 'lucide-react'
import { useBusiness } from '@/application/hooks/useBusiness'
import { useAuthStore } from '@/application/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function CompaniesPage() {
  const navigate = useNavigate()
  const { businesses, currentBusiness, user } = useAuthStore()
  const { switchBusiness, createBusiness, joinByCode } = useBusiness()

  const [mode, setMode] = useState<'list' | 'create' | 'join'>('list')
  const [businessName, setBusinessName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSwitch(businessId: string) {
    const business = businesses.find((b) => b.id === businessId)
    if (!business) return
    switchBusiness(business)
    navigate('/', { replace: true })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!businessName.trim()) return
    setLoading(true)
    try {
      await createBusiness(businessName.trim())
      navigate('/', { replace: true })
    } catch {
      toast.error('Erro ao criar empresa')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (inviteCode.length < 8) return
    setLoading(true)
    try {
      await joinByCode(inviteCode.trim())
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'Já é membro desta empresa') {
        toast.error('Você já faz parte desta empresa')
      } else if (msg === 'Código inválido') {
        toast.error('Código de convite inválido')
      } else {
        toast.error('Erro ao entrar na empresa')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe pb-2 pt-4 border-b">
        {currentBusiness && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold">Minhas empresas</h1>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3 max-w-lg mx-auto w-full">
        {mode === 'list' && (
          <>
            {/* Lista de empresas */}
            {businesses.map((business) => {
              const isActive = business.id === currentBusiness?.id
              const isOwner = business.ownerId === user?.id
              return (
                <button
                  key={business.id}
                  onClick={() => handleSwitch(business.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                    isActive
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  )}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{business.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isOwner ? 'Proprietário' : 'Membro'}
                    </p>
                  </div>
                  {isActive && (
                    <Check className="h-5 w-5 text-primary shrink-0" />
                  )}
                </button>
              )
            })}

            {/* Ações */}
            <div className="pt-2 space-y-2">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl"
                onClick={() => setMode('create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar nova empresa
              </Button>
              <Button
                variant="ghost"
                className="w-full h-11 rounded-xl"
                onClick={() => setMode('join')}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Entrar com código de convite
              </Button>
            </div>
          </>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <button
              onClick={() => { setMode('list'); setBusinessName('') }}
              className="flex items-center gap-1 text-sm text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
            <h2 className="font-semibold text-base">Nova empresa</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                placeholder="Nome da empresa"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={loading}
                className="rounded-xl h-11"
                autoFocus
              />
              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold"
                disabled={loading || !businessName.trim()}
              >
                {loading ? 'Criando...' : 'Criar empresa'}
              </Button>
            </form>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <button
              onClick={() => { setMode('list'); setInviteCode('') }}
              className="flex items-center gap-1 text-sm text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
            <h2 className="font-semibold text-base">Entrar em empresa</h2>
            <form onSubmit={handleJoin} className="space-y-3">
              <Input
                placeholder="Código de convite (8 caracteres)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={8}
                disabled={loading}
                className="rounded-xl h-11"
                autoFocus
              />
              <Button
                type="submit"
                variant="outline"
                className="w-full h-11 rounded-xl font-semibold"
                disabled={loading || inviteCode.length < 8}
              >
                {loading ? 'Entrando...' : 'Entrar com código'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Task 10: AppShell — Header com empresa atual

**Files:**
- Modify: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Adicionar header com nome da empresa e link para /companies**

```typescript
import { Outlet, useNavigate } from 'react-router-dom'
import { Building2, ChevronRight } from 'lucide-react'
import { BottomNav } from './BottomNav'
import { useAuthStore } from '@/application/stores/authStore'

export function AppShell() {
  const navigate = useNavigate()
  const { currentBusiness, businesses } = useAuthStore()

  const showSwitcher = businesses.length > 1

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header com empresa atual */}
      {currentBusiness && (
        <header className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-40">
          <button
            onClick={() => navigate('/companies')}
            disabled={!showSwitcher}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
          >
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="flex-1 text-sm font-medium truncate">{currentBusiness.name}</span>
            {showSwitcher && (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>
        </header>
      )}

      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
```

> O header só mostra o chevron (indicando que é clicável) quando o usuário tem mais de uma empresa. Com apenas uma empresa, o header exibe o nome mas não navega.

---

## Task 11: OnboardingPage — Redirecionamento aditivo

**Files:**
- Modify: `src/pages/onboarding/OnboardingPage.tsx`

- [ ] **Step 1: Atualizar redirect — usuário com empresas vai para /companies**

Substituir o `useEffect` atual:

```typescript
useEffect(() => {
  if (!isLoading && currentBusiness) {
    navigate('/', { replace: true })
  }
  if (!isLoading && !currentBusiness && businesses.length > 0) {
    // Tem empresas mas nenhuma selecionada — vai para tela de seleção
    navigate('/companies', { replace: true })
  }
  if (!isLoading && !session) {
    navigate('/login', { replace: true })
  }
}, [isLoading, currentBusiness, businesses, session, navigate])
```

E atualizar o destructure do store:

```typescript
const { session, businesses, currentBusiness, isLoading } = useAuthStore()
```

> O restante do OnboardingPage (formulários de criar/entrar) permanece idêntico — serve apenas para novos usuários sem nenhuma empresa.

---

## Task 12: Router — Nova rota /companies

**Files:**
- Modify: `src/router/index.tsx`

- [ ] **Step 1: Importar e registrar CompaniesPage**

Adicionar import:

```typescript
import { CompaniesPage } from '@/pages/companies/CompaniesPage'
```

Adicionar rota como irmã de `/onboarding` (fora do ProtectedRoute principal):

```typescript
{
  path: '/companies',
  element: <CompaniesPage />,
},
```

> `CompaniesPage` não entra dentro do `ProtectedRoute` com `AppShell` pois precisa ser acessível mesmo quando `currentBusiness` é null (para o usuário escolher qual empresa usar).

---

## Task 13: Build final e verificação

- [ ] **Step 1: Build completo**

```bash
npm run build
```

Esperado: build limpo sem erros de TypeScript ou bundle.

- [ ] **Step 2: Teste manual — fluxo novo usuário**

1. Criar conta → deve cair em `/onboarding`
2. Criar empresa → deve ir para `/`
3. Header deve mostrar o nome da empresa

- [ ] **Step 3: Teste manual — usuário existente, segunda empresa**

1. Login → deve ir para `/` com empresa atual no header
2. Navegar para `/companies` → deve listar a empresa atual com checkmark
3. Clicar "Criar nova empresa" → criar → deve voltar para `/` com nova empresa selecionada
4. Voltar para `/companies` → deve listar as 2 empresas, nova com checkmark
5. Clicar na primeira empresa → deve voltar para `/` com empresa 1 selecionada
6. Recarregar a página → empresa 1 deve continuar selecionada (persistência via localStorage)

- [ ] **Step 4: Commit**

```bash
git checkout -b feat/multi-company
git add src/ docs/
git commit -m "feat(auth): suporte a múltiplas empresas por usuário"
git push -u origin feat/multi-company
```

---

## Notas de Segurança

- `user_profiles.business_id` permanece preenchida (dual-write) durante esta fase. Não remover.
- RLS policies atuais (se existirem) continuam funcionando via `user_profiles`.
- A remoção de `user_profiles.business_id` e reescrita de RLS fica para um ciclo futuro após validação em produção.

## Fase Futura (Contract)

Após validar tudo em produção por alguns dias:

1. Remover `user_profiles.business_id` do schema e do app
2. Reescrever RLS policies para usar `user_business` como fonte de verdade
3. Remover dual-write dos métodos `create()` e `addMember()`
