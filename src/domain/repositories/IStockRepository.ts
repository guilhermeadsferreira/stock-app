import type { StockEntry, StockMovement, MovementType, MovementReason } from '@/domain/types'

export interface AddMovementInput {
  businessId: string
  productId: string
  type: MovementType
  reason: MovementReason
  quantity: number
  saleId?: string
  notes?: string
}

export interface IStockRepository {
  getEntry(businessId: string, productId: string): Promise<StockEntry | null>
  listEntries(businessId: string): Promise<StockEntry[]>
  upsertEntry(businessId: string, productId: string, quantity: number): Promise<StockEntry>
  incrementEntry(businessId: string, productId: string, quantity: number): Promise<StockEntry>
  decrementEntry(businessId: string, productId: string, quantity: number): Promise<StockEntry>
  addMovement(input: AddMovementInput): Promise<StockMovement>
  listMovements(businessId: string, productId: string): Promise<StockMovement[]>
  deleteEntry(businessId: string, productId: string): Promise<void>
}
