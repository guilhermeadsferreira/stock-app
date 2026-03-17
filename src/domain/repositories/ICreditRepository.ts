import type { CreditPayment } from '@/domain/types'

export interface ICreditRepository {
  createPayment(payment: Omit<CreditPayment, 'id' | 'createdAt'>): Promise<CreditPayment>
  listPaymentsByCustomer(businessId: string, customerId: string): Promise<CreditPayment[]>
  listAllPayments(businessId: string): Promise<CreditPayment[]>
}
