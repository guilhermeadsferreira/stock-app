// ─── Enums ───────────────────────────────────────────────────────────────────

export type MovementType = 'in' | 'out'

export type MovementReason =
  | 'purchase'    // entrada por compra
  | 'adjustment'  // ajuste manual
  | 'sale'        // saída por venda
  | 'loss'        // perda / vencimento
  | 'return'      // devolução

export type PaymentType = 'cash' | 'credit' | 'card' | 'pix'

// ─── Entities ────────────────────────────────────────────────────────────────

export interface Business {
  id: string
  name: string
  ownerId: string
  inviteCode: string
  lowStockThreshold: number
  expirationAlertDays: number
  createdAt: Date
}

export interface BusinessMember {
  id: string
  email: string
  isOwner: boolean
}

export interface UserProfile {
  id: string
  email: string
  name: string | null
  businessId: string | null
  createdAt: Date
}

export type BusinessRole = 'owner' | 'member'

export interface UserBusiness {
  userId: string
  businessId: string
  role: BusinessRole
  createdAt: Date
}

export interface Product {
  id: string
  businessId: string
  name: string
  brand: string | null
  barcode: string | null
  purchasePrice: number  // centavos
  salePrice: number      // centavos
  notes: string | null
  maxDiscountPct: number | null  // percentual inteiro (0-100), null = sem limite
  expirationDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface StockEntry {
  id: string
  businessId: string
  productId: string
  quantity: number
  updatedAt: Date
}

export interface StockMovement {
  id: string
  businessId: string
  productId: string
  type: MovementType
  reason: MovementReason
  quantity: number
  saleId: string | null
  notes: string | null
  createdAt: Date
}

export interface Customer {
  id: string
  businessId: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  createdAt: Date
}

export type SaleStatus = 'paid' | 'pending'

export interface Sale {
  id: string
  businessId: string
  totalPrice: number              // centavos — soma de todos os itens
  paymentType: PaymentType
  customerId: string | null       // obrigatório quando paymentType === 'credit'
  sellerId: string | null
  status: SaleStatus
  createdAt: Date
  items?: SaleItem[]              // carregados sob demanda
  // Campos legados (vendas antigas sem sale_items)
  productId?: string | null
  quantity?: number | null
  unitPrice?: number | null
  purchasePriceSnapshot?: number | null
}

export interface SaleItem {
  id: string
  saleId: string
  productId: string
  quantity: number
  unitPrice: number       // centavos — preço cobrado
  unitCost: number        // centavos — custo no momento
  discountPct: number     // percentual inteiro (0-100)
}

// Tipo local (não persiste no banco) — usado no fluxo de venda com múltiplos itens
export interface CartItem {
  product: Product
  quantity: number
  unitPrice: number  // centavos
}

export interface CreditPayment {
  id: string
  businessId: string
  customerId: string
  amount: number  // centavos
  notes: string | null
  createdAt: Date
}
