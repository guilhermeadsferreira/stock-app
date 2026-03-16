import { useState, useCallback } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { StockRepository } from '@/infrastructure/supabase/StockRepository'
import { useAuthStore } from '@/application/stores/authStore'
import type { StockEntry, StockMovement } from '@/domain/types'

const stockRepo = new StockRepository(supabase)

export function useStock() {
  const { user } = useAuthStore()
  const [entries, setEntries] = useState<StockEntry[]>([])
  const [loading, setLoading] = useState(false)

  const loadEntries = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await stockRepo.listEntries(user.id)
      setEntries(data)
    } finally {
      setLoading(false)
    }
  }, [user])

  const getEntry = useCallback(async (productId: string): Promise<StockEntry | null> => {
    if (!user) return null
    return stockRepo.getEntry(user.id, productId)
  }, [user])

  const replenish = useCallback(async (
    productId: string,
    quantity: number,
    notes?: string,
  ): Promise<StockEntry> => {
    if (!user) throw new Error('Não autenticado')
    const entry = await stockRepo.incrementEntry(user.id, productId, quantity)
    await stockRepo.addMovement({
      userId: user.id,
      productId,
      type: 'in',
      reason: 'purchase',
      quantity,
      notes,
    })
    return entry
  }, [user])

  const listMovements = useCallback(async (productId: string): Promise<StockMovement[]> => {
    if (!user) return []
    return stockRepo.listMovements(user.id, productId)
  }, [user])

  return { entries, loading, loadEntries, getEntry, replenish, listMovements }
}
