import type { Sale, PaymentType } from '@/domain/types'

export interface SaleFilters {
  paymentType?: PaymentType
  customerId?: string
  from?: Date
  to?: Date
}

export interface ISaleRepository {
  create(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale>
  listByBusiness(businessId: string, filters?: SaleFilters): Promise<Sale[]>
  hasProductSales(businessId: string, productId: string): Promise<boolean>
}
