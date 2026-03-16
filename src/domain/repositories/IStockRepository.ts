import type { StockEntry, StockMovement, MovementType, MovementReason } from '@/domain/types'

export interface AddMovementInput {
  userId: string
  productId: string
  type: MovementType
  reason: MovementReason
  quantity: number
  saleId?: string
  notes?: string
}

export interface IStockRepository {
  getEntry(userId: string, productId: string): Promise<StockEntry | null>
  listEntries(userId: string): Promise<StockEntry[]>
  upsertEntry(userId: string, productId: string, quantity: number): Promise<StockEntry>
  incrementEntry(userId: string, productId: string, quantity: number): Promise<StockEntry>
  decrementEntry(userId: string, productId: string, quantity: number): Promise<StockEntry>
  addMovement(input: AddMovementInput): Promise<StockMovement>
  listMovements(userId: string, productId: string): Promise<StockMovement[]>
}
