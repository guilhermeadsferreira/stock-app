import type { SupabaseClient } from '@supabase/supabase-js'
import type { IStockRepository, AddMovementInput } from '@/domain/repositories/IStockRepository'
import type { StockEntry, StockMovement } from '@/domain/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEntry(row: any): StockEntry {
  return {
    id: row.id,
    businessId: row.business_id,
    productId: row.product_id,
    quantity: row.quantity,
    updatedAt: new Date(row.updated_at),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMovement(row: any): StockMovement {
  return {
    id: row.id,
    businessId: row.business_id,
    productId: row.product_id,
    type: row.type,
    reason: row.reason,
    quantity: row.quantity,
    saleId: row.sale_id ?? null,
    notes: row.notes ?? null,
    createdAt: new Date(row.created_at),
  }
}

export class StockRepository implements IStockRepository {
  constructor(private readonly client: SupabaseClient<any, any, any>) {} // eslint-disable-line @typescript-eslint/no-explicit-any

  async getEntry(businessId: string, productId: string): Promise<StockEntry | null> {
    const { data, error } = await this.client
      .from('stock_entries')
      .select('*')
      .eq('business_id', businessId)
      .eq('product_id', productId)
      .single()
    if (error || !data) return null
    return mapEntry(data)
  }

  async listEntries(businessId: string): Promise<StockEntry[]> {
    const { data, error } = await this.client
      .from('stock_entries')
      .select('*')
      .eq('business_id', businessId)
    if (error || !data) return []
    return data.map(mapEntry)
  }

  async upsertEntry(businessId: string, productId: string, quantity: number): Promise<StockEntry> {
    const { data, error } = await this.client
      .from('stock_entries')
      .upsert(
        { business_id: businessId, product_id: productId, quantity, updated_at: new Date().toISOString() },
        { onConflict: 'product_id' },
      )
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Erro ao salvar estoque')
    return mapEntry(data)
  }

  async incrementEntry(businessId: string, productId: string, quantity: number): Promise<StockEntry> {
    const current = await this.getEntry(businessId, productId)
    const newQty = (current?.quantity ?? 0) + quantity
    return this.upsertEntry(businessId, productId, newQty)
  }

  async decrementEntry(businessId: string, productId: string, quantity: number): Promise<StockEntry> {
    const current = await this.getEntry(businessId, productId)
    const newQty = Math.max(0, (current?.quantity ?? 0) - quantity)
    return this.upsertEntry(businessId, productId, newQty)
  }

  async addMovement(input: AddMovementInput): Promise<StockMovement> {
    const { data, error } = await this.client
      .from('stock_movements')
      .insert({
        business_id: input.businessId,
        product_id: input.productId,
        type: input.type,
        reason: input.reason,
        quantity: input.quantity,
        sale_id: input.saleId ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Erro ao registrar movimentação')
    return mapMovement(data)
  }

  async deleteEntry(businessId: string, productId: string): Promise<void> {
    const { error } = await this.client
      .from('stock_entries')
      .delete()
      .eq('business_id', businessId)
      .eq('product_id', productId)
    if (error) throw new Error(error.message)
  }

  async listMovements(businessId: string, productId: string): Promise<StockMovement[]> {
    const { data, error } = await this.client
      .from('stock_movements')
      .select('*')
      .eq('business_id', businessId)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return data.map(mapMovement)
  }
}
