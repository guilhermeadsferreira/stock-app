import { useState, useCallback } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { SaleRepository } from '@/infrastructure/supabase/SaleRepository'
import { StockRepository } from '@/infrastructure/supabase/StockRepository'
import { useAuthStore } from '@/application/stores/authStore'
import { calcSaleTotal, validateSale } from '@/domain/rules/sale.rules'
import type { Sale, Product, PaymentType } from '@/domain/types'
import type { SaleFilters } from '@/domain/repositories/ISaleRepository'

const saleRepo = new SaleRepository(supabase)
const stockRepo = new StockRepository(supabase)

export interface CreateSaleInput {
  product: Product
  quantity: number
  unitPrice: number   // centavos
  paymentType: PaymentType
  customerId: string | null
}

export function useSales() {
  const { user } = useAuthStore()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (filters?: SaleFilters) => {
    if (!user) return
    setLoading(true)
    try {
      const data = await saleRepo.listByUser(user.id, filters)
      setSales(data)
    } finally {
      setLoading(false)
    }
  }, [user])

  /**
   * Ponto central de criação de vendas.
   * Executa sequencialmente: insert sale → insert movement → decrement stock.
   */
  const createSale = useCallback(async (input: CreateSaleInput): Promise<Sale> => {
    if (!user) throw new Error('Não autenticado')

    const currentEntry = await stockRepo.getEntry(user.id, input.product.id)
    const currentQty = currentEntry?.quantity ?? 0

    const validation = validateSale(
      input.product,
      input.quantity,
      currentQty,
      input.paymentType,
      input.customerId,
    )
    if (!validation.valid) throw new Error(validation.error)

    const totalPrice = calcSaleTotal(input.quantity, input.unitPrice)

    // 1. Registra a venda
    const sale = await saleRepo.create({
      userId: user.id,
      productId: input.product.id,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      totalPrice,
      purchasePriceSnapshot: input.product.purchasePrice,
      paymentType: input.paymentType,
      customerId: input.customerId,
    })

    // 2. Registra a movimentação de saída
    await stockRepo.addMovement({
      userId: user.id,
      productId: input.product.id,
      type: 'out',
      reason: 'sale',
      quantity: input.quantity,
      saleId: sale.id,
    })

    // 3. Decrementa o estoque
    await stockRepo.decrementEntry(user.id, input.product.id, input.quantity)

    return sale
  }, [user])

  return { sales, loading, load, createSale }
}
