import { useEffect } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { BusinessRepository } from '@/infrastructure/supabase/BusinessRepository'
import { useAuthStore } from '@/application/stores/authStore'
import type { Business } from '@/domain/types'

const businessRepo = new BusinessRepository(supabase)

async function loadBusinessForUser(userId: string): Promise<Business | null> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('business_id')
    .eq('id', userId)
    .single()
  if (!profile?.business_id) return null
  return businessRepo.findById(profile.business_id)
}

export function useAuthListener() {
  const { setAuth, setLoading, setCurrentBusiness } = useAuthStore()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null
      setAuth(user, session)

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (user) {
          const business = await loadBusinessForUser(user.id)
          setCurrentBusiness(business)
        } else {
          setCurrentBusiness(null)
        }
        setLoading(false)
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
