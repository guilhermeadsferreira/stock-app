import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ScanLine, ChevronRight, UserPlus, Plus, ShoppingCart, Minus } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuthStore } from '@/application/stores/authStore'
import type { Product, Customer, CartItem, PaymentType } from '@/domain/types'

// Novo fluxo: carrinho → pagamento → cliente (se fiado) → confirmação
type Step = 'cart' | 'payment' | 'customer' | 'confirm'

const newCustomerSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().optional(),
})
type NewCustomerForm = z.output<typeof newCustomerSchema>

const itemSchema = z.object({
  quantity: z.coerce.number().int().min(1, 'Mínimo 1'),
  unitPrice: z.coerce.number().min(0.01, 'Preço inválido'),
})
type ItemForm = z.output<typeof itemSchema>

export function NewSalePage() {
  const navigate = useNavigate()
  const { currentBusiness } = useAuthStore()
  const lowStockThreshold = currentBusiness?.lowStockThreshold ?? 5
  const { findByBarcode, products, load: loadProducts } = useProducts()
  const { getEntry } = useStock()
  const { customers, load: loadCustomers, create: createCustomer } = useCustomers()
  const { createSale } = useSales()

  const [step, setStep] = useState<Step>('cart')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentType, setPaymentType] = useState<PaymentType | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Busca de produto
  const [scanning, setScanning] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [currentStock, setCurrentStock] = useState(0)

  // Customer step
  const [customerSearch, setCustomerSearch] = useState('')
  const [newCustomerOpen, setNewCustomerOpen] = useState(false)
  const [creatingCustomer, setCreatingCustomer] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemForm = useForm<ItemForm>({ resolver: zodResolver(itemSchema) as any })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customerForm = useForm<NewCustomerForm>({ resolver: zodResolver(newCustomerSchema) as any })

  // Debounce produto
  const productDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (step !== 'cart') return
    if (productDebounceRef.current) clearTimeout(productDebounceRef.current)
    productDebounceRef.current = setTimeout(() => {
      loadProducts({ search: searchText })
    }, 400)
    return () => { if (productDebounceRef.current) clearTimeout(productDebounceRef.current) }
  }, [searchText, loadProducts, step])

  // Debounce cliente
  const customerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (step !== 'customer') return
    if (customerDebounceRef.current) clearTimeout(customerDebounceRef.current)
    customerDebounceRef.current = setTimeout(() => {
      loadCustomers(customerSearch || undefined)
    }, 400)
    return () => { if (customerDebounceRef.current) clearTimeout(customerDebounceRef.current) }
  }, [customerSearch, loadCustomers, step])

  // ─── Navegação ──────────────────────────────────────────────────────────────

  function handleBack() {
    if (step === 'cart') {
      if (selectedProduct) { setSelectedProduct(null); return }
      navigate('/')
      return
    }
    if (step === 'payment') { setStep('cart'); return }
    if (step === 'customer') { setStep('payment'); return }
    if (step === 'confirm') {
      setStep(paymentType === 'credit' ? 'customer' : 'payment')
      return
    }
  }

  function backLabel() {
    if (step === 'cart' && selectedProduct) return 'Produtos'
    if (step === 'cart') return 'Início'
    return 'Voltar'
  }

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handleSelectProduct(product: Product) {
    const entry = await getEntry(product.id)
    setSelectedProduct(product)
    setCurrentStock(entry?.quantity ?? 0)
    itemForm.reset({ quantity: 1, unitPrice: centsToFloat(product.salePrice) })
  }

  async function handleBarcodeResult(code: string) {
    setScanning(false)
    const product = await findByBarcode(code)
    if (product) {
      handleSelectProduct(product)
    } else {
      toast.error('Produto não encontrado para este código')
    }
  }

  function onAddToCart(values: ItemForm) {
    if (!selectedProduct) return
    setCart(prev => [...prev, {
      product: selectedProduct,
      quantity: values.quantity,
      unitPrice: floatToCents(values.unitPrice),
    }])
    setSelectedProduct(null)
    setSearchText('')
    itemForm.reset()
  }

  function removeFromCart(index: number) {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  function handlePaymentType(type: PaymentType) {
    setPaymentType(type)
    setStep(type === 'credit' ? 'customer' : 'confirm')
  }

  async function handleCreateCustomer(values: NewCustomerForm) {
    setCreatingCustomer(true)
    try {
      const customer = await createCustomer(values.name, values.phone || undefined)
      setSelectedCustomer(customer)
      setNewCustomerOpen(false)
      customerForm.reset()
      toast.success('Cliente cadastrado!')
      setStep('confirm')
    } catch {
      toast.error('Erro ao cadastrar cliente')
    } finally {
      setCreatingCustomer(false)
    }
  }

  async function handleConfirm() {
    if (!paymentType || cart.length === 0) return
    setSubmitting(true)
    try {
      await createSale(cart, paymentType, selectedCustomer?.id ?? null)
      toast.success('Venda registrada!')
      navigate('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar venda')
    } finally {
      setSubmitting(false)
    }
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 px-4 pt-6 pb-8">
      <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {backLabel()}
      </button>

      {/* ── Step: Carrinho (tela principal) ── */}
      {step === 'cart' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">
              {selectedProduct ? selectedProduct.name : 'Nova venda'}
            </h1>
          </div>

          {/* Sub-estado: nenhum produto selecionado → busca */}
          {!selectedProduct && (
            <>
              {scanning ? (
                <BarcodeScanner onResult={handleBarcodeResult} onClose={() => setScanning(false)} />
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setScanning(true)}>
                  <ScanLine className="mr-2 h-4 w-4" />
                  Ler código de barras
                </Button>
              )}
              <Input
                placeholder="Buscar produto pelo nome..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
              <div className="space-y-2">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-white p-3 text-left"
                  >
                    <div>
                      <span className="font-medium">{p.name}</span>
                      <span className="ml-2 text-sm text-muted-foreground">{centsToBRL(p.salePrice)}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Sub-estado: produto selecionado → form de qtd/preço */}
          {selectedProduct && (
            <>
              <div className="flex items-center justify-between rounded-xl border border-border bg-white p-4">
                <div>
                  <p className="font-semibold">{selectedProduct.name}</p>
                  <p className="text-sm text-muted-foreground">{centsToBRL(selectedProduct.salePrice)}</p>
                </div>
                <StockBadge quantity={currentStock} threshold={lowStockThreshold} />
              </div>
              <Form {...itemForm}>
                <form onSubmit={itemForm.handleSubmit(onAddToCart)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={itemForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max={currentStock} inputMode="numeric" onFocus={e => e.target.select()} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="unitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço unit. (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0.01" inputMode="decimal" onFocus={e => e.target.select()} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar ao carrinho
                  </Button>
                </form>
              </Form>
            </>
          )}

          {/* Carrinho (sempre visível quando tem itens) */}
          {cart.length > 0 && !selectedProduct && (
            <div className="space-y-3 rounded-2xl border border-border bg-white p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">Carrinho ({cart.length} {cart.length === 1 ? 'item' : 'itens'})</h2>
              </div>

              <div className="space-y-2">
                {cart.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity}× {centsToBRL(item.unitPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-sm font-semibold">{centsToBRL(item.quantity * item.unitPrice)}</span>
                      <button
                        onClick={() => removeFromCart(i)}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        aria-label="Remover item"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-semibold text-sm">Total</span>
                <span className="text-lg font-bold text-primary">{centsToBRL(cartTotal)}</span>
              </div>

              <Button className="w-full" size="lg" onClick={() => setStep('payment')}>
                Avançar para pagamento
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Step: Forma de pagamento ── */}
      {step === 'payment' && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Como vai pagar?</h1>

          {/* Resumo do carrinho */}
          <div className="rounded-xl bg-muted/50 px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</span>
            <span className="font-bold text-primary">{centsToBRL(cartTotal)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handlePaymentType('cash')}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-green-200 bg-green-50 p-6 text-green-800 hover:bg-green-100"
            >
              <span className="text-3xl">💵</span>
              <span className="font-semibold">Dinheiro</span>
            </button>
            <button
              onClick={() => handlePaymentType('card')}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-purple-200 bg-purple-50 p-6 text-purple-800 hover:bg-purple-100"
            >
              <span className="text-3xl">💳</span>
              <span className="font-semibold">Cartão</span>
            </button>
            <button
              onClick={() => handlePaymentType('pix')}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-teal-200 bg-teal-50 p-6 text-teal-800 hover:bg-teal-100"
            >
              <span className="text-3xl">⚡</span>
              <span className="font-semibold">PIX</span>
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

      {/* ── Step: Selecionar cliente (fiado) ── */}
      {step === 'customer' && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Selecionar cliente</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Buscar cliente..."
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
            />
            <Button variant="outline" size="icon" onClick={() => setNewCustomerOpen(true)} aria-label="Novo cliente">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          {customers.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              Nenhum cliente encontrado.{' '}
              <button className="text-primary underline" onClick={() => setNewCustomerOpen(true)}>
                Cadastrar novo
              </button>
            </p>
          )}
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
        </div>
      )}

      {/* ── Step: Confirmação ── */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Confirmar venda</h1>
          <div className="rounded-xl border border-border bg-white p-4 space-y-3">
            {cart.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate mr-2">
                  {item.product.name} ×{item.quantity}
                </span>
                <span className="font-medium shrink-0">{centsToBRL(item.quantity * item.unitPrice)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold text-primary">{centsToBRL(cartTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pagamento</span>
              <span className={`font-medium ${paymentType === 'credit' ? 'text-blue-600' : 'text-green-600'}`}>
                {{ cash: 'Dinheiro', card: 'Cartão', pix: 'PIX', credit: 'Fiado' }[paymentType!]}
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

      {/* Dialog: novo cliente inline */}
      <Dialog open={newCustomerOpen} onOpenChange={open => { setNewCustomerOpen(open); if (!open) customerForm.reset() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
          </DialogHeader>
          <Form {...customerForm}>
            <form onSubmit={customerForm.handleSubmit(handleCreateCustomer)} className="space-y-4 pt-2">
              <FormField
                control={customerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={customerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" inputMode="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={creatingCustomer}>
                {creatingCustomer ? 'Salvando...' : 'Cadastrar e selecionar'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
