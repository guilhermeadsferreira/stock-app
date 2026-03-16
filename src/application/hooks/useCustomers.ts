import { useState, useCallback } from 'react'
import { supabase } from '@/infrastructure/supabase/client'
import { CustomerRepository } from '@/infrastructure/supabase/CustomerRepository'
import { useAuthStore } from '@/application/stores/authStore'
import type { Customer } from '@/domain/types'

const customerRepo = new CustomerRepository(supabase)

export function useCustomers() {
  const { user } = useAuthStore()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (search?: string) => {
    if (!user) return
    setLoading(true)
    try {
      const data = await customerRepo.list(user.id, search)
      setCustomers(data)
    } finally {
      setLoading(false)
    }
  }, [user])

  const create = useCallback(async (
    name: string,
    phone?: string,
  ): Promise<Customer> => {
    if (!user) throw new Error('Não autenticado')
    return customerRepo.create({ userId: user.id, name, phone: phone ?? null })
  }, [user])

  const update = useCallback(async (
    customerId: string,
    data: { name?: string; phone?: string },
  ): Promise<Customer> => {
    if (!user) throw new Error('Não autenticado')
    return customerRepo.update(user.id, customerId, data)
  }, [user])

  return { customers, loading, load, create, update }
}
