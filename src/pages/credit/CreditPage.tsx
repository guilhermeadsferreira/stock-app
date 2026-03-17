import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Users } from 'lucide-react'
import { supabase } from '@/infrastructure/supabase/client'
import { CustomerRepository } from '@/infrastructure/supabase/CustomerRepository'
import { SaleRepository } from '@/infrastructure/supabase/SaleRepository'
import { CreditRepository } from '@/infrastructure/supabase/CreditRepository'
import { useAuthStore } from '@/application/stores/authStore'
import { calcDebtBalance } from '@/domain/rules/credit.rules'
import { centsToBRL } from '@/domain/formatters/currency'
import { Skeleton } from '@/components/ui/skeleton'
import type { Customer } from '@/domain/types'

const customerRepo = new CustomerRepository(supabase)
const saleRepo = new SaleRepository(supabase)
const creditRepo = new CreditRepository(supabase)

interface CustomerWithBalance extends Customer {
  balance: number
}

export function CreditPage() {
  const navigate = useNavigate()
  const { currentBusiness } = useAuthStore()
  const [customersWithBalance, setCustomersWithBalance] = useState<CustomerWithBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentBusiness) return
    async function load() {
      if (!currentBusiness) return
      const customers = await customerRepo.list(currentBusiness.id)
      const withBalances = await Promise.all(
        customers.map(async (c) => {
          const [sales, payments] = await Promise.all([
            saleRepo.listByBusiness(currentBusiness.id, { paymentType: 'credit', customerId: c.id }),
            creditRepo.listPaymentsByCustomer(currentBusiness.id, c.id),
          ])
          return { ...c, balance: calcDebtBalance(sales, payments) }
        }),
      )
      setCustomersWithBalance(withBalances.filter(c => c.balance > 0))
      setLoading(false)
    }
    load()
  }, [currentBusiness])

  const totalCredit = customersWithBalance.reduce((sum, c) => sum + c.balance, 0)

  return (
    <div className="space-y-4 px-5 pt-8">
      <h1 className="text-2xl font-bold tracking-tight">Fiado</h1>

      {!loading && (
        <div className="rounded-2xl bg-[#1e3a8a] p-5 text-white">
          <p className="text-sm text-blue-200 font-medium mb-2">Total em aberto</p>
          <p className="text-3xl font-bold text-white leading-none tracking-tight">{centsToBRL(totalCredit)}</p>
          <p className="text-xs text-blue-300 mt-2">
            {customersWithBalance.length} cliente{customersWithBalance.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[68px] w-full rounded-2xl" />)}
        </div>
      ) : customersWithBalance.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Nenhum fiado em aberto</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {customersWithBalance.map(c => (
            <button
              key={c.id}
              onClick={() => navigate(`/credit/${c.id}`)}
              className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3.5 text-left shadow-sm active:scale-[0.99] active:shadow-none transition-all duration-150"
            >
              <div>
                <p className="font-semibold text-[15px]">{c.name}</p>
                {c.phone && <p className="text-sm text-muted-foreground mt-0.5">{c.phone}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                  {centsToBRL(c.balance)}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40" strokeWidth={1.75} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
