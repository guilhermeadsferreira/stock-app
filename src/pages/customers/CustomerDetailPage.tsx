import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCredit } from '@/application/hooks/useCredit'
import { supabase } from '@/infrastructure/supabase/client'
import { CustomerRepository } from '@/infrastructure/supabase/CustomerRepository'
import { useAuthStore } from '@/application/stores/authStore'
import { centsToBRL, floatToCents } from '@/domain/formatters/currency'
import { formatDateTime } from '@/domain/formatters/date'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import { formatPhone } from '@/domain/formatters/phone'
import type { Customer, Sale, CreditPayment } from '@/domain/types'

const customerRepo = new CustomerRepository(supabase)

const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Valor mínimo R$ 0,01'),
  notes: z.string().optional(),
})
type PaymentForm = z.output<typeof paymentSchema>

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { sales, payments, balance, loading, loadCustomerCredit, registerPayment } = useCredit()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<PaymentForm>({ resolver: zodResolver(paymentSchema) as any })

  useEffect(() => {
    if (!user || !customerId) return
    customerRepo.findById(user.id, customerId).then(setCustomer)
    loadCustomerCredit(customerId)
  }, [user, customerId, loadCustomerCredit])

  async function onPayment(values: PaymentForm) {
    if (!customerId) return
    const amountCents = floatToCents(values.amount)
    if (amountCents > balance) {
      form.setError('amount', { message: `Máximo ${centsToBRL(balance)}` })
      return
    }
    setSubmitting(true)
    try {
      await registerPayment(customerId, amountCents, values.notes)
      await loadCustomerCredit(customerId)
      form.reset()
      if (amountCents >= balance) {
        toast.success('Dívida quitada!')
      } else {
        toast.success('Pagamento registrado!')
      }
    } catch {
      toast.error('Erro ao registrar pagamento')
    } finally {
      setSubmitting(false)
    }
  }

  type HistoryItem =
    | { kind: 'sale'; date: Date; data: Sale }
    | { kind: 'payment'; date: Date; data: CreditPayment }

  const history: HistoryItem[] = [
    ...sales.map(s => ({ kind: 'sale' as const, date: s.createdAt, data: s })),
    ...payments.map(p => ({ kind: 'payment' as const, date: p.createdAt, data: p })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="space-y-4 px-4 pt-6 pb-8">
      <button onClick={() => navigate('/customers')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Clientes
      </button>

      {customer && (
        <div>
          <h1 className="text-xl font-bold">{customer.name}</h1>
          {customer.phone && <p className="text-sm text-muted-foreground">{formatPhone(customer.phone)}</p>}
          {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
          {customer.notes && <p className="text-sm text-muted-foreground italic">{customer.notes}</p>}
        </div>
      )}

      <StatCard
        variant="credit"
        label="Saldo devedor"
        value={loading ? null : centsToBRL(balance)}
      />

      {balance > 0 && (
        <div className="rounded-xl border border-border bg-white p-4 space-y-3">
          <h2 className="font-semibold">Registrar pagamento</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onPayment)} className="space-y-3">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={balance / 100}
                        inputMode="decimal"
                        placeholder="0,00"
                        onFocus={(e) => e.target.select()}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observação (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: PIX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Confirmar pagamento'}
              </Button>
            </form>
          </Form>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="font-semibold">Histórico</h2>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
        ) : history.length === 0 ? (
          <EmptyState icon={Clock} message="Nenhum registro ainda" />
        ) : (
          history.map((item, i) => (
            <div key={i} className={`rounded-xl border p-3 ${item.kind === 'payment' ? 'border-green-200 bg-green-50' : 'border-blue-100 bg-white'}`}>
              <div className="flex justify-between">
                <p className={`text-sm font-medium ${item.kind === 'payment' ? 'text-green-700' : 'text-gray-800'}`}>
                  {item.kind === 'payment' ? '✓ Pagamento' : 'Venda no fiado'}
                </p>
                <p className={`font-semibold ${item.kind === 'payment' ? 'text-green-700' : 'text-blue-700'}`}>
                  {item.kind === 'payment'
                    ? `- ${centsToBRL(item.data.amount)}`
                    : `+ ${centsToBRL((item.data as Sale).totalPrice)}`
                  }
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{formatDateTime(item.date)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
