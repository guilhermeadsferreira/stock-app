import type { Product, StockEntry } from '@/domain/types'

export function isLowStock(quantity: number, threshold: number): boolean {
  return quantity > 0 && quantity <= threshold
}

export function isOutOfStock(quantity: number): boolean {
  return quantity === 0
}

export function isNearExpiry(expirationDate: Date | null, alertDays: number): boolean {
  if (!expirationDate) return false
  const now = new Date()
  const msInDay = 1000 * 60 * 60 * 24
  const daysUntilExpiry = Math.floor((expirationDate.getTime() - now.getTime()) / msInDay)
  return daysUntilExpiry >= 0 && daysUntilExpiry <= alertDays
}

export function isExpired(expirationDate: Date | null): boolean {
  if (!expirationDate) return false
  return expirationDate < new Date()
}

export function daysUntilExpiry(expirationDate: Date): number {
  const now = new Date()
  const msInDay = 1000 * 60 * 60 * 24
  return Math.floor((expirationDate.getTime() - now.getTime()) / msInDay)
}

/**
 * Calcula o valor total do estoque em centavos.
 * Usa o purchasePrice de cada produto × quantidade em estoque.
 */
export function calcStockValue(products: Product[], entries: StockEntry[]): number {
  const entryMap = new Map(entries.map(e => [e.productId, e.quantity]))
  return products.reduce((total, product) => {
    const qty = entryMap.get(product.id) ?? 0
    return total + product.purchasePrice * qty
  }, 0)
}
