import type { Product } from '@/domain/types'

export function calcSaleTotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice
}

export type SaleValidationError =
  | 'INSUFFICIENT_STOCK'
  | 'INVALID_QUANTITY'
  | 'INVALID_PRICE'
  | 'CREDIT_REQUIRES_CUSTOMER'

export interface SaleValidationResult {
  valid: boolean
  error?: SaleValidationError
}

export function validateSale(
  product: Product,
  quantity: number,
  currentStock: number,
  paymentType: 'cash' | 'credit',
  customerId: string | null,
): SaleValidationResult {
  if (quantity <= 0 || !Number.isInteger(quantity)) {
    return { valid: false, error: 'INVALID_QUANTITY' }
  }
  if (currentStock < quantity) {
    return { valid: false, error: 'INSUFFICIENT_STOCK' }
  }
  if (product.salePrice <= 0) {
    return { valid: false, error: 'INVALID_PRICE' }
  }
  if (paymentType === 'credit' && !customerId) {
    return { valid: false, error: 'CREDIT_REQUIRES_CUSTOMER' }
  }
  return { valid: true }
}
