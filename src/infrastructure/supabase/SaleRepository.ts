import type { SupabaseClient } from '@supabase/supabase-js'
import type { ISaleRepository, SaleFilters } from '@/domain/repositories/ISaleRepository'
import type { Sale, SaleItem } from '@/domain/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Sale {
  return {
    id: row.id,
    businessId: row.business_id,
    totalPrice: row.total_price,
    paymentType: row.payment_type,
    customerId: row.customer_id ?? null,
    sellerId: row.seller_id ?? null,
    status: row.status ?? 'paid',
    createdAt: new Date(row.created_at),
    // Campos legados
    productId: row.product_id ?? null,
    quantity: row.quantity ?? null,
    unitPrice: row.unit_price ?? null,
    purchasePriceSnapshot: row.purchase_price_snapshot ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSaleItem(row: any): SaleItem {
  return {
    id: row.id,
    saleId: row.sale_id,
    productId: row.product_id,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    unitCost: row.unit_cost,
    discountPct: row.discount_pct ?? 0,
  }
}

export interface CreateSaleWithItemsInput {
  businessId: string
  totalPrice: number
  paymentType: Sale['paymentType']
  customerId: string | null
  sellerId: string | null
  status: Sale['status']
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
    unitCost: number
    discountPct: number
  }>
}

export class SaleRepository implements ISaleRepository {
  constructor(private readonly client: SupabaseClient<any, any, any>) {} // eslint-disable-line @typescript-eslint/no-explicit-any

  async createWithItems(input: CreateSaleWithItemsInput): Promise<Sale> {
    // 1. Cria o header da venda
    const { data: saleData, error: saleError } = await this.client
      .from('sales')
      .insert({
        business_id: input.businessId,
        total_price: input.totalPrice,
        payment_type: input.paymentType,
        customer_id: input.customerId,
        seller_id: input.sellerId,
        status: input.status,
      })
      .select()
      .single()
    if (saleError || !saleData) throw new Error(saleError?.message ?? 'Erro ao registrar venda')

    // 2. Cria os itens
    const itemRows = input.items.map(item => ({
      sale_id: saleData.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      unit_cost: item.unitCost,
      discount_pct: item.discountPct,
    }))

    const { error: itemsError } = await this.client
      .from('sale_items')
      .insert(itemRows)
    if (itemsError) throw new Error(itemsError.message)

    const sale = mapRow(saleData)
    sale.items = input.items.map((item) => ({
      id: '', // gerado pelo banco, não precisamos aqui
      saleId: saleData.id,
      ...item,
    }))
    return sale
  }

  /** @deprecated Use createWithItems */
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

  async listItemsBySale(saleId: string): Promise<SaleItem[]> {
    const { data, error } = await this.client
      .from('sale_items')
      .select('*')
      .eq('sale_id', saleId)
    if (error || !data) return []
    return data.map(mapSaleItem)
  }

  async hasProductSales(businessId: string, productId: string): Promise<boolean> {
    // Checa tanto em sale_items quanto no campo legado
    const { count: itemCount } = await this.client
      .from('sale_items')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId)
    if ((itemCount ?? 0) > 0) return true

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

  async listByBusinessWithItems(businessId: string, filters?: SaleFilters): Promise<Sale[]> {
    const sales = await this.listByBusiness(businessId, filters)

    // Carrega items para todas as vendas de uma vez
    const saleIds = sales.map(s => s.id)
    if (saleIds.length === 0) return sales

    const { data: itemsData } = await this.client
      .from('sale_items')
      .select('*')
      .in('sale_id', saleIds)

    if (itemsData) {
      const itemsBySale = new Map<string, SaleItem[]>()
      for (const row of itemsData) {
        const item = mapSaleItem(row)
        const existing = itemsBySale.get(item.saleId) ?? []
        existing.push(item)
        itemsBySale.set(item.saleId, existing)
      }
      for (const sale of sales) {
        sale.items = itemsBySale.get(sale.id) ?? []
      }
    }

    return sales
  }
}
