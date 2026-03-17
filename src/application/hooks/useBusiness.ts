import { useCallback } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { BusinessRepository } from '@/infrastructure/supabase/BusinessRepository'
import { useAuthStore } from '@/application/stores/authStore'
import type { BusinessMember } from '@/domain/types'

const businessRepo = new BusinessRepository(supabase)

export function useBusiness() {
  const { user, currentBusiness, setCurrentBusiness } = useAuthStore()

  const createBusiness = useCallback(async (name: string) => {
    if (!user) throw new Error('Não autenticado')
    const business = await businessRepo.create(name, user.id, user.email ?? '')
    setCurrentBusiness(business)
  }, [user, setCurrentBusiness])

  const joinByCode = useCallback(async (code: string) => {
    if (!user) throw new Error('Não autenticado')
    const business = await businessRepo.findByInviteCode(code.toUpperCase())
    if (!business) throw new Error('Código inválido')
    await businessRepo.addMember(business.id, user.id, user.email ?? '')
    setCurrentBusiness(business)
  }, [user, setCurrentBusiness])

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
    setCurrentBusiness({ ...currentBusiness, inviteCode: newCode })
    return newCode
  }, [currentBusiness, setCurrentBusiness])

  const listMembers = useCallback(async (): Promise<BusinessMember[]> => {
    if (!currentBusiness) return []
    return businessRepo.listMembers(currentBusiness.id)
  }, [currentBusiness])

  return { createBusiness, joinByCode, removeMember, getInviteCode, regenerateInviteCode, listMembers }
}
