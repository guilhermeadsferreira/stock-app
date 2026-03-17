import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ScanLine, Search, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useProducts } from '@/application/hooks/useProducts'
import { useStock } from '@/application/hooks/useStock'
import { useCustomers } from '@/application/hooks/useCustomers'
import { useSales } from '@/application/hooks/useSales'
import { centsToBRL, centsToFloat, floatToCents } from '@/domain/formatters/currency'
import { BarcodeScanner } from '@/components/stock/BarcodeScanner'
import { StockBadge } from '@/components/stock/StockBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useSettingsStore } from '@/application/stores/settingsStore'
import type { Product, Customer } from '@/domain/types'

type Step = 'product' | 'quantity' | 'payment' | 'customer' | 'confirm'

const quantitySchema = z.object({
  quantity: z.coerce.number().int().min(1, 'Mínimo 1'),
  unitPrice: z.coerce.number().min(0.01, 'Preço inválido'),
})
type QuantityForm = z.output<typeof quantitySchema>

export function NewSalePage() {
  const navigate = useNavigate()
  const { lowStockThreshold } = useSettingsStore()
  const { findByBarcode, products, load: loadProducts } = useProducts()
  const { getEntry } = useStock()
  const { customers, load: loadCustomers } = useCustomers()
  const { createSale } = useSales()

  const [step, setStep] = useState<Step>('product')
  const [scanning, setScanning] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [currentStock, setCurrentStock] = useState(0)
  const [paymentType, setPaymentType] = useState<'cash' | 'credit' | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [saleQty, setSaleQty] = useState(1)
  const [saleUnitPrice, setSaleUnitPrice] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<QuantityForm>({ resolver: zodResolver(quantitySchema) as any })

  async function selectProduct(product: Product) {
    const entry = await getEntry(product.id)
    setSelectedProduct(product)
    setCurrentStock(entry?.quantity ?? 0)
    form.reset({ quantity: 1, unitPrice: centsToFloat(product.salePrice) })
    setStep('quantity')
  }

  async function handleBarcodeResult(code: string) {
    setScanning(false)
    const product = await findByBarcode(code)
    if (product) {
      selectProduct(product)
    } else {
      toast.error('Produto não encontrado para este código')
    }
  }

  async function handleSearchProducts() {
    await loadProducts({ search: searchText })
  }

  function onQuantitySubmit(values: QuantityForm) {
    setSaleQty(values.quantity)
    setSaleUnitPrice(floatToCents(values.unitPrice))
    setStep('payment')
  }

  async function handlePaymentType(type: 'cash' | 'credit') {
    setPaymentType(type)
    if (type === 'cash') {
      setStep('confirm')
    } else {
      await loadCustomers()
      setStep('customer')
    }
  }

  async function handleConfirm() {
    if (!selectedProduct || !paymentType) return
    setSubmitting(true)
    try {
      await createSale({
        product: selectedProduct,
        quantity: saleQty,
        unitPrice: saleUnitPrice,
        paymentType,
        customerId: selectedCustomer?.id ?? null,
      })
      toast.success('Venda registrada!')
      navigate('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar venda')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 px-4 pt-6 pb-8">
      <button onClick={() => (step === 'product' ? navigate('/') : setStep('product'))} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {step === 'product' ? 'Início' : 'Voltar'}
      </button>

      {/* Step 1: Seleção de produto */}
      {step === 'product' && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Registrar venda</h1>
          {scanning ? (
            <BarcodeScanner onResult={handleBarcodeResult} onClose={() => setScanning(false)} />
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setScanning(true)}>
              <ScanLine className="mr-2 h-4 w-4" />
              Ler código de barras
            </Button>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Buscar produto pelo nome..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchProducts()}
            />
            <Button variant="outline" onClick={handleSearchProducts} size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => selectProduct(p)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-white p-3 text-left"
              >
                <span className="font-medium">{p.name}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Quantidade e preço */}
      {step === 'quantity' && selectedProduct && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Quantidade e preço</h1>
          <div className="flex items-center justify-between rounded-xl border border-border bg-white p-4">
            <div>
              <p className="font-semibold">{selectedProduct.name}</p>
              <p className="text-sm text-muted-foreground">{centsToBRL(selectedProduct.salePrice)}</p>
            </div>
            <StockBadge quantity={currentStock} threshold={lowStockThreshold} />
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onQuantitySubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max={currentStock} inputMode="numeric" onFocus={(e) => e.target.select()} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço unit. (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0.01" inputMode="decimal" onFocus={(e) => e.target.select()} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full" size="lg">Continuar</Button>
            </form>
          </Form>
        </div>
      )}

      {/* Step 3: Forma de pagamento */}
      {step === 'payment' && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Como vai pagar?</h1>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handlePaymentType('cash')}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-green-200 bg-green-50 p-6 text-green-800 hover:bg-green-100"
            >
              <span className="text-3xl">💵</span>
              <span className="font-semibold">À Vista</span>
            </button>
            <button
              onClick={() => handlePaymentType('credit')}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 text-blue-800 hover:bg-blue-100"
            >
              <span className="text-3xl">📒</span>
              <span className="font-semibold">Fiado</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Selecionar cliente (fiado) */}
      {step === 'customer' && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Selecionar cliente</h1>
          <Input
            placeholder="Buscar cliente..."
            onChange={e => loadCustomers(e.target.value)}
          />
          <div className="space-y-2">
            {customers.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedCustomer(c); setStep('confirm') }}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${selectedCustomer?.id === c.id ? 'border-primary bg-green-50' : 'border-border bg-white'}`}
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  {c.phone && <p className="text-sm text-muted-foreground">{c.phone}</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
          {selectedCustomer && (
            <Button className="w-full" onClick={() => setStep('confirm')}>Confirmar cliente</Button>
          )}
        </div>
      )}

      {/* Step 5: Confirmação */}
      {step === 'confirm' && selectedProduct && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Confirmar venda</h1>
          <div className="rounded-xl border border-border bg-white p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Produto</span>
              <span className="font-medium">{selectedProduct.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantidade</span>
              <span className="font-medium">{saleQty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço unit.</span>
              <span className="font-medium">{centsToBRL(saleUnitPrice)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold text-primary">{centsToBRL(saleQty * saleUnitPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pagamento</span>
              <span className={`font-medium ${paymentType === 'credit' ? 'text-blue-600' : 'text-green-600'}`}>
                {paymentType === 'cash' ? 'À vista' : 'Fiado'}
              </span>
            </div>
            {selectedCustomer && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{selectedCustomer.name}</span>
              </div>
            )}
          </div>
          <Button className="w-full" size="lg" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Registrando...' : 'Confirmar venda'}
          </Button>
        </div>
      )}
    </div>
  )
}
