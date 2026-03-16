import type { SupabaseClient } from '@supabase/supabase-js'
import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository'
import type { Customer } from '@/domain/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Customer {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone ?? null,
    createdAt: new Date(row.created_at),
  }
}

export class CustomerRepository implements ICustomerRepository {
  constructor(private readonly client: SupabaseClient<any, any, any>) {}

  async findById(userId: string, customerId: string): Promise<Customer | null> {
    const { data, error } = await this.client
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('user_id', userId)
      .single()
    if (error || !data) return null
    return mapRow(data)
  }

  async list(userId: string, search?: string): Promise<Customer[]> {
    let query = this.client
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query
    if (error || !data) return []
    return data.map(mapRow)
  }

  async create(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const { data, error } = await this.client
      .from('customers')
      .insert({
        user_id: customer.userId,
        name: customer.name,
        phone: customer.phone,
      })
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Erro ao criar cliente')
    return mapRow(data)
  }

  async update(
    userId: string,
    customerId: string,
    updates: Partial<Omit<Customer, 'id' | 'userId' | 'createdAt'>>,
  ): Promise<Customer> {
    const updateData: Record<string, unknown> = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.phone !== undefined) updateData.phone = updates.phone

    const { data, error } = await this.client
      .from('customers')
      .update(updateData)
      .eq('id', customerId)
      .eq('user_id', userId)
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Erro ao atualizar cliente')
    return mapRow(data)
  }
}
