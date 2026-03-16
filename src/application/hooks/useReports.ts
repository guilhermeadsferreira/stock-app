import { useState, useCallback } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { SaleRepository } from '@/infrastructure/supabase/SaleRepository'
import { ProductRepository } from '@/infrastructure/supabase/ProductRepository'
import { StockRepository } from '@/infrastructure/supabase/StockRepository'
import { CustomerRepository } from '@/infrastructure/supabase/CustomerRepository'
import { CreditRepository } from '@/infrastructure/supabase/CreditRepository'
import { useAuthStore } from '@/application/stores/authStore'
import { useSettingsStore } from '@/application/stores/settingsStore'
import { calcStockValue, isLowStock, isNearExpiry } from '@/domain/rules/stock.rules'
import { calcDebtBalance } from '@/domain/rules/credit.rules'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import type { Product, StockEntry, Customer } from '@/domain/types'

const saleRepo = new SaleRepository(supabase)
const productRepo = new ProductRepository(supabase)
const stockRepo = new StockRepository(supabase)
const customerRepo = new CustomerRepository(supabase)
const creditRepo = new CreditRepository(supabase)

export type Period = 'today' | 'week' | 'month'

function getPeriodRange(period: Period): { from: Date; to: Date } {
  const now = new Date()
  switch (period) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) }
    case 'week':
      return { from: startOfWeek(now, { weekStartsOn: 0 }), to: endOfWeek(now, { weekStartsOn: 0 }) }
    case 'month':
      return { from: startOfMonth(now), to: endOfMonth(now) }
  }
}

export interface ReportData {
  stockValue: number
  cashSalesTotal: number
  openCreditTotal: number
  openCreditCustomerCount: number
  lowStockProducts: Product[]
  nearExpiryProducts: Product[]
  recentSalesCount: number
  stockEntries: StockEntry[]
}

export function useReports() {
  const { user } = useAuthStore()
  const { lowStockThreshold, expirationAlertDays } = useSettingsStore()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (period: Period = 'today') => {
    if (!user) return
    setLoading(true)
    try {
      const { from, to } = getPeriodRange(period)

      const [products, entries, cashSales, customers] = await Promise.all([
        productRepo.list(user.id),
        stockRepo.listEntries(user.id),
        saleRepo.listByUser(user.id, { paymentType: 'cash', from, to }),
        customerRepo.list(user.id),
      ])

      const entryMap = new Map<string, StockEntry>(entries.map(e => [e.productId, e]))

      // Crédito aberto por cliente
      const customerCreditData = await Promise.all(
        customers.map(async (c: Customer) => {
          const [creditSales, payments] = await Promise.all([
            saleRepo.listByUser(user.id, { paymentType: 'credit', customerId: c.id }),
            creditRepo.listPaymentsByCustomer(user.id, c.id),
          ])
          return calcDebtBalance(creditSales, payments)
        }),
      )

      const openCreditTotal = customerCreditData.reduce((sum, b) => sum + b, 0)
      const openCreditCustomerCount = customerCreditData.filter(b => b > 0).length

      const stockValue = calcStockValue(products, entries)
      const cashSalesTotal = cashSales.reduce((sum, s) => sum + s.totalPrice, 0)

      const lowStockProducts = products.filter(p => {
        const qty = entryMap.get(p.id)?.quantity ?? 0
        return isLowStock(qty, lowStockThreshold)
      })

      const nearExpiryProducts = products.filter(p =>
        p.expirationDate && isNearExpiry(p.expirationDate, expirationAlertDays),
      )

      setData({
        stockValue,
        cashSalesTotal,
        openCreditTotal,
        openCreditCustomerCount,
        lowStockProducts,
        nearExpiryProducts,
        recentSalesCount: cashSales.length,
        stockEntries: entries,
      })
    } finally {
      setLoading(false)
    }
  }, [user, lowStockThreshold, expirationAlertDays])

  return { data, loading, load }
}
