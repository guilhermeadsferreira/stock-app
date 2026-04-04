import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '@/infrastructure/supabase/client'
import { SaleRepository } from '@/infrastructure/supabase/SaleRepository'
import { ProductRepository } from '@/infrastructure/supabase/ProductRepository'
import { CustomerRepository } from '@/infrastructure/supabase/CustomerRepository'
import { useAuthStore } from '@/application/stores/authStore'
import { centsToBRL } from '@/domain/formatters/currency'
import { formatDateTime } from '@/domain/formatters/date'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Sale, Product, Customer } from '@/domain/types'

const saleRepo = new SaleRepository(supabase)
const productRepo = new ProductRepository(supabase)
const customerRepo = new CustomerRepository(supabase)

type Period = 'today' | 'week' | 'month'

const periodLabels: Record<Period, string> = {
  today: 'Hoje',
  week: 'Semana',
  month: 'Mês',
}

function getPeriodRange(period: Period): { from: Date; to: Date } {
  const now = new Date()
  switch (period) {
    case 'today': return { from: startOfDay(now), to: endOfDay(now) }
    case 'week':  return { from: startOfWeek(now, { weekStartsOn: 0 }), to: endOfWeek(now, { weekStartsOn: 0 }) }
    case 'month': return { from: startOfMonth(now), to: endOfMonth(now) }
  }
}

export function SalesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { currentBusiness } = useAuthStore()

  const period = (searchParams.get('period') as Period) ?? 'today'

  const [sales, setSales] = useState<Sale[]>([])
  const [productMap, setProductMap] = useState<Map<string, Product>>(new Map())
  const [customerMap, setCustomerMap] = useState<Map<string, Customer>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentBusiness) return
    async function load() {
      if (!currentBusiness) return
      setLoading(true)
      try {
        const { from, to } = getPeriodRange(period)
        const [fetchedSales, products, customers] = await Promise.all([
          saleRepo.listByBusiness(currentBusiness.id, { from, to }),
          productRepo.list(currentBusiness.id),
          customerRepo.list(currentBusiness.id),
        ])
        setSales(fetchedSales)
        setProductMap(new Map(products.map(p => [p.id, p])))
        setCustomerMap(new Map(customers.map(c => [c.id, c])))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentBusiness, period])

  const total = sales.reduce((sum, s) => sum + s.totalPrice, 0)
  const cashTotal = sales.filter(s => s.paymentType === 'cash').reduce((sum, s) => sum + s.totalPrice, 0)
  const cardTotal = sales.filter(s => s.paymentType === 'card').reduce((sum, s) => sum + s.totalPrice, 0)
  const pixTotal = sales.filter(s => s.paymentType === 'pix').reduce((sum, s) => sum + s.totalPrice, 0)
  const creditTotal = sales.filter(s => s.paymentType === 'credit').reduce((sum, s) => sum + s.totalPrice, 0)

  return (
    <div className="space-y-4 px-5 pt-8 pb-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>

      {/* Chips de período */}
      <div className="flex gap-2">
        {(Object.keys(periodLabels) as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setSearchParams({ period: p })}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
              period === p
                ? 'bg-foreground text-background'
                : 'bg-card text-muted-foreground border border-border/60',
            )}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Resumo do período */}
      {!loading && sales.length > 0 && (
        <div className="rounded-2xl bg-card p-4 shadow-sm space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-2xl font-bold text-foreground tracking-tight">{centsToBRL(total)}</span>
          </div>
          {(cashTotal > 0 || cardTotal > 0 || pixTotal > 0 || creditTotal > 0) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm pt-1 border-t border-border/50">
              {cashTotal > 0 && <span className="text-green-700">Dinheiro: {centsToBRL(cashTotal)}</span>}
              {cardTotal > 0 && <span className="text-purple-700">Cartão: {centsToBRL(cardTotal)}</span>}
              {pixTotal > 0 && <span className="text-teal-700">PIX: {centsToBRL(pixTotal)}</span>}
              {creditTotal > 0 && <span className="text-blue-700">Fiado: {centsToBRL(creditTotal)}</span>}
            </div>
          )}
        </div>
      )}

      {/* Lista de vendas */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[72px] w-full rounded-2xl" />)}
        </div>
      ) : sales.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma venda neste período</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sales.map(sale => {
            const product = productMap.get(sale.productId)
            const customer = sale.customerId ? customerMap.get(sale.customerId) : null
            return (
              <div
                key={sale.id}
                className="rounded-2xl bg-card px-4 py-3.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] truncate">
                      {product?.name ?? 'Produto removido'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {sale.quantity}× {centsToBRL(sale.unitPrice)}
                      {customer && <span className="ml-2">· {customer.name}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{formatDateTime(sale.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="font-bold text-[15px]">{centsToBRL(sale.totalPrice)}</span>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      {
                        cash: 'bg-green-100 text-green-700',
                        card: 'bg-purple-100 text-purple-700',
                        pix: 'bg-teal-100 text-teal-700',
                        credit: 'bg-blue-100 text-blue-700',
                      }[sale.paymentType],
                    )}>
                      {{ cash: 'Dinheiro', card: 'Cartão', pix: 'PIX', credit: 'Fiado' }[sale.paymentType]}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
