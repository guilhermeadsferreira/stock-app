import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, ScanLine } from 'lucide-react'
import { useProducts } from '@/application/hooks/useProducts'
import { useStock } from '@/application/hooks/useStock'
import { useSettingsStore } from '@/application/stores/settingsStore'
import { centsToBRL } from '@/domain/formatters/currency'
import { isLowStock, isNearExpiry, isExpired } from '@/domain/rules/stock.rules'
import { StockBadge } from '@/components/stock/StockBadge'
import { ExpiryBadge } from '@/components/stock/ExpiryBadge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { Product } from '@/domain/types'
import { cn } from '@/lib/utils'

type StockFilter = 'all' | 'low' | 'expiring' | 'expired'

export function StockPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const { products, loading, load } = useProducts()
  const { entries, loadEntries } = useStock()
  const { lowStockThreshold, expirationAlertDays } = useSettingsStore()

  const activeFilter = (searchParams.get('filter') as StockFilter) ?? 'all'
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null)

  useEffect(() => {
    load()
    loadEntries()
  }, [load, loadEntries])

  const entryMap = new Map(entries.map(e => [e.productId, e.quantity]))

  const filtered = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))
    if (!matchesSearch) return false

    if (activeFilter === 'low') return isLowStock(entryMap.get(p.id) ?? 0, lowStockThreshold)
    if (activeFilter === 'expiring') return isNearExpiry(p.expirationDate, expirationAlertDays)
    if (activeFilter === 'expired') return isExpired(p.expirationDate)
    return true
  })

  function setFilter(filter: StockFilter) {
    if (filter === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ filter })
    }
  }

  const chips: { key: StockFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'low', label: 'Estoque baixo' },
    { key: 'expiring', label: 'A vencer' },
    { key: 'expired', label: 'Vencidos' },
  ]

  return (
    <div className="space-y-4 px-5 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/stock/scan')} className="rounded-xl gap-1.5">
            <ScanLine className="h-3.5 w-3.5" strokeWidth={2.5} />
            Scan
          </Button>
          <Button size="sm" onClick={() => navigate('/stock/new')} className="rounded-xl gap-1.5">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Novo
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.75} />
        <Input
          placeholder="Buscar produto ou código..."
          className="pl-10 rounded-xl bg-card border-border/60"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        {chips.map(chip => (
          <button
            key={chip.key}
            onClick={() => setFilter(chip.key)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
              activeFilter === chip.key
                ? 'bg-foreground text-background'
                : 'bg-card text-muted-foreground border border-border/60',
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[68px] w-full rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">
          {search || activeFilter !== 'all' ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado ainda'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(product => (
            <button
              key={product.id}
              onClick={() => {
                if ((entryMap.get(product.id) ?? 0) === 0) {
                  setPendingProduct(product)
                } else {
                  navigate(`/stock/${product.id}`)
                }
              }}
              className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3.5 text-left shadow-sm active:scale-[0.99] active:shadow-none transition-all duration-150"
            >
              <div>
                <p className="font-semibold text-[15px]">{product.name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{centsToBRL(product.salePrice)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <ExpiryBadge
                  expirationDate={product.expirationDate}
                  alertDays={expirationAlertDays}
                />
                <StockBadge
                  quantity={entryMap.get(product.id) ?? 0}
                  threshold={lowStockThreshold}
                />
              </div>
            </button>
          ))}
        </div>
      )}

      <AlertDialog open={pendingProduct !== null} onOpenChange={open => { if (!open) setPendingProduct(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Produto sem estoque</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{pendingProduct?.name}</strong> está sem estoque. Deseja adicionar agora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingProduct(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { navigate(`/stock/${pendingProduct!.id}`); setPendingProduct(null) }}>
              Adicionar estoque
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
