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
    const updated = [...(businesses ?? []), business]
    setBusinesses(updated)
    switchBusiness(business)
  }, [user, businesses, setBusinesses, switchBusiness])

  const joinByCode = useCallback(async (code: string) => {
    if (!user) throw new Error('Não autenticado')
    const business = await businessRepo.findByInviteCode(code.toUpperCase())
    if (!business) throw new Error('Código inválido')
    const alreadyMember = (businesses ?? []).some((b) => b.id === business.id)
    if (alreadyMember) throw new Error('Já é membro desta empresa')
    await businessRepo.addMember(business.id, user.id, user.email ?? '')
    const updated = [...(businesses ?? []), business]
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
    const updated = { ...currentBusiness, inviteCode: newCode }
    setBusinesses((businesses ?? []).map((b) => b.id === currentBusiness.id ? updated : b))
    setCurrentBusiness(updated)
    return newCode
  }, [currentBusiness, businesses, setBusinesses, setCurrentBusiness])

  const listMembers = useCallback(async (): Promise<BusinessMember[]> => {
    if (!currentBusiness) return []
    return businessRepo.listMembers(currentBusiness.id)
  }, [currentBusiness])

  return { switchBusiness, createBusiness, joinByCode, removeMember, getInviteCode, regenerateInviteCode, listMembers }
}
