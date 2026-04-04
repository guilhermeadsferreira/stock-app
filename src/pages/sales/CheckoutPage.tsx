import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, UserPlus, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCartStore } from '@/application/stores/cartStore'
import { useCustomers } from '@/application/hooks/useCustomers'
import { useSales } from '@/application/hooks/useSales'
import { centsToBRL } from '@/domain/formatters/currency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { PaymentType, Customer } from '@/domain/types'

const newCustomerSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().optional(),
})
type NewCustomerForm = z.output<typeof newCustomerSchema>

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, total, clear } = useCartStore()
  const { customers, load: loadCustomers, create: createCustomer } = useCustomers()
  const { createSale } = useSales()

  const [paymentType, setPaymentType] = useState<PaymentType | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [itemsExpanded, setItemsExpanded] = useState(items.length <= 3)

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('')
  const [newCustomerOpen, setNewCustomerOpen] = useState(false)
  const [creatingCustomer, setCreatingCustomer] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customerForm = useForm<NewCustomerForm>({ resolver: zodResolver(newCustomerSchema) as any })

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/sales/new', { replace: true })
    }
  }, [items.length, navigate])

  // Debounce customer search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (paymentType !== 'credit') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      loadCustomers(customerSearch || undefined)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [customerSearch, loadCustomers, paymentType])

  function handlePaymentType(type: PaymentType) {
    setPaymentType(type)
    if (type !== 'credit') {
      setSelectedCustomer(null)
    }
  }

  async function handleCreateCustomer(values: NewCustomerForm) {
    setCreatingCustomer(true)
    try {
      const customer = await createCustomer(values.name, values.phone || undefined)
      setSelectedCustomer(customer)
      setNewCustomerOpen(false)
      customerForm.reset()
      toast.success('Cliente cadastrado!')
    } catch {
      toast.error('Erro ao cadastrar cliente')
    } finally {
      setCreatingCustomer(false)
    }
  }

  async function handleConfirm() {
    if (!paymentType || items.length === 0) return
    if (paymentType === 'credit' && !selectedCustomer) {
      toast.error('Selecione um cliente para venda fiado')
      return
    }
    setSubmitting(true)
    try {
      await createSale(items, paymentType, selectedCustomer?.id ?? null)
      clear()
      toast.success('Venda registrada!')
      navigate('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar venda')
    } finally {
      setSubmitting(false)
    }
  }

  const canConfirm = paymentType && (paymentType !== 'credit' || selectedCustomer)
  const cartTotal = total()

  if (items.length === 0) return null

  return (
    <div className="space-y-4 px-4 pt-6 pb-8">
      {/* Header */}
      <button onClick={() => navigate('/sales/new')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Carrinho
      </button>
      <h1 className="text-xl font-bold">Pagamento</h1>

      {/* Items summary */}
      <div className="rounded-xl border border-border bg-white p-4 space-y-2">
        <button
          onClick={() => setItemsExpanded(!itemsExpanded)}
          className="flex w-full items-center justify-between"
        >
          <span className="text-sm font-medium text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </span>
          {itemsExpanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </button>

        {itemsExpanded && (
          <div className="space-y-1 pt-1">
            {items.map(item => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate mr-2">
                  {item.product.name} x{item.quantity}
                </span>
                <span className="font-medium shrink-0">{centsToBRL(item.quantity * item.unitPrice)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between border-t pt-2">
          <span className="font-semibold">Total</span>
          <span className="text-lg font-bold text-primary">{centsToBRL(cartTotal)}</span>
        </div>
      </div>

      {/* Payment selection */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handlePaymentType('cash')}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-6 ${
            paymentType === 'cash'
              ? 'border-green-500 bg-green-100 text-green-800'
              : 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100'
          }`}
        >
          <span className="text-3xl">💵</span>
          <span className="font-semibold">Dinheiro</span>
        </button>
        <button
          onClick={() => handlePaymentType('card')}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-6 ${
            paymentType === 'card'
              ? 'border-purple-500 bg-purple-100 text-purple-800'
              : 'border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100'
          }`}
        >
          <span className="text-3xl">💳</span>
          <span className="font-semibold">Cartão</span>
        </button>
        <button
          onClick={() => handlePaymentType('pix')}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-6 ${
            paymentType === 'pix'
              ? 'border-teal-500 bg-teal-100 text-teal-800'
              : 'border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100'
          }`}
        >
          <span className="text-3xl">⚡</span>
          <span className="font-semibold">PIX</span>
        </button>
        <button
          onClick={() => handlePaymentType('credit')}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-6 ${
            paymentType === 'credit'
              ? 'border-blue-500 bg-blue-100 text-blue-800'
              : 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
          }`}
        >
          <span className="text-3xl">📒</span>
          <span className="font-semibold">Fiado</span>
        </button>
      </div>

      {/* Customer selection (credit only) */}
      {paymentType === 'credit' && (
        <div className="space-y-3">
          <h2 className="font-semibold">Selecionar cliente</h2>
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
                onClick={() => setSelectedCustomer(c)}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${
                  selectedCustomer?.id === c.id ? 'border-primary bg-green-50' : 'border-border bg-white'
                }`}
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

      {/* Confirm button */}
      {canConfirm && (
        <Button className="w-full" size="lg" onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Registrando...' : 'Confirmar venda'}
        </Button>
      )}

      {/* New customer dialog */}
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
