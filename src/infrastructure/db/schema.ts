import {
  pgSchema,
  uuid,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'

export const stockSchema = pgSchema('stock')

// ─── Enums ───────────────────────────────────────────────────────────────────

export const movementTypeEnum = stockSchema.enum('movement_type', ['in', 'out'])
export const movementReasonEnum = stockSchema.enum('movement_reason', [
  'purchase',
  'adjustment',
  'sale',
  'loss',
  'return',
])
export const paymentTypeEnum = stockSchema.enum('payment_type', ['cash', 'credit', 'card', 'pix'])

// ─── Tables ──────────────────────────────────────────────────────────────────

export const businesses = stockSchema.table('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ownerId: uuid('owner_id').notNull(),
  inviteCode: text('invite_code').notNull(),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
  expirationAlertDays: integer('expiration_alert_days').notNull().default(7),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('businesses_invite_code_idx').on(t.inviteCode),
])

export const userProfiles = stockSchema.table('user_profiles', {
  id: uuid('id').primaryKey(),  // mesmo UUID do auth.users
  email: text('email').notNull().default(''),
  name: text('name'),
  businessId: uuid('business_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const products = stockSchema.table('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull(),
  name: text('name').notNull(),
  brand: text('brand'),
  barcode: text('barcode'),
  purchasePrice: integer('purchase_price').notNull(),   // centavos
  salePrice: integer('sale_price').notNull(),            // centavos
  notes: text('notes'),
  maxDiscountPct: integer('max_discount_pct'),  // percentual inteiro (0-100), null = sem limite
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('barcode_business_idx').on(t.barcode, t.businessId),
  index('products_business_id_idx').on(t.businessId),
])

export const stockEntries = stockSchema.table('stock_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('stock_entry_product_idx').on(t.productId),
])

export const stockMovements = stockSchema.table('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  type: movementTypeEnum('type').notNull(),
  reason: movementReasonEnum('reason').notNull(),
  quantity: integer('quantity').notNull(),
  saleId: uuid('sale_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('stock_movements_product_idx').on(t.productId),
  index('stock_movements_business_idx').on(t.businessId),
])

export const customers = stockSchema.table('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('customers_business_id_idx').on(t.businessId),
])

export const sales = stockSchema.table('sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull(),
  totalPrice: integer('total_price').notNull(),             // centavos — soma dos itens
  paymentType: paymentTypeEnum('payment_type').notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  sellerId: uuid('seller_id'),
  status: text('status').notNull().default('paid'), // 'paid' | 'pending'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  // Campos legados (mantidos por compatibilidade, nullable)
  productId: uuid('product_id').references(() => products.id),
  quantity: integer('quantity'),
  unitPrice: integer('unit_price'),
  purchasePriceSnapshot: integer('purchase_price_snapshot'),
}, (t) => [
  index('sales_business_id_idx').on(t.businessId),
  index('sales_customer_id_idx').on(t.customerId),
  index('sales_created_at_idx').on(t.createdAt),
  index('sales_seller_id_idx').on(t.sellerId),
])

export const saleItems = stockSchema.table('sale_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  saleId: uuid('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),                // centavos — preço cobrado
  unitCost: integer('unit_cost').notNull(),                  // centavos — custo no momento
  discountPct: integer('discount_pct').notNull().default(0), // percentual inteiro (0-100)
}, (t) => [
  index('sale_items_sale_id_idx').on(t.saleId),
  index('sale_items_product_id_idx').on(t.productId),
])

export const creditPayments = stockSchema.table('credit_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  amount: integer('amount').notNull(),  // centavos
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('credit_payments_customer_idx').on(t.customerId),
])

export const userBusiness = stockSchema.table('user_business', {
  userId: uuid('user_id').notNull().references(() => userProfiles.id),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'), // 'owner' | 'member'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.businessId] }),
  index('user_business_user_id_idx').on(t.userId),
])
