import type { Customer } from '@/domain/types'

export interface ICustomerRepository {
  findById(userId: string, customerId: string): Promise<Customer | null>
  list(userId: string, search?: string): Promise<Customer[]>
  create(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer>
  update(userId: string, customerId: string, data: Partial<Omit<Customer, 'id' | 'userId' | 'createdAt'>>): Promise<Customer>
}
