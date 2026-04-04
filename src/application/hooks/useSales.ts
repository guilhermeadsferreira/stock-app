import { useState, useCallback } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { SaleRepository } from '@/infrastructure/supabase/SaleRepository'
import { StockRepository } from '@/infrastructure/supabase/StockRepository'
import { useAuthStore } from '@/application/stores/authStore'
import { calcSaleTotal, validateSale } from '@/domain/rules/sale.rules'
import type { Sale, PaymentType, CartItem, SaleStatus } from '@/domain/types'
import type { SaleFilters } from '@/domain/repositories/ISaleRepository'

const saleRepo = new SaleRepository(supabase)
const stockRepo = new StockRepository(supabase)

function deriveSaleStatus(paymentType: PaymentType): SaleStatus {
  return paymentType === 'credit' ? 'pending' : 'paid'
}

export function useSales() {
  const { currentBusiness, user } = useAuthStore()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (filters?: SaleFilters) => {
    if (!currentBusiness) return
    setLoading(true)
    try {
      const data = await saleRepo.listByBusinessWithItems(currentBusiness.id, filters)
      setSales(data)
    } finally {
      setLoading(false)
    }
  }, [currentBusiness])

  /**
   * Cria uma venda com múltiplos itens (carrinho).
   * Fluxo: valida tudo → cria 1 sale + N sale_items → N movements → N decrements.
   *
   * Este é o ÚNICO caminho de escrita que decrementa estoque.
   */
  const createSale = useCallback(async (
    items: CartItem[],
    paymentType: PaymentType,
    customerId: string | null,
  ): Promise<Sale> => {
    if (!currentBusiness) throw new Error('Sem empresa ativa')
    if (items.length === 0) throw new Error('Carrinho vazio')

    // ─── Fase 1: pré-validação sem escrever nada ──────────────────────────
    // Agrupa qty por produto para checar estoque real (itens duplicados somam)
    const qtyByProduct = new Map<string, number>()
    for (const item of items) {
      qtyByProduct.set(item.product.id, (qtyByProduct.get(item.product.id) ?? 0) + item.quantity)
    }

    for (const [productId, totalQty] of qtyByProduct) {
      const product = items.find(i => i.product.id === productId)!.product
      const entry = await stockRepo.getEntry(currentBusiness.id, productId)
      const currentQty = entry?.quantity ?? 0
      const validation = validateSale(product, totalQty, currentQty, paymentType, customerId)
      if (!validation.valid) throw new Error(validation.error)
    }

    // ─── Fase 2: escrita ──────────────────────────────────────────────────
    const totalPrice = items.reduce((sum, i) => sum + calcSaleTotal(i.quantity, i.unitPrice), 0)

    // 1. Cria sale (header) + sale_items
    const sale = await saleRepo.createWithItems({
      businessId: currentBusiness.id,
      totalPrice,
      paymentType,
      customerId,
      sellerId: user?.id ?? null,
      status: deriveSaleStatus(paymentType),
      items: items.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        unitCost: i.product.purchasePrice,
        discountPct: 0,
      })),
    })

    // 2. Movimentações de saída + decremento de estoque (por produto)
    for (const item of items) {
      await stockRepo.addMovement({
        businessId: currentBusiness.id,
        productId: item.product.id,
        type: 'out',
        reason: 'sale',
        quantity: item.quantity,
        saleId: sale.id,
      })
      await stockRepo.decrementEntry(currentBusiness.id, item.product.id, item.quantity)
    }

    return sale
  }, [currentBusiness, user])

  return { sales, loading, load, createSale }
}
