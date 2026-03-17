import { useState, useCallback } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { StockRepository } from '@/infrastructure/supabase/StockRepository'
import { useAuthStore } from '@/application/stores/authStore'
import type { StockEntry, StockMovement } from '@/domain/types'

const stockRepo = new StockRepository(supabase)

export function useStock() {
  const { currentBusiness } = useAuthStore()
  const [entries, setEntries] = useState<StockEntry[]>([])
  const [loading, setLoading] = useState(false)

  const loadEntries = useCallback(async () => {
    if (!currentBusiness) return
    setLoading(true)
    try {
      const data = await stockRepo.listEntries(currentBusiness.id)
      setEntries(data)
    } finally {
      setLoading(false)
    }
  }, [currentBusiness])

  const getEntry = useCallback(async (productId: string): Promise<StockEntry | null> => {
    if (!currentBusiness) return null
    return stockRepo.getEntry(currentBusiness.id, productId)
  }, [currentBusiness])

  const replenish = useCallback(async (
    productId: string,
    quantity: number,
    notes?: string,
  ): Promise<StockEntry> => {
    if (!currentBusiness) throw new Error('Sem empresa ativa')
    const entry = await stockRepo.incrementEntry(currentBusiness.id, productId, quantity)
    await stockRepo.addMovement({
      businessId: currentBusiness.id,
      productId,
      type: 'in',
      reason: 'purchase',
      quantity,
      notes,
    })
    return entry
  }, [currentBusiness])

  const adjustQuantity = useCallback(async (
    productId: string,
    newQuantity: number,
    notes?: string,
  ): Promise<StockEntry> => {
    if (!currentBusiness) throw new Error('Sem empresa ativa')
    const current = await stockRepo.getEntry(currentBusiness.id, productId)
    const currentQty = current?.quantity ?? 0
    const diff = newQuantity - currentQty
    const entry = await stockRepo.upsertEntry(currentBusiness.id, productId, newQuantity)
    if (diff !== 0) {
      await stockRepo.addMovement({
        businessId: currentBusiness.id,
        productId,
        type: diff > 0 ? 'in' : 'out',
        reason: 'adjustment',
        quantity: Math.abs(diff),
        notes,
      })
    }
    return entry
  }, [currentBusiness])

  const removeEntry = useCallback(async (productId: string): Promise<void> => {
    if (!currentBusiness) throw new Error('Sem empresa ativa')
    await stockRepo.deleteEntry(currentBusiness.id, productId)
  }, [currentBusiness])

  const listMovements = useCallback(async (productId: string): Promise<StockMovement[]> => {
    if (!currentBusiness) return []
    return stockRepo.listMovements(currentBusiness.id, productId)
  }, [currentBusiness])

  return { entries, loading, loadEntries, getEntry, replenish, adjustQuantity, removeEntry, listMovements }
}
