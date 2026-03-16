import type { SupabaseClient } from '@supabase/supabase-js'
import type { IStockRepository, AddMovementInput } from '@/domain/repositories/IStockRepository'
import type { StockEntry, StockMovement } from '@/domain/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEntry(row: any): StockEntry {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    quantity: row.quantity,
    updatedAt: new Date(row.updated_at),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMovement(row: any): StockMovement {
  return {
    id: row.id,
    userId: row.user_id,
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
  constructor(private readonly client: SupabaseClient<any, any, any>) {}

  async getEntry(userId: string, productId: string): Promise<StockEntry | null> {
    const { data, error } = await this.client
      .from('stock_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()
    if (error || !data) return null
    return mapEntry(data)
  }

  async listEntries(userId: string): Promise<StockEntry[]> {
    const { data, error } = await this.client
      .from('stock_entries')
      .select('*')
      .eq('user_id', userId)
    if (error || !data) return []
    return data.map(mapEntry)
  }

  async upsertEntry(userId: string, productId: string, quantity: number): Promise<StockEntry> {
    const { data, error } = await this.client
      .from('stock_entries')
      .upsert(
        { user_id: userId, product_id: productId, quantity, updated_at: new Date().toISOString() },
        { onConflict: 'product_id' },
      )
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Erro ao salvar estoque')
    return mapEntry(data)
  }

  async incrementEntry(userId: string, productId: string, quantity: number): Promise<StockEntry> {
    const current = await this.getEntry(userId, productId)
    const newQty = (current?.quantity ?? 0) + quantity
    return this.upsertEntry(userId, productId, newQty)
  }

  async decrementEntry(userId: string, productId: string, quantity: number): Promise<StockEntry> {
    const current = await this.getEntry(userId, productId)
    const newQty = Math.max(0, (current?.quantity ?? 0) - quantity)
    return this.upsertEntry(userId, productId, newQty)
  }

  async addMovement(input: AddMovementInput): Promise<StockMovement> {
    const { data, error } = await this.client
      .from('stock_movements')
      .insert({
        user_id: input.userId,
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

  async listMovements(userId: string, productId: string): Promise<StockMovement[]> {
    const { data, error } = await this.client
      .from('stock_movements')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return data.map(mapMovement)
  }
}
