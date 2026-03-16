import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    <div className="space-y-5 px-4 pt-6 pb-8">
      <h1 className="text-xl font-bold">Relatórios</h1>

      {/* Valor em estoque */}
      <section className="rounded-xl border border-border bg-white p-4 space-y-1">
        <p className="text-sm text-muted-foreground">Valor total em estoque</p>
        {loading
          ? <Skeleton className="h-8 w-36" />
          : <p className="text-2xl font-bold">{centsToBRL(data?.stockValue ?? 0)}</p>
        }
      </section>

      {/* Vendas à vista */}
      <section className="rounded-xl border border-border bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Vendas à vista</p>
          <div className="flex rounded-lg overflow-hidden border border-border text-xs">
            {(Object.keys(periodLabels) as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 transition-colors ${period === p ? 'bg-primary text-white' : 'bg-white text-muted-foreground hover:bg-gray-50'}`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>
        {loading
          ? <Skeleton className="h-8 w-32" />
          : <p className="text-2xl font-bold text-green-700">{centsToBRL(data?.cashSalesTotal ?? 0)}</p>
        }
      </section>

      {/* Fiado em aberto */}
      <button
        onClick={() => navigate('/credit')}
        className="w-full rounded-xl border border-blue-200 bg-blue-50 p-4 text-left space-y-1"
      >
        <p className="font-semibold text-blue-800">Fiado em aberto</p>
        {loading
          ? <Skeleton className="h-8 w-32" />
          : <p className="text-2xl font-bold text-blue-700">{centsToBRL(data?.openCreditTotal ?? 0)}</p>
        }
        {!loading && (data?.openCreditCustomerCount ?? 0) > 0 && (
          <p className="text-sm text-blue-600">{data!.openCreditCustomerCount} clientes</p>
        )}
      </button>

      {/* Estoque baixo */}
      {!loading && (data?.lowStockProducts.length ?? 0) > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="font-semibold text-amber-800">Estoque baixo</p>
          {data!.lowStockProducts.map(p => (
            <button
              key={p.id}
              onClick={() => navigate(`/stock/${p.id}`)}
              className="flex w-full items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
            >
              <span>{p.name}</span>
              <span className="text-amber-600 font-medium">Ver</span>
            </button>
          ))}
        </section>
      )}

      {/* Próximos ao vencimento */}
      {!loading && (data?.nearExpiryProducts.length ?? 0) > 0 && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
          <p className="font-semibold text-red-800">Próximos ao vencimento</p>
          {data!.nearExpiryProducts.map(p => (
            <button
              key={p.id}
              onClick={() => navigate(`/stock/${p.id}`)}
              className="flex w-full items-center justify-between rounded-lg border border-red-200 bg-white px-3 py-2 text-sm"
            >
              <span>{p.name}</span>
              <span className="text-red-600 font-medium">
                {p.expirationDate ? formatExpiryLabel(p.expirationDate) : ''}
              </span>
            </button>
          ))}
        </section>
      )}
    </div>
  )
}
