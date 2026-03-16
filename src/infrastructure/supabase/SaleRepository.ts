import type { SupabaseClient } from '@supabase/supabase-js'
import type { ISaleRepository, SaleFilters } from '@/domain/repositories/ISaleRepository'
import type { Sale } from '@/domain/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Sale {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    totalPrice: row.total_price,
    purchasePriceSnapshot: row.purchase_price_snapshot,
    paymentType: row.payment_type,
    customerId: row.customer_id ?? null,
    createdAt: new Date(row.created_at),
  }
}

export class SaleRepository implements ISaleRepository {
  constructor(private readonly client: SupabaseClient<any, any, any>) {}

  async create(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> {
    const { data, error } = await this.client
      .from('sales')
      .insert({
        user_id: sale.userId,
        product_id: sale.productId,
        quantity: sale.quantity,
        unit_price: sale.unitPrice,
        total_price: sale.totalPrice,
        purchase_price_snapshot: sale.purchasePriceSnapshot,
        payment_type: sale.paymentType,
        customer_id: sale.customerId,
      })
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Erro ao registrar venda')
    return mapRow(data)
  }

  async hasProductSales(userId: string, productId: string): Promise<boolean> {
    const { count, error } = await this.client
      .from('sales')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('product_id', productId)
    if (error) return false
    return (count ?? 0) > 0
  }

  async listByUser(userId: string, filters?: SaleFilters): Promise<Sale[]> {
    let query = this.client
      .from('sales')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (filters?.paymentType) {
      query = query.eq('payment_type', filters.paymentType)
    }
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId)
    }
    if (filters?.from) {
      query = query.gte('created_at', filters.from.toISOString())
    }
    if (filters?.to) {
      query = query.lte('created_at', filters.to.toISOString())
    }

    const { data, error } = await query
    if (error || !data) return []
    return data.map(mapRow)
  }
}
