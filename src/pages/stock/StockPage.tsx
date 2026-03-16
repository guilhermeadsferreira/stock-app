import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useProducts } from '@/application/hooks/useProducts'
import { useStock } from '@/application/hooks/useStock'
import { useSettingsStore } from '@/application/stores/settingsStore'
import { centsToBRL } from '@/domain/formatters/currency'
import { StockBadge } from '@/components/stock/StockBadge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function StockPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { products, loading, load } = useProducts()
  const { entries, loadEntries } = useStock()
  const { lowStockThreshold } = useSettingsStore()

  useEffect(() => {
    load()
    loadEntries()
  }, [load, loadEntries])

  const entryMap = new Map(entries.map(e => [e.productId, e.quantity]))

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search)),
  )

  return (
    <div className="space-y-4 px-5 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
        <Button size="sm" onClick={() => navigate('/stock/new')} className="rounded-xl gap-1.5">
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Novo
        </Button>
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

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[68px] w-full rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">
          {search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado ainda'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(product => (
            <button
              key={product.id}
              onClick={() => navigate(`/stock/${product.id}`)}
              className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3.5 text-left shadow-sm active:scale-[0.99] active:shadow-none transition-all duration-150"
            >
              <div>
                <p className="font-semibold text-[15px]">{product.name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{centsToBRL(product.salePrice)}</p>
              </div>
              <StockBadge
                quantity={entryMap.get(product.id) ?? 0}
                threshold={lowStockThreshold}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
