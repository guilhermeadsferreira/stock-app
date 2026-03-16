import { useEffect } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { useAuthStore } from '@/application/stores/authStore'

export function useAuthListener() {
  const { setAuth, setLoading } = useAuthStore()

  useEffect(() => {
    // Lê a sessão atual
    supabase.auth.getSession().then(({ data }) => {
      setAuth(data.session?.user ?? null, data.session ?? null)
    })

    // Escuta mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session?.user ?? null, session ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setAuth, setLoading])
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
