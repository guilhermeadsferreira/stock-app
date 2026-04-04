import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../cartStore'
import type { Product } from '@/domain/types'

const mockProduct = (overrides?: Partial<Product>): Product => ({
  id: 'prod-1',
  businessId: 'biz-1',
  name: 'Produto Teste',
  brand: null,
  barcode: null,
  purchasePrice: 500,
  salePrice: 1000,
  notes: null,
  maxDiscountPct: null,
  expirationDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clear()
  })

  it('starts with empty cart', () => {
    expect(useCartStore.getState().items).toEqual([])
  })

  it('adds a new product with qty 1 and salePrice', () => {
    const product = mockProduct()
    useCartStore.getState().addItem(product)
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].product.id).toBe('prod-1')
    expect(items[0].quantity).toBe(1)
    expect(items[0].unitPrice).toBe(1000)
  })

  it('increments qty when adding existing product', () => {
    const product = mockProduct()
    useCartStore.getState().addItem(product)
    useCartStore.getState().addItem(product)
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('updates quantity for a product', () => {
    useCartStore.getState().addItem(mockProduct())
    useCartStore.getState().updateQuantity('prod-1', 5)
    expect(useCartStore.getState().items[0].quantity).toBe(5)
  })

  it('removes item when quantity set to 0', () => {
    useCartStore.getState().addItem(mockProduct())
    useCartStore.getState().updateQuantity('prod-1', 0)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('updates unit price for a product', () => {
    useCartStore.getState().addItem(mockProduct())
    useCartStore.getState().updatePrice('prod-1', 1500)
    expect(useCartStore.getState().items[0].unitPrice).toBe(1500)
  })

  it('removes a product by id', () => {
    useCartStore.getState().addItem(mockProduct({ id: 'prod-1' }))
    useCartStore.getState().addItem(mockProduct({ id: 'prod-2', name: 'Outro', salePrice: 2000 }))
    useCartStore.getState().removeItem('prod-1')
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].product.id).toBe('prod-2')
  })

  it('calculates total in cents', () => {
    useCartStore.getState().addItem(mockProduct({ id: 'prod-1', salePrice: 1000 }))
    useCartStore.getState().addItem(mockProduct({ id: 'prod-2', name: 'Outro', salePrice: 2000 }))
    useCartStore.getState().updateQuantity('prod-1', 3)
    expect(useCartStore.getState().total()).toBe(5000)
  })

  it('clears all items', () => {
    useCartStore.getState().addItem(mockProduct({ id: 'prod-1' }))
    useCartStore.getState().addItem(mockProduct({ id: 'prod-2', name: 'Outro', salePrice: 2000 }))
    useCartStore.getState().clear()
    expect(useCartStore.getState().items).toEqual([])
  })
})
