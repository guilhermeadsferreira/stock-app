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
  const { user } = useAuthStore()
  const [customersWithBalance, setCustomersWithBalance] = useState<CustomerWithBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      if (!user) return
      const customers = await customerRepo.list(user.id)
      const withBalances = await Promise.all(
        customers.map(async (c) => {
          const [sales, payments] = await Promise.all([
            saleRepo.listByUser(user.id, { paymentType: 'credit', customerId: c.id }),
            creditRepo.listPaymentsByCustomer(user.id, c.id),
          ])
          return { ...c, balance: calcDebtBalance(sales, payments) }
        }),
      )
      setCustomersWithBalance(withBalances.filter(c => c.balance > 0))
      setLoading(false)
    }
    load()
  }, [user])

  const totalCredit = customersWithBalance.reduce((sum, c) => sum + c.balance, 0)

  return (
    <div className="space-y-4 px-4 pt-6">
      <h1 className="text-xl font-bold">Fiado</h1>

      {!loading && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-700">Total em aberto</p>
          <p className="text-2xl font-bold text-blue-800">{centsToBRL(totalCredit)}</p>
          <p className="text-xs text-blue-600 mt-1">{customersWithBalance.length} cliente{customersWithBalance.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : customersWithBalance.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Nenhum fiado em aberto</p>
        </div>
      ) : (
        <div className="space-y-2">
          {customersWithBalance.map(c => (
            <button
              key={c.id}
              onClick={() => navigate(`/credit/${c.id}`)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-white p-4 text-left hover:bg-gray-50"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                {c.phone && <p className="text-sm text-muted-foreground">{c.phone}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                  {centsToBRL(c.balance)}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
