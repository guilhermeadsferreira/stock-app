import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/infrastructure/supabase/client'
import { ProductRepository } from '@/infrastructure/supabase/ProductRepository'
import { useStock } from '@/application/hooks/useStock'
import { useAuthStore } from '@/application/stores/authStore'
import { useSettingsStore } from '@/application/stores/settingsStore'
import { centsToBRL } from '@/domain/formatters/currency'
import { formatDate } from '@/domain/formatters/date'
import { StockBadge } from '@/components/stock/StockBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'
import type { Product } from '@/domain/types'

const productRepo = new ProductRepository(supabase)

const restockSchema = z.object({
  quantity: z.coerce.number().int().min(1, 'Mínimo 1 unidade'),
})
type RestockForm = z.output<typeof restockSchema>

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { lowStockThreshold } = useSettingsStore()
  const { getEntry, replenish } = useStock()
  const [product, setProduct] = useState<Product | null>(null)
  const [currentQty, setCurrentQty] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<RestockForm>({ resolver: zodResolver(restockSchema) as any, defaultValues: { quantity: 1 } })

  useEffect(() => {
    if (!user || !productId) return
    Promise.all([
      productRepo.findById(user.id, productId),
      getEntry(productId),
    ]).then(([p, entry]) => {
      setProduct(p)
      setCurrentQty(entry?.quantity ?? 0)
      setLoading(false)
    })
  }, [user, productId, getEntry])

  async function onRestock(values: RestockForm) {
    if (!productId) return
    setSubmitting(true)
    try {
      const updated = await replenish(productId, values.quantity)
      setCurrentQty(updated.quantity)
      form.reset()
      toast.success(`Estoque atualizado: ${updated.quantity} unidades`)
    } catch {
      toast.error('Erro ao repor estoque')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="space-y-4 px-4 pt-6"><Skeleton className="h-32 w-full rounded-xl" /></div>
  if (!product) return <div className="px-4 pt-6 text-muted-foreground">Produto não encontrado</div>

  return (
    <div className="space-y-4 px-4 pt-6">
      <button onClick={() => navigate('/stock')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Estoque
      </button>

      <div className="rounded-xl border border-border bg-white p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{product.name}</h1>
            {product.barcode && (
              <p className="text-sm text-muted-foreground font-mono">{product.barcode}</p>
            )}
          </div>
          <StockBadge quantity={currentQty} threshold={lowStockThreshold} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Preço de venda</p>
            <p className="font-semibold">{centsToBRL(product.salePrice)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Custo</p>
            <p className="font-semibold">{centsToBRL(product.purchasePrice)}</p>
          </div>
          {product.expirationDate && (
            <div>
              <p className="text-muted-foreground">Validade</p>
              <p className="font-semibold">{formatDate(product.expirationDate)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          Repor estoque
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onRestock)} className="flex gap-2">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Repor'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
