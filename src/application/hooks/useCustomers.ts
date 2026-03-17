import { useState, useCallback } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { CustomerRepository } from '@/infrastructure/supabase/CustomerRepository'
import { useAuthStore } from '@/application/stores/authStore'
import type { Customer } from '@/domain/types'

const customerRepo = new CustomerRepository(supabase)

export function useCustomers() {
  const { currentBusiness } = useAuthStore()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (search?: string) => {
    if (!currentBusiness) return
    setLoading(true)
    try {
      const data = await customerRepo.list(currentBusiness.id, search)
      setCustomers(data)
    } finally {
      setLoading(false)
    }
  }, [currentBusiness])

  const create = useCallback(async (
    name: string,
    phone?: string,
  ): Promise<Customer> => {
    if (!currentBusiness) throw new Error('Sem empresa ativa')
    return customerRepo.create({ businessId: currentBusiness.id, name, phone: phone ?? null })
  }, [currentBusiness])

  const update = useCallback(async (
    customerId: string,
    data: { name?: string; phone?: string },
  ): Promise<Customer> => {
    if (!currentBusiness) throw new Error('Sem empresa ativa')
    return customerRepo.update(currentBusiness.id, customerId, data)
  }, [currentBusiness])

  return { customers, loading, load, create, update }
}
