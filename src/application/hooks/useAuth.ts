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
