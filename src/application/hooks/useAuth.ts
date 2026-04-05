import { useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/infrastructure/supabase/client'
import { router } from '@/router'
import { BusinessRepository } from '@/infrastructure/supabase/BusinessRepository'
import { useAuthStore } from '@/application/stores/authStore'
import type { Business } from '@/domain/types'

const businessRepo = new BusinessRepository(supabase)
const SELECTED_BUSINESS_KEY = 'selectedBusinessId'

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer!)
  }
}

async function loadBusinessesForUser(userId: string): Promise<Business[]> {
  return withTimeout(businessRepo.listForUser(userId), 8000, [])
}

async function loadDisplayName(userId: string): Promise<string | null> {
  const query = supabase
    .from('user_profiles')
    .select('name')
    .eq('id', userId)
    .single()
    .then(({ data }) => data?.name ?? null)
  return withTimeout(Promise.resolve(query), 8000, null)
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

function clearAuthState() {
  localStorage.removeItem(SELECTED_BUSINESS_KEY)
  useAuthStore.setState({
    user: null,
    session: null,
    businesses: null,
    currentBusiness: null,
    displayName: null,
    isLoading: false,
  })
}

async function forceSignOut() {
  await supabase.auth.signOut().catch(() => {})
  clearAuthState()
}

export function useAuthListener() {
  useEffect(() => {
    let mounted = true
    let businessLoadInProgress = false

    async function loadUserData(user: User): Promise<void> {
      // Evita loads concorrentes (INITIAL_SESSION + SIGNED_IN em sequência rápida)
      if (businessLoadInProgress) return

      // Se já tem businesses carregadas, não recarregar
      const current = useAuthStore.getState()
      if (current.businesses && current.businesses.length > 0 && current.currentBusiness) {
        useAuthStore.setState({ isLoading: false })
        return
      }

      businessLoadInProgress = true
      useAuthStore.setState({ isLoading: true })

      try {
        const [businesses, displayName] = await Promise.all([
          loadBusinessesForUser(user.id),
          loadDisplayName(user.id),
        ])

        if (!mounted) return

        const selected = pickCurrentBusiness(businesses)
        useAuthStore.setState({
          businesses,
          currentBusiness: selected,
          displayName,
          isLoading: false,
        })
      } catch {
        if (!mounted) return
        // Falha ao carregar dados → sessão provavelmente inválida
        await forceSignOut()
      } finally {
        businessLoadInProgress = false
      }
    }

    // 1. Inicialização explícita via getSession() — não depende de evento
    async function initSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error || !session?.user) {
          clearAuthState()
          return
        }

        useAuthStore.setState({ user: session.user, session })
        await loadUserData(session.user)
      } catch {
        if (!mounted) return
        clearAuthState()
      }
    }

    initSession()

    // 2. Listener para mudanças subsequentes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      const user = session?.user ?? null

      // INITIAL_SESSION já foi tratado por initSession() — ignorar para evitar load duplo
      if (event === 'INITIAL_SESSION') return

      // TOKEN_REFRESHED: atualiza sessão no store mas não precisa recarregar dados
      if (event === 'TOKEN_REFRESHED') {
        useAuthStore.setState({ user, session })
        return
      }

      if (event === 'PASSWORD_RECOVERY') {
        useAuthStore.setState({ user, session })
        router.navigate('/reset-password', { replace: true })
        return
      }

      if (event === 'SIGNED_IN') {
        useAuthStore.setState({ user, session })
        if (user) await loadUserData(user)
        return
      }

      if (event === 'SIGNED_OUT') {
        clearAuthState()
        return
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])
}

export function useAuth() {
  const { user, session, isLoading } = useAuthStore()

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string, name?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: name ? { data: { name } } : undefined,
    })
    if (error) throw error

    if (name && data.user) {
      await supabase
        .from('user_profiles')
        .update({ name })
        .eq('id', data.user.id)
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  return { user, session, isLoading, signIn, signUp, signOut, updatePassword }
}
