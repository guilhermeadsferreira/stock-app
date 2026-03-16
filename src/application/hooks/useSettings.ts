import { useCallback } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { useAuthStore } from '@/application/stores/authStore'
import { useSettingsStore } from '@/application/stores/settingsStore'

export function useSettings() {
  const { user } = useAuthStore()
  const { businessName, lowStockThreshold, expirationAlertDays, update } = useSettingsStore()

  const loadFromSupabase = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('user_profiles')
      .select('business_name, low_stock_threshold, expiration_alert_days')
      .eq('id', user.id)
      .single()
    if (data) {
      update({
        businessName: data.business_name,
        lowStockThreshold: data.low_stock_threshold,
        expirationAlertDays: data.expiration_alert_days,
      })
    }
  }, [user, update])

  const save = useCallback(async (settings: {
    businessName?: string
    lowStockThreshold?: number
    expirationAlertDays?: number
  }) => {
    if (!user) throw new Error('Não autenticado')

    const updateData: Record<string, unknown> = {}
    if (settings.businessName !== undefined) updateData.business_name = settings.businessName
    if (settings.lowStockThreshold !== undefined) updateData.low_stock_threshold = settings.lowStockThreshold
    if (settings.expirationAlertDays !== undefined) updateData.expiration_alert_days = settings.expirationAlertDays

    await supabase
      .from('user_profiles')
      .upsert({ id: user.id, ...updateData })

    update(settings)
  }, [user, update])

  return { businessName, lowStockThreshold, expirationAlertDays, loadFromSupabase, save }
}
