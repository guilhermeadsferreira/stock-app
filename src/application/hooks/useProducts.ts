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
  const { currentBusiness } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (filters?: ProductFilters) => {
    if (!currentBusiness) return
    setLoading(true)
    setError(null)
    try {
      const data = await productRepo.list(currentBusiness.id, filters)
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }, [currentBusiness])

  const create = useCallback(async (
    product: Omit<Product, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>,
    initialQuantity: number,
  ) => {
    if (!currentBusiness) throw new Error('Sem empresa ativa')
    const created = await productRepo.create({ ...product, businessId: currentBusiness.id })
    await stockRepo.upsertEntry(currentBusiness.id, created.id, initialQuantity)
    if (initialQuantity > 0) {
      await stockRepo.addMovement({
        businessId: currentBusiness.id,
        productId: created.id,
        type: 'in',
        reason: 'purchase',
        quantity: initialQuantity,
      })
    }
    return created
  }, [currentBusiness])

  const update = useCallback(async (
    productId: string,
    data: Partial<Omit<Product, 'id' | 'businessId' | 'createdAt'>>,
  ) => {
    if (!currentBusiness) throw new Error('Sem empresa ativa')
    return productRepo.update(currentBusiness.id, productId, data)
  }, [currentBusiness])

  const remove = useCallback(async (productId: string) => {
    if (!currentBusiness) throw new Error('Sem empresa ativa')
    const hasSales = await saleRepo.hasProductSales(currentBusiness.id, productId)
    if (hasSales) throw new Error('Este produto possui vendas registradas e não pode ser excluído.')
    await productRepo.delete(currentBusiness.id, productId)
  }, [currentBusiness])

  const findByBarcode = useCallback(async (barcode: string) => {
    if (!currentBusiness) return null
    return productRepo.findByBarcode(currentBusiness.id, barcode)
  }, [currentBusiness])

  return { products, loading, error, load, create, update, remove, findByBarcode }
}
