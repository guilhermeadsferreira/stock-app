import { describe, it, expect } from 'vitest'
import { calcSaleTotal, validateSale } from '../sale.rules'
import type { Product } from '@/domain/types'

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  userId: 'u1',
  name: 'Produto',
  barcode: null,
  purchasePrice: 800,
  salePrice: 1200,
  expirationDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('calcSaleTotal', () => {
  it('multiplica quantidade pelo preço unitário', () => {
    expect(calcSaleTotal(3, 1000)).toBe(3000)
    expect(calcSaleTotal(1, 999)).toBe(999)
  })
})

describe('validateSale', () => {
  const product = makeProduct()

  it('válido para venda à vista com estoque suficiente', () => {
    const result = validateSale(product, 2, 10, 'cash', null)
    expect(result.valid).toBe(true)
  })

  it('inválido quando estoque insuficiente', () => {
    const result = validateSale(product, 5, 3, 'cash', null)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('INSUFFICIENT_STOCK')
  })

  it('inválido quando quantidade é zero ou negativa', () => {
    expect(validateSale(product, 0, 10, 'cash', null).error).toBe('INVALID_QUANTITY')
    expect(validateSale(product, -1, 10, 'cash', null).error).toBe('INVALID_QUANTITY')
  })

  it('inválido quando fiado sem cliente', () => {
    const result = validateSale(product, 1, 10, 'credit', null)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('CREDIT_REQUIRES_CUSTOMER')
  })

  it('válido quando fiado com cliente', () => {
    const result = validateSale(product, 1, 10, 'credit', 'customer-id')
    expect(result.valid).toBe(true)
  })
})
