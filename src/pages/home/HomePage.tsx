import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Package, Users, Settings, Clock, ChevronRight, AlertTriangle } from 'lucide-react'
import { useReports } from '@/application/hooks/useReports'
import { useAuthStore } from '@/application/stores/authStore'
import { centsToBRL } from '@/domain/formatters/currency'
import { StockBadge } from '@/components/stock/StockBadge'
import { ExpiryBadge } from '@/components/stock/ExpiryBadge'

export function HomePage() {
  const navigate = useNavigate()
  const { user, currentBusiness, displayName } = useAuthStore()
  const userName = displayName ?? user?.email?.split('@')[0] ?? ''
  const lowStockThreshold = currentBusiness?.lowStockThreshold ?? 5
  const expirationAlertDays = currentBusiness?.expirationAlertDays ?? 7
  const { data, loading, load } = useReports()

  useEffect(() => { load('today') }, [load])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="space-y-4">
      {/* Hero — deep forest green */}
      <div className="bg-sidebar-dark px-5 pt-8 pb-6 md:px-8 lg:rounded-2xl lg:mx-5 lg:mt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/60 font-medium">{greeting}</p>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">{userName}</h1>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="mt-1 rounded-full p-2 hover:bg-white/10 active:bg-white/15 transition-colors"
          >
            <Settings className="h-5 w-5 text-white/60" strokeWidth={1.75} />
          </button>
        </div>

        {/* Vendas hoje — destaque dentro do hero */}
        <button
          onClick={() => navigate('/sales?period=today')}
          className="mt-5 flex w-full items-center justify-between rounded-xl bg-white/10 px-4 py-3 active:bg-white/15 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <TrendingUp className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Vendas hoje</p>
              {loading
                ? <div className="mt-1 h-6 w-20 animate-pulse rounded bg-white/10" />
                : <p className="text-xl font-bold text-white leading-none mt-0.5">{centsToBRL(data?.allSalesTotal ?? 0)}</p>
              }
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-white/40" />
        </button>
      </div>

      <div className="px-5 pb-6 space-y-4 md:px-8 lg:px-0 lg:mx-5">
        {/* Métricas em grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/stock')}
            className="rounded-2xl bg-card border border-border/50 p-4 text-left shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
              <Package className="h-3.5 w-3.5" strokeWidth={1.75} />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Estoque</p>
            </div>
            {loading
              ? <div className="h-7 w-20 animate-pulse rounded bg-muted" />
              : <p className="text-2xl font-bold leading-none tracking-tight">{centsToBRL(data?.stockValue ?? 0)}</p>
            }
          </button>

          <button
            onClick={() => navigate('/customers')}
            className="rounded-2xl bg-credit p-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-1.5 text-blue-200 mb-2">
              <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Fiado</p>
            </div>
            {loading
              ? <div className="h-7 w-20 animate-pulse rounded bg-white/10" />
              : <p className="text-2xl font-bold leading-none tracking-tight text-white">{centsToBRL(data?.openCreditTotal ?? 0)}</p>
            }
            {!loading && (data?.openCreditCustomerCount ?? 0) > 0 && (
              <p className="text-[10px] text-blue-300 mt-1.5">
                {data!.openCreditCustomerCount} cliente{data!.openCreditCustomerCount > 1 ? 's' : ''}
              </p>
            )}
          </button>
        </div>

        {/* Alertas — estoque baixo */}
        {!loading && data && data.lowStockProducts.length > 0 && (
          <div className="rounded-2xl border border-warning/15 bg-warning-surface p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-warning">
                <AlertTriangle className="h-4 w-4" />
                Estoque baixo
              </div>
              {data.lowStockProducts.length > 3 && (
                <button
                  onClick={() => navigate('/stock?filter=low')}
                  className="text-xs font-medium text-warning"
                >
                  Ver todos ({data.lowStockProducts.length})
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {data.lowStockProducts.slice(0, 3).map(p => {
                const qty = data.stockEntries.find(e => e.productId === p.id)?.quantity ?? 0
                return (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/stock/${p.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl bg-card px-3 py-2.5 text-left shadow-sm active:scale-[0.99] transition-transform"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                    <div className="shrink-0"><StockBadge quantity={qty} threshold={lowStockThreshold} /></div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Alertas — vencimento */}
        {!loading && data && data.nearExpiryProducts.length > 0 && (
          <div className="rounded-2xl border border-danger/15 bg-danger-surface p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-danger">
                <Clock className="h-4 w-4" />
                Vencimento próximo
              </div>
              {data.nearExpiryProducts.length > 3 && (
                <button
                  onClick={() => navigate('/stock?filter=expiring')}
                  className="text-xs font-medium text-danger"
                >
                  Ver todos ({data.nearExpiryProducts.length})
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {data.nearExpiryProducts.slice(0, 3).map(p => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/stock/${p.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl bg-card px-3 py-2.5 text-left shadow-sm active:scale-[0.99] transition-transform"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                  <div className="shrink-0"><ExpiryBadge expirationDate={p.expirationDate} alertDays={expirationAlertDays} /></div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
