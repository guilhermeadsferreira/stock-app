import type { Product } from '@/domain/types'

export interface ProductFilters {
  search?: string
  lowStock?: boolean
  nearExpiry?: boolean
  threshold?: number
  expirationAlertDays?: number
}

export interface IProductRepository {
  findById(userId: string, productId: string): Promise<Product | null>
  findByBarcode(userId: string, barcode: string): Promise<Product | null>
  list(userId: string, filters?: ProductFilters): Promise<Product[]>
  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>
  update(userId: string, productId: string, data: Partial<Omit<Product, 'id' | 'userId' | 'createdAt'>>): Promise<Product>
  delete(userId: string, productId: string): Promise<void>
}
