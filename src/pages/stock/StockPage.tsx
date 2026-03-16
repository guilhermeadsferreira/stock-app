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
    <div className="space-y-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Estoque</h1>
        <Button size="sm" onClick={() => navigate('/stock/new')}>
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar produto ou código..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado ainda'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(product => (
            <button
              key={product.id}
              onClick={() => navigate(`/stock/${product.id}`)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-white p-4 text-left hover:bg-gray-50 active:scale-[0.98] transition-transform"
            >
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">{centsToBRL(product.salePrice)}</p>
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
