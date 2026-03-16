import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/infrastructure/supabase/client'
import { ProductRepository } from '@/infrastructure/supabase/ProductRepository'
import { useStock } from '@/application/hooks/useStock'
import { useProducts } from '@/application/hooks/useProducts'
import { useAuthStore } from '@/application/stores/authStore'
import { useSettingsStore } from '@/application/stores/settingsStore'
import { centsToBRL } from '@/domain/formatters/currency'
import { formatDate } from '@/domain/formatters/date'
import { StockBadge } from '@/components/stock/StockBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Product } from '@/domain/types'

const productRepo = new ProductRepository(supabase)

const restockSchema = z.object({
  quantity: z.coerce.number().int().min(1, 'Mínimo 1 unidade'),
})
type RestockForm = z.output<typeof restockSchema>

const adjustSchema = z.object({
  quantity: z.coerce.number().int().min(0, 'Mínimo 0'),
})
type AdjustForm = z.output<typeof adjustSchema>

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { lowStockThreshold } = useSettingsStore()
  const { getEntry, replenish, adjustQuantity, removeEntry } = useStock()
  const { remove } = useProducts()
  const [product, setProduct] = useState<Product | null>(null)
  const [currentQty, setCurrentQty] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submittingRestock, setSubmittingRestock] = useState(false)
  const [submittingAdjust, setSubmittingAdjust] = useState(false)
  const [submittingReset, setSubmittingReset] = useState(false)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const restockForm = useForm<RestockForm>({ resolver: zodResolver(restockSchema) as any, defaultValues: { quantity: 1 } })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adjustForm = useForm<AdjustForm>({ resolver: zodResolver(adjustSchema) as any, defaultValues: { quantity: 0 } })

  useEffect(() => {
    if (!user || !productId) return
    Promise.all([
      productRepo.findById(user.id, productId),
      getEntry(productId),
    ]).then(([p, entry]) => {
      setProduct(p)
      const qty = entry?.quantity ?? 0
      setCurrentQty(qty)
      adjustForm.reset({ quantity: qty })
      setLoading(false)
    })
  }, [user, productId, getEntry, adjustForm])

  async function onRestock(values: RestockForm) {
    if (!productId) return
    setSubmittingRestock(true)
    try {
      const updated = await replenish(productId, values.quantity)
      setCurrentQty(updated.quantity)
      adjustForm.reset({ quantity: updated.quantity })
      restockForm.reset()
      toast.success(`Estoque atualizado: ${updated.quantity} unidades`)
    } catch {
      toast.error('Erro ao repor estoque')
    } finally {
      setSubmittingRestock(false)
    }
  }

  async function onAdjust(values: AdjustForm) {
    if (!productId) return
    setSubmittingAdjust(true)
    try {
      const updated = await adjustQuantity(productId, values.quantity)
      setCurrentQty(updated.quantity)
      toast.success(`Estoque corrigido para ${updated.quantity} unidades`)
    } catch {
      toast.error('Erro ao corrigir estoque')
    } finally {
      setSubmittingAdjust(false)
    }
  }

  async function handleResetStock() {
    if (!productId) return
    setSubmittingReset(true)
    try {
      await removeEntry(productId)
      setCurrentQty(0)
      adjustForm.reset({ quantity: 0 })
      toast.success('Estoque zerado')
    } catch {
      toast.error('Erro ao zerar estoque')
    } finally {
      setSubmittingReset(false)
    }
  }

  async function handleDeleteProduct() {
    if (!productId) return
    setSubmittingDelete(true)
    try {
      await remove(productId)
      toast.success('Produto excluído')
      navigate('/stock')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir produto')
      setSubmittingDelete(false)
    }
  }

  if (loading) return <div className="space-y-4 px-4 pt-6"><Skeleton className="h-32 w-full rounded-xl" /></div>
  if (!product) return <div className="px-4 pt-6 text-muted-foreground">Produto não encontrado</div>

  return (
    <div className="space-y-4 px-4 pt-6 pb-8">
      <button onClick={() => navigate('/stock')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Estoque
      </button>

      {/* Info do produto */}
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

      {/* Repor estoque */}
      <div className="rounded-xl border border-border bg-white p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          Repor estoque
        </h2>
        <Form {...restockForm}>
          <form onSubmit={restockForm.handleSubmit(onRestock)} className="flex gap-2">
            <FormField
              control={restockForm.control}
              name="quantity"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" inputMode="numeric" onFocus={(e) => e.target.select()} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end">
              <Button type="submit" disabled={submittingRestock}>
                {submittingRestock ? 'Salvando...' : 'Repor'}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Corrigir estoque */}
      <div className="rounded-xl border border-border bg-white p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Pencil className="h-4 w-4" />
          Corrigir estoque
        </h2>
        <p className="text-xs text-muted-foreground">Define a quantidade exata atual em estoque.</p>
        <Form {...adjustForm}>
          <form onSubmit={adjustForm.handleSubmit(onAdjust)} className="flex gap-2">
            <FormField
              control={adjustForm.control}
              name="quantity"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Nova quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" inputMode="numeric" onFocus={(e) => e.target.select()} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end">
              <Button type="submit" variant="outline" disabled={submittingAdjust}>
                {submittingAdjust ? 'Salvando...' : 'Corrigir'}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Ações destrutivas */}
      <div className="rounded-xl border border-destructive/30 bg-white p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2 text-destructive">
          <Trash2 className="h-4 w-4" />
          Ações destrutivas
        </h2>

        <AlertDialog>
          <AlertDialogTrigger
            render={<Button variant="outline" className="w-full border-destructive/40 text-destructive hover:bg-destructive/5" disabled={submittingReset} />}
          >
            Zerar estoque
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Zerar estoque?</AlertDialogTitle>
              <AlertDialogDescription>
                A entrada de estoque de <strong>{product.name}</strong> será removida. O histórico de movimentações é mantido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleResetStock}
              >
                Zerar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger
            render={<Button variant="destructive" className="w-full" disabled={submittingDelete} />}
          >
            Excluir produto
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>{product.name}</strong> será excluído permanentemente junto com seu estoque. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteProduct}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
