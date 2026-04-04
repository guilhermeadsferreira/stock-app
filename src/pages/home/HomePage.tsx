import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Package, Users, Settings, Clock, ChevronRight } from 'lucide-react'
import { useReports } from '@/application/hooks/useReports'
import { useAuthStore } from '@/application/stores/authStore'
import { centsToBRL } from '@/domain/formatters/currency'
import { Button } from '@/components/ui/button'
import { StockBadge } from '@/components/stock/StockBadge'
import { ExpiryBadge } from '@/components/stock/ExpiryBadge'
import { StatCard } from '@/components/ui/stat-card'

export function HomePage() {
  const navigate = useNavigate()
  const { currentBusiness } = useAuthStore()
  const businessName = currentBusiness?.name ?? ''
  const lowStockThreshold = currentBusiness?.lowStockThreshold ?? 5
  const expirationAlertDays = currentBusiness?.expirationAlertDays ?? 7
  const { data, loading, load } = useReports()

  useEffect(() => { load('today') }, [load])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="px-5 pt-8 pb-6 space-y-5 md:px-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{greeting}</p>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">{businessName}</h1>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="mt-1 rounded-full p-2 hover:bg-foreground/5 active:bg-foreground/10 transition-colors"
        >
          <Settings className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
        </button>
      </div>

      {/* Lista estoque baixo */}
      {!loading && data && data.lowStockProducts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <Package className="h-4 w-4" />
            Estoque baixo
          </div>
          <div className="space-y-1.5">
            {data.lowStockProducts.slice(0, 5).map(p => {
              const qty = data.stockEntries.find(e => e.productId === p.id)?.quantity ?? 0
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                  <div className="shrink-0"><StockBadge quantity={qty} threshold={lowStockThreshold} /></div>
                </div>
              )
            })}
          </div>
          {data.lowStockProducts.length > 5 && (
            <button
              onClick={() => navigate('/stock?filter=low')}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 py-2 text-sm font-medium text-amber-700 active:bg-amber-100"
            >
              Ver todos ({data.lowStockProducts.length})
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Lista próximos ao vencimento */}
      {!loading && data && data.nearExpiryProducts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <Clock className="h-4 w-4" />
            Próximos ao vencimento
          </div>
          <div className="space-y-1.5">
            {data.nearExpiryProducts.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                <div className="shrink-0"><ExpiryBadge expirationDate={p.expirationDate} alertDays={expirationAlertDays} /></div>
              </div>
            ))}
          </div>
          {data.nearExpiryProducts.length > 5 && (
            <button
              onClick={() => navigate('/stock?filter=expiring')}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-700 active:bg-red-100"
            >
              Ver todos ({data.nearExpiryProducts.length})
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Package}
          label="Valor em estoque"
          value={loading ? null : centsToBRL(data?.stockValue ?? 0)}
        />
        <StatCard
          icon={TrendingUp}
          label="Vendas hoje"
          value={loading ? null : centsToBRL(data?.allSalesTotal ?? 0)}
          onClick={() => navigate('/sales?period=today')}
        />
      </div>

      {/* Card de fiado */}
      <StatCard
        variant="credit"
        icon={Users}
        label="Fiado em aberto"
        value={loading ? null : centsToBRL(data?.openCreditTotal ?? 0)}
        onClick={() => navigate('/customers')}
      >
        {!loading && (data?.openCreditCustomerCount ?? 0) > 0 && (
          <span className="mt-3 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-blue-100">
            {data!.openCreditCustomerCount} cliente{data!.openCreditCustomerCount > 1 ? 's' : ''}
          </span>
        )}
      </StatCard>

      {/* Ação rápida */}
      <Button
        className="w-full h-12 rounded-xl text-base font-semibold"
        size="lg"
        onClick={() => navigate('/sales/new')}
      >
        Registrar venda
      </Button>
    </div>
  )
}
