import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useReports, type Period } from '@/application/hooks/useReports'
import { centsToBRL } from '@/domain/formatters/currency'
import { formatExpiryLabel } from '@/domain/formatters/date'
import { Skeleton } from '@/components/ui/skeleton'

const periodLabels: Record<Period, string> = {
  today: 'Hoje',
  week: 'Semana',
  month: 'Mês',
}

export function ReportsPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>('today')
  const { data, loading, load } = useReports()

  useEffect(() => { load(period) }, [load, period])

  return (
    <div className="space-y-4 px-5 pt-8 pb-8">
      <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>

      {/* Valor em estoque */}
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <p className="text-xs font-medium text-muted-foreground mb-3">Valor total em estoque</p>
        {loading
          ? <Skeleton className="h-8 w-36" />
          : <p className="text-3xl font-bold text-foreground leading-none tracking-tight">{centsToBRL(data?.stockValue ?? 0)}</p>
        }
      </div>

      {/* Total de vendas */}
      <div className="rounded-2xl bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-[15px]">Total de vendas</p>
          <div className="flex rounded-xl bg-muted p-0.5 gap-0.5">
            {(Object.keys(periodLabels) as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                  period === p
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>
        {loading
          ? <Skeleton className="h-8 w-32" />
          : <p className="text-3xl font-bold text-emerald-700 leading-none tracking-tight">{centsToBRL(data?.allSalesTotal ?? 0)}</p>
        }
        {/* Breakdown à vista / fiado */}
        {!loading && (data?.allSalesTotal ?? 0) > 0 && (
          <div className="flex gap-3 pt-1 border-t border-border/50">
            <div className="flex-1 rounded-xl bg-muted/60 px-3 py-2.5">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">À vista</p>
              <p className="text-sm font-bold text-green-700">{centsToBRL(data?.cashSalesTotal ?? 0)}</p>
            </div>
            <div className="flex-1 rounded-xl bg-muted/60 px-3 py-2.5">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Fiado vendido</p>
              <p className="text-sm font-bold text-blue-700">{centsToBRL(data?.creditSalesTotal ?? 0)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Fiado em aberto */}
      <button
        onClick={() => navigate('/customers')}
        className="w-full rounded-2xl bg-[#1e3a8a] p-5 text-left transition-opacity active:opacity-90"
      >
        <p className="text-sm font-medium text-blue-200 mb-3">Fiado em aberto</p>
        {loading
          ? <Skeleton className="h-8 w-32 bg-white/20" />
          : <p className="text-3xl font-bold text-white leading-none tracking-tight">{centsToBRL(data?.openCreditTotal ?? 0)}</p>
        }
        {!loading && (data?.openCreditCustomerCount ?? 0) > 0 && (
          <p className="text-xs text-blue-300 mt-2">{data!.openCreditCustomerCount} clientes</p>
        )}
      </button>

      {/* Estoque baixo */}
      {!loading && (data?.lowStockProducts.length ?? 0) > 0 && (
        <div className="rounded-2xl border-l-[3px] border-amber-400 bg-amber-50 p-4 space-y-2">
          <p className="font-semibold text-sm text-amber-900">Estoque baixo</p>
          {data!.lowStockProducts.map(p => (
            <button
              key={p.id}
              onClick={() => navigate(`/stock/${p.id}`)}
              className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2.5 text-sm shadow-sm"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-amber-600 font-semibold text-xs">Ver →</span>
            </button>
          ))}
        </div>
      )}

      {/* Próximos ao vencimento */}
      {!loading && (data?.nearExpiryProducts.length ?? 0) > 0 && (
        <div className="rounded-2xl border-l-[3px] border-red-400 bg-red-50 p-4 space-y-2">
          <p className="font-semibold text-sm text-red-900">Próximos ao vencimento</p>
          {data!.nearExpiryProducts.map(p => (
            <button
              key={p.id}
              onClick={() => navigate(`/stock/${p.id}`)}
              className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2.5 text-sm shadow-sm"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-red-600 font-semibold text-xs">
                {p.expirationDate ? formatExpiryLabel(p.expirationDate) : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
