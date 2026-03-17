import type { Product } from '@/domain/types'

export interface ProductFilters {
  search?: string
  lowStock?: boolean
  nearExpiry?: boolean
  threshold?: number
  expirationAlertDays?: number
}

export interface IProductRepository {
  findById(businessId: string, productId: string): Promise<Product | null>
  findByBarcode(businessId: string, barcode: string): Promise<Product | null>
  list(businessId: string, filters?: ProductFilters): Promise<Product[]>
  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>
  update(businessId: string, productId: string, data: Partial<Omit<Product, 'id' | 'businessId' | 'createdAt'>>): Promise<Product>
  delete(businessId: string, productId: string): Promise<void>
}
