import { useState, useCallback } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { SaleRepository } from '@/infrastructure/supabase/SaleRepository'
import { StockRepository } from '@/infrastructure/supabase/StockRepository'
import { useAuthStore } from '@/application/stores/authStore'
import { calcSaleTotal, validateSale } from '@/domain/rules/sale.rules'
import type { Sale, Product, PaymentType, CartItem } from '@/domain/types'
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

  /**
   * Cria múltiplas vendas de uma vez (carrinho).
   * Fase 1: valida todos os itens sem escrever nada.
   * Fase 2: grava sequencialmente só se tudo passou.
   * Produtos duplicados no carrinho têm estoques somados na validação.
   */
  const createSalesBatch = useCallback(async (
    items: CartItem[],
    paymentType: PaymentType,
    customerId: string | null,
  ): Promise<void> => {
    if (!user) throw new Error('Não autenticado')

    // Fase 1 — pré-validação: agrupa qtd por produto para checar estoque real
    const qtyByProduct = new Map<string, number>()
    for (const item of items) {
      qtyByProduct.set(item.product.id, (qtyByProduct.get(item.product.id) ?? 0) + item.quantity)
    }

    for (const [productId, totalQty] of qtyByProduct) {
      const product = items.find(i => i.product.id === productId)!.product
      const entry = await stockRepo.getEntry(user.id, productId)
      const currentQty = entry?.quantity ?? 0
      const validation = validateSale(product, totalQty, currentQty, paymentType, customerId)
      if (!validation.valid) throw new Error(validation.error)
    }

    // Fase 2 — escrita sequencial
    for (const item of items) {
      const totalPrice = calcSaleTotal(item.quantity, item.unitPrice)
      const sale = await saleRepo.create({
        userId: user.id,
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        purchasePriceSnapshot: item.product.purchasePrice,
        paymentType,
        customerId,
      })
      await stockRepo.addMovement({
        userId: user.id,
        productId: item.product.id,
        type: 'out',
        reason: 'sale',
        quantity: item.quantity,
        saleId: sale.id,
      })
      await stockRepo.decrementEntry(user.id, item.product.id, item.quantity)
    }
  }, [user])

  return { sales, loading, load, createSale, createSalesBatch }
}
