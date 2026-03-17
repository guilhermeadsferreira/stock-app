import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/infrastructure/supabase/client'
import { CustomerRepository } from '@/infrastructure/supabase/CustomerRepository'
import { SaleRepository } from '@/infrastructure/supabase/SaleRepository'
import { CreditRepository } from '@/infrastructure/supabase/CreditRepository'
import { useAuthStore } from '@/application/stores/authStore'
import { useCustomers } from '@/application/hooks/useCustomers'
import { calcDebtBalance } from '@/domain/rules/credit.rules'
import { centsToBRL } from '@/domain/formatters/currency'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import type { Customer } from '@/domain/types'

const customerRepo = new CustomerRepository(supabase)
const saleRepo = new SaleRepository(supabase)
const creditRepo = new CreditRepository(supabase)

interface CustomerWithBalance extends Customer {
  balance: number
}

const newCustomerSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().optional(),
})
type NewCustomerForm = z.output<typeof newCustomerSchema>

type Tab = 'all' | 'credit'

export function CustomersPage() {
  const navigate = useNavigate()
  const { currentBusiness } = useAuthStore()
  const { create } = useCustomers()

  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [allCustomers, setAllCustomers] = useState<CustomerWithBalance[]>([])
  const [filtered, setFiltered] = useState<CustomerWithBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<NewCustomerForm>({ resolver: zodResolver(newCustomerSchema) as any })

  useEffect(() => {
    if (!currentBusiness) return
    async function load() {
      if (!currentBusiness) return
      setLoading(true)
      try {
        const [customers, allSales, allPayments] = await Promise.all([
          customerRepo.list(currentBusiness.id),
          saleRepo.listByBusiness(currentBusiness.id, { paymentType: 'credit' }),
          creditRepo.listAllPayments(currentBusiness.id),
        ])
        const withBalances: CustomerWithBalance[] = customers.map(c => ({
          ...c,
          balance: calcDebtBalance(
            allSales.filter((s) => s.customerId === c.id),
            allPayments.filter((p) => p.customerId === c.id),
          ),
        }))
        setAllCustomers(withBalances)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentBusiness])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const q = search.trim().toLowerCase()
      const base = tab === 'credit' ? allCustomers.filter(c => c.balance > 0) : allCustomers
      setFiltered(q ? base.filter(c => c.name.toLowerCase().includes(q)) : base)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, tab, allCustomers])

  const totalCredit = allCustomers.filter(c => c.balance > 0).reduce((s, c) => s + c.balance, 0)
  const creditCount = allCustomers.filter(c => c.balance > 0).length

  async function handleCreate(values: NewCustomerForm) {
    setSubmitting(true)
    try {
      const customer = await create(values.name, values.phone || undefined)
      setAllCustomers(prev => [{ ...customer, balance: 0 }, ...prev])
      setDialogOpen(false)
      form.reset()
      toast.success('Cliente cadastrado!')
    } catch {
      toast.error('Erro ao cadastrar cliente')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 px-5 pt-8 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm active:scale-95 transition-transform"
          aria-label="Novo cliente"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      {!loading && creditCount > 0 && (
        <div className="rounded-2xl bg-[#1e3a8a] p-5 text-white">
          <p className="text-sm text-blue-200 font-medium mb-2">Total em fiado</p>
          <p className="text-3xl font-bold leading-none tracking-tight">{centsToBRL(totalCredit)}</p>
          <p className="text-xs text-blue-300 mt-2">
            {creditCount} cliente{creditCount !== 1 ? 's' : ''} com saldo em aberto
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-xl border border-border bg-muted/40 p-1 gap-1">
        {([['all', 'Todos'], ['credit', 'Fiado em aberto']] as [Tab, string][]).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={cn(
              'flex-1 rounded-lg py-1.5 text-sm font-medium transition-all duration-200',
              tab === value
                ? 'bg-white shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Input
        placeholder="Buscar cliente..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[68px] w-full rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            {tab === 'credit' ? 'Nenhum fiado em aberto' : 'Nenhum cliente cadastrado'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => navigate(`/customers/${c.id}`)}
              className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3.5 text-left shadow-sm active:scale-[0.99] active:shadow-none transition-all duration-150"
            >
              <div>
                <p className="font-semibold text-[15px]">{c.name}</p>
                {c.phone && <p className="text-sm text-muted-foreground mt-0.5">{c.phone}</p>}
              </div>
              <div className="flex items-center gap-2">
                {c.balance > 0 && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                    {centsToBRL(c.balance)}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground/40" strokeWidth={1.75} />
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) form.reset() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4 pt-2">
              <FormField
                control={form.control}
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
                control={form.control}
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
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Cadastrar'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
