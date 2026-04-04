import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { toast } from 'sonner'
import { supabase } from '@/infrastructure/supabase/client'
import { SaleRepository } from '@/infrastructure/supabase/SaleRepository'
import { ProductRepository } from '@/infrastructure/supabase/ProductRepository'
import { CustomerRepository } from '@/infrastructure/supabase/CustomerRepository'
import { useAuthStore } from '@/application/stores/authStore'
import { useSales } from '@/application/hooks/useSales'
import { centsToBRL } from '@/domain/formatters/currency'
import { formatDateTime } from '@/domain/formatters/date'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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

const paymentLabel: Record<string, string> = { cash: 'Dinheiro', card: 'Cartão', pix: 'PIX', credit: 'Fiado' }
const paymentBadge: Record<string, string> = {
  cash: 'bg-green-100 text-green-700',
  card: 'bg-purple-100 text-purple-700',
  pix: 'bg-teal-100 text-teal-700',
  credit: 'bg-blue-100 text-blue-700',
}
const statusLabel: Record<string, string> = { paid: 'Pago', pending: 'Pendente' }
const statusBadge: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
}

export function SalesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { currentBusiness, user } = useAuthStore()
  const { cancelSale } = useSales()

  const period = (searchParams.get('period') as Period) ?? 'today'

  const [sales, setSales] = useState<Sale[]>([])
  const [productMap, setProductMap] = useState<Map<string, Product>>(new Map())
  const [customerMap, setCustomerMap] = useState<Map<string, Customer>>(new Map())
  const [loading, setLoading] = useState(true)

  // Modal state
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const isOwner = currentBusiness?.ownerId === user?.id

  useEffect(() => {
    if (!currentBusiness) return
    async function load() {
      if (!currentBusiness) return
      setLoading(true)
      try {
        const { from, to } = getPeriodRange(period)
        const [fetchedSales, products, customers] = await Promise.all([
          saleRepo.listByBusinessWithItems(currentBusiness.id, { from, to }),
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

  async function handleCancelSale() {
    if (!selectedSale) return
    setCancelling(true)
    try {
      await cancelSale(selectedSale)
      setSales(prev => prev.filter(s => s.id !== selectedSale.id))
      setSelectedSale(null)
      setCancelConfirmOpen(false)
      toast.success('Venda cancelada e estoque revertido')
    } catch {
      toast.error('Erro ao cancelar venda')
    } finally {
      setCancelling(false)
    }
  }

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
            const customer = sale.customerId ? customerMap.get(sale.customerId) : null
            const hasItems = sale.items && sale.items.length > 0

            return (
              <button
                key={sale.id}
                onClick={() => setSelectedSale(sale)}
                className="w-full rounded-2xl bg-card px-4 py-3.5 shadow-sm text-left active:scale-[0.99] active:shadow-none transition-all duration-150"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {hasItems ? (
                      <p className="font-semibold text-[15px] truncate">
                        {sale.items!.length === 1
                          ? productMap.get(sale.items![0].productId)?.name ?? 'Produto'
                          : `${sale.items!.length} itens`}
                      </p>
                    ) : (
                      <p className="font-semibold text-[15px] truncate">
                        {sale.productId ? (productMap.get(sale.productId)?.name ?? 'Produto removido') : 'Venda'}
                      </p>
                    )}
                    {customer && (
                      <p className="text-sm text-muted-foreground mt-0.5">· {customer.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{formatDateTime(sale.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="font-bold text-[15px]">{centsToBRL(sale.totalPrice)}</span>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      paymentBadge[sale.paymentType],
                    )}>
                      {paymentLabel[sale.paymentType]}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Modal de detalhe da venda */}
      <Dialog open={selectedSale !== null} onOpenChange={open => { if (!open) setSelectedSale(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhe da venda</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              {/* Status + Data */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{formatDateTime(selectedSale.createdAt)}</span>
                <span className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  statusBadge[selectedSale.status],
                )}>
                  {statusLabel[selectedSale.status]}
                </span>
              </div>

              {/* Itens */}
              <div className="space-y-2">
                {(selectedSale.items ?? []).map((item, i) => {
                  const product = productMap.get(item.productId)
                  const lineTotal = item.quantity * item.unitPrice
                  return (
                    <div key={i} className="flex justify-between gap-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product?.name ?? 'Produto'}</p>
                        <p className="text-muted-foreground">
                          {item.quantity}× {centsToBRL(item.unitPrice)}
                          {item.discountPct > 0 && (
                            <span className="ml-1.5 text-amber-600">(-{item.discountPct}%)</span>
                          )}
                        </p>
                      </div>
                      <span className="font-medium shrink-0">{centsToBRL(lineTotal)}</span>
                    </div>
                  )
                })}
              </div>

              {/* Total */}
              <div className="flex justify-between border-t pt-3">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-primary">{centsToBRL(selectedSale.totalPrice)}</span>
              </div>

              {/* Pagamento + Cliente */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagamento</span>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', paymentBadge[selectedSale.paymentType])}>
                    {paymentLabel[selectedSale.paymentType]}
                  </span>
                </div>
                {selectedSale.customerId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente</span>
                    <span className="font-medium">{customerMap.get(selectedSale.customerId)?.name ?? '—'}</span>
                  </div>
                )}
              </div>

              {/* Cancelar venda — owner only */}
              {isOwner && (
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive border-destructive/40 hover:bg-destructive/5"
                  onClick={() => setCancelConfirmOpen(true)}
                >
                  Cancelar venda
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de cancelamento */}
      <AlertDialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar venda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O estoque dos produtos será revertido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancelSale}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelando...' : 'Confirmar cancelamento'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
