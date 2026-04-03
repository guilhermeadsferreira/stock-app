import { useEffect } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { router } from '@/router'
import { BusinessRepository } from '@/infrastructure/supabase/BusinessRepository'
import { useAuthStore } from '@/application/stores/authStore'
import type { Business } from '@/domain/types'

const businessRepo = new BusinessRepository(supabase)

async function loadBusinessForUser(userId: string): Promise<Business | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000))
  const fetch = (async () => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('business_id')
      .eq('id', userId)
      .maybeSingle()
    if (!profile?.business_id) return null
    return businessRepo.findById(profile.business_id)
  })()
  return Promise.race([fetch, timeout])
}

export function useAuthListener() {
  const { setAuth, setLoading, setCurrentBusiness } = useAuthStore()

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
            setCurrentBusiness(null)
          } else if (!useAuthStore.getState().currentBusiness) {
            // Só busca se ainda não temos business carregado.
            // Evita re-fetch (e possível null) em refreshes de token que disparam SIGNED_IN.
            const business = await loadBusinessForUser(user.id)
            setCurrentBusiness(business)
          }
        } finally {
          setLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentBusiness(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [setAuth, setLoading, setCurrentBusiness])
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
