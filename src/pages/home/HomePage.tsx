import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, TrendingUp, Package, Users, Settings } from 'lucide-react'
import { useReports } from '@/application/hooks/useReports'
import { useSettingsStore } from '@/application/stores/settingsStore'
import { centsToBRL } from '@/domain/formatters/currency'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

export function HomePage() {
  const navigate = useNavigate()
  const { businessName } = useSettingsStore()
  const { data, loading, load } = useReports()

  useEffect(() => { load('today') }, [load])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="px-5 pt-8 pb-6 space-y-5">
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

      {/* Alertas */}
      {!loading && data && (
        <div className="space-y-2">
          {data.lowStockProducts.length > 0 && (
            <button
              onClick={() => navigate('/stock')}
              className="flex w-full items-center gap-3 rounded-2xl border-l-[3px] border-amber-400 bg-amber-50 px-4 py-3 text-left transition-colors active:bg-amber-100"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">
                {data.lowStockProducts.length} produto{data.lowStockProducts.length > 1 ? 's' : ''} com estoque baixo
              </span>
            </button>
          )}
          {data.nearExpiryProducts.length > 0 && (
            <button
              onClick={() => navigate('/stock')}
              className="flex w-full items-center gap-3 rounded-2xl border-l-[3px] border-red-400 bg-red-50 px-4 py-3 text-left transition-colors active:bg-red-100"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                {data.nearExpiryProducts.length} produto{data.nearExpiryProducts.length > 1 ? 's' : ''} próximo{data.nearExpiryProducts.length > 1 ? 's' : ''} ao vencimento
              </span>
            </button>
          )}
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          icon={<Package className="h-4 w-4 text-primary" strokeWidth={1.75} />}
          label="Valor em estoque"
          value={loading ? null : centsToBRL(data?.stockValue ?? 0)}
        />
        <SummaryCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" strokeWidth={1.75} />}
          label="Vendas hoje"
          value={loading ? null : centsToBRL(data?.cashSalesTotal ?? 0)}
        />
      </div>

      {/* Card de fiado */}
      <button onClick={() => navigate('/credit')} className="w-full text-left">
        <div className="rounded-2xl bg-[#1e3a8a] p-5 transition-opacity active:opacity-90">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-300" strokeWidth={1.75} />
              <span className="text-sm text-blue-200 font-medium">Fiado em aberto</span>
            </div>
            {!loading && (data?.openCreditCustomerCount ?? 0) > 0 && (
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-blue-100">
                {data!.openCreditCustomerCount} cliente{data!.openCreditCustomerCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {loading
            ? <Skeleton className="h-8 w-32 bg-white/20" />
            : <p className="text-3xl font-bold text-white leading-none tracking-tight">{centsToBRL(data?.openCreditTotal ?? 0)}</p>
          }
        </div>
      </button>

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

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
        {icon}
        <p className="text-xs font-medium leading-tight">{label}</p>
      </div>
      {value === null
        ? <Skeleton className="h-7 w-3/4" />
        : <p className="text-2xl font-bold text-foreground leading-none tracking-tight">{value}</p>
      }
    </div>
  )
}
