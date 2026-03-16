import { useState, useCallback } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { ProductRepository } from '@/infrastructure/supabase/ProductRepository'
import { StockRepository } from '@/infrastructure/supabase/StockRepository'
import { SaleRepository } from '@/infrastructure/supabase/SaleRepository'
import { useAuthStore } from '@/application/stores/authStore'
import type { Product } from '@/domain/types'
import type { ProductFilters } from '@/domain/repositories/IProductRepository'

const productRepo = new ProductRepository(supabase)
const stockRepo = new StockRepository(supabase)
const saleRepo = new SaleRepository(supabase)

export function useProducts() {
  const { user } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (filters?: ProductFilters) => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const data = await productRepo.list(user.id, filters)
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }, [user])

  const create = useCallback(async (
    product: Omit<Product, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    initialQuantity: number,
  ) => {
    if (!user) throw new Error('Não autenticado')
    const created = await productRepo.create({ ...product, userId: user.id })
    await stockRepo.upsertEntry(user.id, created.id, initialQuantity)
    if (initialQuantity > 0) {
      await stockRepo.addMovement({
        userId: user.id,
        productId: created.id,
        type: 'in',
        reason: 'purchase',
        quantity: initialQuantity,
      })
    }
    return created
  }, [user])

  const update = useCallback(async (
    productId: string,
    data: Partial<Omit<Product, 'id' | 'userId' | 'createdAt'>>,
  ) => {
    if (!user) throw new Error('Não autenticado')
    return productRepo.update(user.id, productId, data)
  }, [user])

  const remove = useCallback(async (productId: string) => {
    if (!user) throw new Error('Não autenticado')
    const hasSales = await saleRepo.hasProductSales(user.id, productId)
    if (hasSales) throw new Error('Este produto possui vendas registradas e não pode ser excluído.')
    await productRepo.delete(user.id, productId)
  }, [user])

  const findByBarcode = useCallback(async (barcode: string) => {
    if (!user) return null
    return productRepo.findByBarcode(user.id, barcode)
  }, [user])

  return { products, loading, error, load, create, update, remove, findByBarcode }
}
