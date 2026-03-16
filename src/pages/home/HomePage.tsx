import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, TrendingUp, Package, Users, Settings } from 'lucide-react'
import { useReports } from '@/application/hooks/useReports'
import { useSettingsStore } from '@/application/stores/settingsStore'
import { centsToBRL } from '@/domain/formatters/currency'
import { Card, CardContent } from '@/components/ui/card'
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
    <div className="space-y-4 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h1 className="text-xl font-bold">{businessName}</h1>
        </div>
        <button onClick={() => navigate('/settings')} className="rounded-full p-2 hover:bg-gray-100">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Alertas */}
      {!loading && data && (
        <>
          {data.lowStockProducts.length > 0 && (
            <button
              onClick={() => navigate('/stock')}
              className="flex w-full items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-left"
            >
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                {data.lowStockProducts.length} produto{data.lowStockProducts.length > 1 ? 's' : ''} com estoque baixo
              </span>
            </button>
          )}
          {data.nearExpiryProducts.length > 0 && (
            <button
              onClick={() => navigate('/stock')}
              className="flex w-full items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-left"
            >
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                {data.nearExpiryProducts.length} produto{data.nearExpiryProducts.length > 1 ? 's' : ''} próximo{data.nearExpiryProducts.length > 1 ? 's' : ''} ao vencimento
              </span>
            </button>
          )}
        </>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          icon={<Package className="h-5 w-5 text-primary" />}
          label="Valor em estoque"
          value={loading ? null : centsToBRL(data?.stockValue ?? 0)}
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          label="Vendas hoje"
          value={loading ? null : centsToBRL(data?.cashSalesTotal ?? 0)}
        />
      </div>

      <button onClick={() => navigate('/credit')} className="w-full text-left">
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-700">Fiado em aberto</p>
                {loading
                  ? <Skeleton className="mt-1 h-6 w-24" />
                  : <p className="text-lg font-bold text-blue-800">{centsToBRL(data?.openCreditTotal ?? 0)}</p>
                }
              </div>
            </div>
            {!loading && (data?.openCreditCustomerCount ?? 0) > 0 && (
              <span className="rounded-full bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-800">
                {data!.openCreditCustomerCount} cliente{data!.openCreditCustomerCount > 1 ? 's' : ''}
              </span>
            )}
          </CardContent>
        </Card>
      </button>

      {/* Ação rápida */}
      <Button className="w-full" size="lg" onClick={() => navigate('/sales/new')}>
        Registrar venda
      </Button>
    </div>
  )
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        {value === null
          ? <Skeleton className="mt-2 h-7 w-3/4" />
          : <p className="mt-1 text-xl font-bold">{value}</p>
        }
      </CardContent>
    </Card>
  )
}
