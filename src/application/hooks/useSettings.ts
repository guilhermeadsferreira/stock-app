import { useCallback } from 'react'
import { BusinessRepository } from '@/infrastructure/supabase/BusinessRepository'
import { supabase } from '@/infrastructure/supabase/client'
import { useAuthStore } from '@/application/stores/authStore'

const businessRepo = new BusinessRepository(supabase)

export function useSettings() {
  const { currentBusiness, setCurrentBusiness } = useAuthStore()

  const save = useCallback(async (settings: {
    businessName?: string
    lowStockThreshold?: number
    expirationAlertDays?: number
  }) => {
    if (!currentBusiness) throw new Error('Sem empresa ativa')

    const updated = await businessRepo.update(currentBusiness.id, {
      name: settings.businessName,
      lowStockThreshold: settings.lowStockThreshold,
      expirationAlertDays: settings.expirationAlertDays,
    })
    setCurrentBusiness(updated)
  }, [currentBusiness, setCurrentBusiness])

  return {
    businessName: currentBusiness?.name ?? '',
    lowStockThreshold: currentBusiness?.lowStockThreshold ?? 5,
    expirationAlertDays: currentBusiness?.expirationAlertDays ?? 7,
    save,
  }
}
