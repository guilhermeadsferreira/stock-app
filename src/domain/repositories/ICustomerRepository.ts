import type { Customer } from '@/domain/types'

export interface ICustomerRepository {
  findById(businessId: string, customerId: string): Promise<Customer | null>
  list(businessId: string, search?: string): Promise<Customer[]>
  create(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer>
  update(businessId: string, customerId: string, data: Partial<Omit<Customer, 'id' | 'businessId' | 'createdAt'>>): Promise<Customer>
}
