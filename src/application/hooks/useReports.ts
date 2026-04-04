import { useState, useCallback } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { SaleRepository } from '@/infrastructure/supabase/SaleRepository'
import { ProductRepository } from '@/infrastructure/supabase/ProductRepository'
import { StockRepository } from '@/infrastructure/supabase/StockRepository'
import { CustomerRepository } from '@/infrastructure/supabase/CustomerRepository'
import { CreditRepository } from '@/infrastructure/supabase/CreditRepository'
import { useAuthStore } from '@/application/stores/authStore'
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
  allSalesTotal: number      // todas as vendas do período (à vista + fiado)
  cashSalesTotal: number     // só à vista no período
  creditSalesTotal: number   // só fiado no período (= allSalesTotal - cashSalesTotal)
  openCreditTotal: number
  openCreditCustomerCount: number
  lowStockProducts: Product[]
  nearExpiryProducts: Product[]
  recentSalesCount: number
  stockEntries: StockEntry[]
}

export function useReports() {
  const { currentBusiness } = useAuthStore()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (period: Period = 'today') => {
    if (!currentBusiness) return
    setLoading(true)
    try {
      const { from, to } = getPeriodRange(period)

      const [products, entries, allSales, customers] = await Promise.all([
        productRepo.list(currentBusiness.id),
        stockRepo.listEntries(currentBusiness.id),
        saleRepo.listByBusiness(currentBusiness.id, { from, to }),
        customerRepo.list(currentBusiness.id),
      ])

      const entryMap = new Map<string, StockEntry>(entries.map(e => [e.productId, e]))

      // Crédito aberto por cliente
      const customerCreditData = await Promise.all(
        customers.map(async (c: Customer) => {
          const [creditSales, payments] = await Promise.all([
            saleRepo.listByBusiness(currentBusiness.id, { paymentType: 'credit', customerId: c.id }),
            creditRepo.listPaymentsByCustomer(currentBusiness.id, c.id),
          ])
          return calcDebtBalance(creditSales, payments)
        }),
      )

      const openCreditTotal = customerCreditData.reduce((sum, b) => sum + b, 0)
      const openCreditCustomerCount = customerCreditData.filter(b => b > 0).length

      const stockValue = calcStockValue(products, entries)
      const allSalesTotal = allSales.reduce((sum, s) => sum + s.totalPrice, 0)
      const cashSalesTotal = allSales.filter(s => s.paymentType !== 'credit').reduce((sum, s) => sum + s.totalPrice, 0)
      const creditSalesTotal = allSales.filter(s => s.paymentType === 'credit').reduce((sum, s) => sum + s.totalPrice, 0)

      const lowStockProducts = products.filter(p => {
        const qty = entryMap.get(p.id)?.quantity ?? 0
        return isLowStock(qty, currentBusiness.lowStockThreshold)
      })

      const nearExpiryProducts = products.filter(p =>
        p.expirationDate && isNearExpiry(p.expirationDate, currentBusiness.expirationAlertDays),
      )

      setData({
        stockValue,
        allSalesTotal,
        cashSalesTotal,
        creditSalesTotal,
        openCreditTotal,
        openCreditCustomerCount,
        lowStockProducts,
        nearExpiryProducts,
        recentSalesCount: allSales.filter(s => s.paymentType !== 'credit').length,
        stockEntries: entries,
      })
    } finally {
      setLoading(false)
    }
  }, [currentBusiness])

  return { data, loading, load }
}
