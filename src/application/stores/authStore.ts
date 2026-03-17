import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import type { Business } from '@/domain/types'

interface AuthState {
  user: User | null
  session: Session | null
  currentBusiness: Business | null
  isLoading: boolean
  setAuth: (user: User | null, session: Session | null) => void
  setCurrentBusiness: (business: Business | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  currentBusiness: null,
  isLoading: true,
  setAuth: (user, session) => set({ user, session }),
  setCurrentBusiness: (currentBusiness) => set({ currentBusiness }),
  setLoading: (isLoading) => set({ isLoading }),
}))
