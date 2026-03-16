import { describe, it, expect } from 'vitest'
import {
  isLowStock,
  isOutOfStock,
  isNearExpiry,
  isExpired,
  calcStockValue,
} from '../stock.rules'
import type { Product, StockEntry } from '@/domain/types'

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  userId: 'u1',
  name: 'Produto Teste',
  barcode: null,
  purchasePrice: 1000,
  salePrice: 1500,
  expirationDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const makeEntry = (productId: string, quantity: number): StockEntry => ({
  id: 'e1',
  userId: 'u1',
  productId,
  quantity,
  updatedAt: new Date(),
})

describe('isLowStock', () => {
  it('retorna true quando qty está abaixo ou igual ao threshold', () => {
    expect(isLowStock(3, 5)).toBe(true)
    expect(isLowStock(5, 5)).toBe(true)
  })
  it('retorna false quando qty está acima do threshold', () => {
    expect(isLowStock(6, 5)).toBe(false)
  })
  it('retorna false quando qty é zero (zerado, não baixo)', () => {
    expect(isLowStock(0, 5)).toBe(false)
  })
})

describe('isOutOfStock', () => {
  it('retorna true apenas quando quantidade é zero', () => {
    expect(isOutOfStock(0)).toBe(true)
    expect(isOutOfStock(1)).toBe(false)
  })
})

describe('isNearExpiry', () => {
  it('retorna false quando expirationDate é null', () => {
    expect(isNearExpiry(null, 7)).toBe(false)
  })
  it('retorna true quando vence dentro do intervalo', () => {
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    expect(isNearExpiry(soon, 7)).toBe(true)
  })
  it('retorna false quando vence depois do intervalo', () => {
    const far = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    expect(isNearExpiry(far, 7)).toBe(false)
  })
  it('retorna false para produtos já vencidos', () => {
    const past = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    expect(isNearExpiry(past, 7)).toBe(false)
  })
})

describe('isExpired', () => {
  it('retorna true para datas no passado', () => {
    const past = new Date(Date.now() - 1000)
    expect(isExpired(past)).toBe(true)
  })
  it('retorna false para datas no futuro', () => {
    const future = new Date(Date.now() + 86400000)
    expect(isExpired(future)).toBe(false)
  })
  it('retorna false quando data é null', () => {
    expect(isExpired(null)).toBe(false)
  })
})

describe('calcStockValue', () => {
  it('calcula valor total corretamente em centavos', () => {
    const products = [makeProduct({ id: 'p1', purchasePrice: 1000 })]
    const entries = [makeEntry('p1', 5)]
    expect(calcStockValue(products, entries)).toBe(5000)
  })
  it('retorna zero para produto sem entrada de estoque', () => {
    const products = [makeProduct({ id: 'p1', purchasePrice: 1000 })]
    expect(calcStockValue(products, [])).toBe(0)
  })
  it('soma múltiplos produtos', () => {
    const products = [
      makeProduct({ id: 'p1', purchasePrice: 1000 }),
      makeProduct({ id: 'p2', purchasePrice: 500 }),
    ]
    const entries = [makeEntry('p1', 10), makeEntry('p2', 4)]
    expect(calcStockValue(products, entries)).toBe(12000)
  })
})
