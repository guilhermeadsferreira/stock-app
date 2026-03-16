import { useState, useCallback } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { CreditRepository } from '@/infrastructure/supabase/CreditRepository'
import { SaleRepository } from '@/infrastructure/supabase/SaleRepository'
import { useAuthStore } from '@/application/stores/authStore'
import { calcDebtBalance } from '@/domain/rules/credit.rules'
import type { CreditPayment, Sale } from '@/domain/types'

const creditRepo = new CreditRepository(supabase)
const saleRepo = new SaleRepository(supabase)

export function useCredit() {
  const { user } = useAuthStore()
  const [payments, setPayments] = useState<CreditPayment[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)

  const loadCustomerCredit = useCallback(async (customerId: string) => {
    if (!user) return
    setLoading(true)
    try {
      const [fetchedSales, fetchedPayments] = await Promise.all([
        saleRepo.listByUser(user.id, { paymentType: 'credit', customerId }),
        creditRepo.listPaymentsByCustomer(user.id, customerId),
      ])
      setSales(fetchedSales)
      setPayments(fetchedPayments)
    } finally {
      setLoading(false)
    }
  }, [user])

  const getBalance = useCallback((customerSales: Sale[], customerPayments: CreditPayment[]) => {
    return calcDebtBalance(customerSales, customerPayments)
  }, [])

  const registerPayment = useCallback(async (
    customerId: string,
    amount: number,
    notes?: string,
  ): Promise<CreditPayment> => {
    if (!user) throw new Error('Não autenticado')
    return creditRepo.createPayment({
      userId: user.id,
      customerId,
      amount,
      notes: notes ?? null,
    })
  }, [user])

  const balance = calcDebtBalance(sales, payments)

  return { sales, payments, balance, loading, loadCustomerCredit, getBalance, registerPayment }
}
