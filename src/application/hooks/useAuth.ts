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

async function loadDisplayName(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('user_profiles')
    .select('name')
    .eq('id', userId)
    .single()
  return data?.name ?? null
}

export function useAuthListener() {
  const { setAuth, setLoading, setBusinesses, setCurrentBusiness, setDisplayName } = useAuthStore()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null
      setAuth(user, session)

      if (event === 'PASSWORD_RECOVERY') {
        router.navigate('/reset-password', { replace: true })
        return
      }

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (!user) {
          useAuthStore.setState({ businesses: null, currentBusiness: null, displayName: null, isLoading: false })
        } else if (!useAuthStore.getState().businesses?.length) {
          useAuthStore.setState({ isLoading: true })
          const [businesses, displayName] = await Promise.all([
            loadBusinessesForUser(user.id),
            loadDisplayName(user.id),
          ])
          const current = pickCurrentBusiness(businesses)
          useAuthStore.setState({ businesses, currentBusiness: current, displayName, isLoading: false })
        } else {
          setLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
        setBusinesses(null)
        setCurrentBusiness(null)
        setDisplayName(null)
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
