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
import { calcMargin, calcMarginValue } from '@/domain/rules/sale.rules'
import { useProducts } from '@/application/hooks/useProducts'
import { useAuthStore } from '@/application/stores/authStore'
import { centsToBRL, centsToFloat, floatToCents } from '@/domain/formatters/currency'
import { formatDate } from '@/domain/formatters/date'
import { StockBadge } from '@/components/stock/StockBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

const priceSchema = z.object({
  salePrice: z.coerce.number().min(0.01, 'Preço inválido'),
  purchasePrice: z.coerce.number().min(0.01, 'Custo inválido'),
})
type PriceForm = z.output<typeof priceSchema>

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { currentBusiness } = useAuthStore()
  const lowStockThreshold = currentBusiness?.lowStockThreshold ?? 5
  const { getEntry, replenish, adjustQuantity, removeEntry } = useStock()
  const { remove, update } = useProducts()
  const [product, setProduct] = useState<Product | null>(null)
  const [currentQty, setCurrentQty] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submittingRestock, setSubmittingRestock] = useState(false)
  const [submittingAdjust, setSubmittingAdjust] = useState(false)
  const [submittingReset, setSubmittingReset] = useState(false)
  const [submittingDelete, setSubmittingDelete] = useState(false)
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [submittingPrice, setSubmittingPrice] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const restockForm = useForm<RestockForm>({ resolver: zodResolver(restockSchema) as any, defaultValues: { quantity: 1 } })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adjustForm = useForm<AdjustForm>({ resolver: zodResolver(adjustSchema) as any, defaultValues: { quantity: 0 } })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceForm = useForm<PriceForm>({ resolver: zodResolver(priceSchema) as any })

  useEffect(() => {
    if (!currentBusiness || !productId) return
    Promise.all([
      productRepo.findById(currentBusiness.id, productId),
      getEntry(productId),
    ]).then(([p, entry]) => {
      setProduct(p)
      const qty = entry?.quantity ?? 0
      setCurrentQty(qty)
      adjustForm.reset({ quantity: qty })
      setLoading(false)
    })
  }, [currentBusiness, productId, getEntry, adjustForm])

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

  function openPriceDialog() {
    if (!product) return
    priceForm.reset({
      salePrice: centsToFloat(product.salePrice),
      purchasePrice: centsToFloat(product.purchasePrice),
    })
    setPriceDialogOpen(true)
  }

  async function onEditPrice(values: PriceForm) {
    if (!productId) return
    setSubmittingPrice(true)
    try {
      const updated = await update(productId, {
        salePrice: floatToCents(values.salePrice),
        purchasePrice: floatToCents(values.purchasePrice),
      })
      setProduct(updated)
      setPriceDialogOpen(false)
      toast.success('Preços atualizados!')
    } catch {
      toast.error('Erro ao atualizar preços')
    } finally {
      setSubmittingPrice(false)
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
        Produtos
      </button>

      {/* Info do produto */}
      <div className="rounded-xl border border-border bg-white p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">{product.name}</h1>
            {product.brand && (
              <p className="text-sm text-muted-foreground">{product.brand}</p>
            )}
            {product.barcode && (
              <p className="text-sm text-muted-foreground font-mono">{product.barcode}</p>
            )}
          </div>
          <div className="shrink-0">
            <StockBadge quantity={currentQty} threshold={lowStockThreshold} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Preço de venda</p>
            <p className="font-semibold">{centsToBRL(product.salePrice)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Custo</p>
            <p className="font-semibold">{centsToBRL(product.purchasePrice)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Margem de lucro</p>
            {(() => {
              const marginValue = calcMarginValue(product.salePrice, product.purchasePrice)
              const marginPct = calcMargin(product.salePrice, product.purchasePrice)
              const isNegative = marginValue < 0
              return (
                <p className={`font-semibold ${isNegative ? 'text-destructive' : 'text-emerald-600'}`}>
                  {centsToBRL(marginValue)}
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    ({marginPct.toFixed(1)}%)
                  </span>
                </p>
              )
            })()}
          </div>
          {product.maxDiscountPct !== null && (
            <div>
              <p className="text-muted-foreground">Desc. máximo</p>
              <p className="font-semibold">{product.maxDiscountPct}%</p>
            </div>
          )}
          {product.expirationDate && (
            <div>
              <p className="text-muted-foreground">Validade</p>
              <p className="font-semibold">{formatDate(product.expirationDate)}</p>
            </div>
          )}
        </div>
        {product.notes && (
          <p className="text-sm text-muted-foreground italic">{product.notes}</p>
        )}
        <Button variant="outline" size="sm" className="w-full" onClick={openPriceDialog}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Editar preços
        </Button>
      </div>

      {/* Ações de estoque: repor + corrigir lado a lado */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-white p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <Package className="h-4 w-4" />
            Repor estoque
          </h2>
          <Form {...restockForm}>
            <form onSubmit={restockForm.handleSubmit(onRestock)} className="space-y-2">
              <FormField
                control={restockForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qtd a adicionar</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" inputMode="numeric" onFocus={(e) => e.target.select()} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" size="sm" disabled={submittingRestock}>
                {submittingRestock ? 'Salvando...' : 'Repor'}
              </Button>
            </form>
          </Form>
        </div>

        <div className="rounded-xl border border-border bg-white p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <Pencil className="h-4 w-4" />
            Corrigir estoque
          </h2>
          <Form {...adjustForm}>
            <form onSubmit={adjustForm.handleSubmit(onAdjust)} className="space-y-2">
              <FormField
                control={adjustForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova quantidade</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" inputMode="numeric" onFocus={(e) => e.target.select()} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="outline" className="w-full" size="sm" disabled={submittingAdjust}>
                {submittingAdjust ? 'Salvando...' : 'Corrigir'}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      {/* Ações destrutivas */}
      <div className="rounded-xl border border-destructive/30 bg-white p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2 text-sm text-destructive">
          <Trash2 className="h-4 w-4" />
          Ações destrutivas
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="outline" size="sm" className="w-full border-destructive/40 text-destructive hover:bg-destructive/5" disabled={submittingReset} />}
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
              render={<Button variant="destructive" size="sm" className="w-full" disabled={submittingDelete} />}
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
      <Dialog open={priceDialogOpen} onOpenChange={open => { setPriceDialogOpen(open); if (!open) priceForm.reset() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar preços</DialogTitle>
          </DialogHeader>
          <Form {...priceForm}>
            <form onSubmit={priceForm.handleSubmit(onEditPrice)} className="space-y-4 pt-2">
              <FormField
                control={priceForm.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de venda (R$)</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={priceForm.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo (R$)</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={submittingPrice}>
                {submittingPrice ? 'Salvando...' : 'Salvar preços'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
