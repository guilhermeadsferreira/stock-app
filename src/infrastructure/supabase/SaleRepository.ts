import type { SupabaseClient } from '@supabase/supabase-js'
import type { ISaleRepository, SaleFilters } from '@/domain/repositories/ISaleRepository'
import type { Sale } from '@/domain/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Sale {
  return {
    id: row.id,
    businessId: row.business_id,
    productId: row.product_id,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    totalPrice: row.total_price,
    purchasePriceSnapshot: row.purchase_price_snapshot,
    paymentType: row.payment_type,
    customerId: row.customer_id ?? null,
    sellerId: row.seller_id ?? null,
    status: row.status ?? 'paid',
    createdAt: new Date(row.created_at),
  }
}

export class SaleRepository implements ISaleRepository {
  constructor(private readonly client: SupabaseClient<any, any, any>) {} // eslint-disable-line @typescript-eslint/no-explicit-any

  async create(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> {
    const { data, error } = await this.client
      .from('sales')
      .insert({
        business_id: sale.businessId,
        product_id: sale.productId,
        quantity: sale.quantity,
        unit_price: sale.unitPrice,
        total_price: sale.totalPrice,
        purchase_price_snapshot: sale.purchasePriceSnapshot,
        payment_type: sale.paymentType,
        customer_id: sale.customerId,
        seller_id: sale.sellerId,
        status: sale.status,
      })
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Erro ao registrar venda')
    return mapRow(data)
  }

  async hasProductSales(businessId: string, productId: string): Promise<boolean> {
    const { count, error } = await this.client
      .from('sales')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('product_id', productId)
    if (error) return false
    return (count ?? 0) > 0
  }

  async listByBusiness(businessId: string, filters?: SaleFilters): Promise<Sale[]> {
    let query = this.client
      .from('sales')
      .select('*')
      .eq('business_id', businessId)
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
