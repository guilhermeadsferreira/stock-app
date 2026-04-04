import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReports, type Period } from '@/application/hooks/useReports'
import { centsToBRL } from '@/domain/formatters/currency'
import { formatExpiryLabel } from '@/domain/formatters/date'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import { FilterChips } from '@/components/ui/filter-chips'
import { PageHeader } from '@/components/ui/page-header'

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
    <div className="space-y-4">
      <PageHeader title="Relatórios" />

      <div className="px-5 pb-8 md:px-8 space-y-4">
        {/* Valor em estoque */}
        <StatCard
          label="Valor total em estoque"
          value={loading ? null : centsToBRL(data?.stockValue ?? 0)}
        />

        {/* Total de vendas */}
        <div className="rounded-2xl bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-[15px]">Total de vendas</p>
            <FilterChips
              options={Object.entries(periodLabels).map(([value, label]) => ({ value: value as Period, label }))}
              value={period}
              onChange={setPeriod}
              variant="compact"
            />
          </div>
          {loading
            ? <Skeleton className="h-8 w-32" />
            : <p className="text-3xl font-bold text-success leading-none tracking-tight">{centsToBRL(data?.allSalesTotal ?? 0)}</p>
          }
          {/* Breakdown à vista / fiado */}
          {!loading && (data?.allSalesTotal ?? 0) > 0 && (
            <div className="flex gap-3 pt-1 border-t border-border/50">
              <div className="flex-1 rounded-xl bg-muted/60 px-3 py-2.5">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">À vista</p>
                <p className="text-sm font-bold text-payment-cash">{centsToBRL(data?.cashSalesTotal ?? 0)}</p>
              </div>
              <div className="flex-1 rounded-xl bg-muted/60 px-3 py-2.5">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Fiado vendido</p>
                <p className="text-sm font-bold text-credit">{centsToBRL(data?.creditSalesTotal ?? 0)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Fiado em aberto */}
        <StatCard
          variant="credit"
          label="Fiado em aberto"
          value={loading ? null : centsToBRL(data?.openCreditTotal ?? 0)}
          onClick={() => navigate('/customers')}
        >
          {!loading && (data?.openCreditCustomerCount ?? 0) > 0 && (
            <p className="text-xs text-blue-300 mt-2">{data!.openCreditCustomerCount} clientes</p>
          )}
        </StatCard>

        {/* Estoque baixo */}
        {!loading && (data?.lowStockProducts.length ?? 0) > 0 && (
          <div className="rounded-2xl border-l-[3px] border-warning bg-warning-surface p-4 space-y-2">
            <p className="font-semibold text-sm text-foreground">Estoque baixo</p>
            {data!.lowStockProducts.map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/stock/${p.id}`)}
                className="flex w-full items-center justify-between rounded-xl bg-card px-3 py-2.5 text-sm shadow-sm"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-warning font-semibold text-xs">Ver →</span>
              </button>
            ))}
          </div>
        )}

        {/* Próximos ao vencimento */}
        {!loading && (data?.nearExpiryProducts.length ?? 0) > 0 && (
          <div className="rounded-2xl border-l-[3px] border-danger bg-danger-surface p-4 space-y-2">
            <p className="font-semibold text-sm text-foreground">Próximos ao vencimento</p>
            {data!.nearExpiryProducts.map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/stock/${p.id}`)}
                className="flex w-full items-center justify-between rounded-xl bg-card px-3 py-2.5 text-sm shadow-sm"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-danger font-semibold text-xs">
                  {p.expirationDate ? formatExpiryLabel(p.expirationDate) : ''}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
