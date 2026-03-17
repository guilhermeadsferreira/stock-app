// ─── Enums ───────────────────────────────────────────────────────────────────

export type MovementType = 'in' | 'out'

export type MovementReason =
  | 'purchase'    // entrada por compra
  | 'adjustment'  // ajuste manual
  | 'sale'        // saída por venda
  | 'loss'        // perda / vencimento
  | 'return'      // devolução

export type PaymentType = 'cash' | 'credit'

// ─── Entities ────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  businessName: string
  lowStockThreshold: number   // qty padrão para alerta
  expirationAlertDays: number // dias antes do vencimento para alertar
  createdAt: Date
}

export interface Product {
  id: string
  userId: string
  name: string
  barcode: string | null
  purchasePrice: number  // centavos
  salePrice: number      // centavos
  expirationDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface StockEntry {
  id: string
  userId: string
  productId: string
  quantity: number
  updatedAt: Date
}

export interface StockMovement {
  id: string
  userId: string
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
  userId: string
  name: string
  phone: string | null
  createdAt: Date
}

export interface Sale {
  id: string
  userId: string
  productId: string
  quantity: number
  unitPrice: number               // centavos — preço cobrado no momento
  totalPrice: number              // centavos — quantity * unitPrice
  purchasePriceSnapshot: number   // centavos — custo no momento da venda
  paymentType: PaymentType
  customerId: string | null       // obrigatório quando paymentType === 'credit'
  createdAt: Date
}

// Tipo local (não persiste no banco) — usado no fluxo de venda com múltiplos itens
export interface CartItem {
  product: Product
  quantity: number
  unitPrice: number  // centavos
}

export interface CreditPayment {
  id: string
  userId: string
  customerId: string
  amount: number  // centavos
  notes: string | null
  createdAt: Date
}
