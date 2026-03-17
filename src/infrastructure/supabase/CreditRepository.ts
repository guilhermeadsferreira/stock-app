import type { SupabaseClient } from '@supabase/supabase-js'
import type { ICreditRepository } from '@/domain/repositories/ICreditRepository'
import type { CreditPayment } from '@/domain/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): CreditPayment {
  return {
    id: row.id,
    userId: row.user_id,
    customerId: row.customer_id,
    amount: row.amount,
    notes: row.notes ?? null,
    createdAt: new Date(row.created_at),
  }
}

export class CreditRepository implements ICreditRepository {
  constructor(private readonly client: SupabaseClient<any, any, any>) {}

  async createPayment(payment: Omit<CreditPayment, 'id' | 'createdAt'>): Promise<CreditPayment> {
    const { data, error } = await this.client
      .from('credit_payments')
      .insert({
        user_id: payment.userId,
        customer_id: payment.customerId,
        amount: payment.amount,
        notes: payment.notes,
      })
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Erro ao registrar pagamento')
    return mapRow(data)
  }

  async listPaymentsByCustomer(userId: string, customerId: string): Promise<CreditPayment[]> {
    const { data, error } = await this.client
      .from('credit_payments')
      .select('*')
      .eq('user_id', userId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return data.map(mapRow)
  }

  async listAllPayments(userId: string): Promise<CreditPayment[]> {
    const { data, error } = await this.client
      .from('credit_payments')
      .select('*')
      .eq('user_id', userId)
    if (error || !data) return []
    return data.map(mapRow)
  }
}
