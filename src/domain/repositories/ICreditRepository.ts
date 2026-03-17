import type { CreditPayment } from '@/domain/types'

export interface ICreditRepository {
  createPayment(payment: Omit<CreditPayment, 'id' | 'createdAt'>): Promise<CreditPayment>
  listPaymentsByCustomer(userId: string, customerId: string): Promise<CreditPayment[]>
  listAllPayments(userId: string): Promise<CreditPayment[]>
}
