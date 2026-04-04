import type { SupabaseClient } from '@supabase/supabase-js'
import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository'
import type { Customer } from '@/domain/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Customer {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    phone: row.phone ?? null,
    email: row.email ?? null,
    notes: row.notes ?? null,
    createdAt: new Date(row.created_at),
  }
}

export class CustomerRepository implements ICustomerRepository {
  constructor(private readonly client: SupabaseClient<any, any, any>) {} // eslint-disable-line @typescript-eslint/no-explicit-any

  async findById(businessId: string, customerId: string): Promise<Customer | null> {
    const { data, error } = await this.client
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('business_id', businessId)
      .single()
    if (error || !data) return null
    return mapRow(data)
  }

  async list(businessId: string, search?: string): Promise<Customer[]> {
    let query = this.client
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
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
        business_id: customer.businessId,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        notes: customer.notes,
      })
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Erro ao criar cliente')
    return mapRow(data)
  }

  async update(
    businessId: string,
    customerId: string,
    updates: Partial<Omit<Customer, 'id' | 'businessId' | 'createdAt'>>,
  ): Promise<Customer> {
    const updateData: Record<string, unknown> = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.phone !== undefined) updateData.phone = updates.phone
    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.notes !== undefined) updateData.notes = updates.notes

    const { data, error } = await this.client
      .from('customers')
      .update(updateData)
      .eq('id', customerId)
      .eq('business_id', businessId)
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Erro ao atualizar cliente')
    return mapRow(data)
  }
}
