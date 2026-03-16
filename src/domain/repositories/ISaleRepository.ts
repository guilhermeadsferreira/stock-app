import type { Sale, PaymentType } from '@/domain/types'

export interface SaleFilters {
  paymentType?: PaymentType
  customerId?: string
  from?: Date
  to?: Date
}

export interface ISaleRepository {
  create(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale>
  listByUser(userId: string, filters?: SaleFilters): Promise<Sale[]>
}
