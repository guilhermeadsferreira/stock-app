import { describe, it, expect } from 'vitest'
import { calcDebtBalance, isDebtSettled } from '../credit.rules'
import type { Sale, CreditPayment } from '@/domain/types'

const makeSale = (totalPrice: number, customerId = 'c1'): Sale => ({
  id: crypto.randomUUID(),
  businessId: 'b1',
  productId: 'p1',
  quantity: 1,
  unitPrice: totalPrice,
  totalPrice,
  purchasePriceSnapshot: 500,
  paymentType: 'credit',
  customerId,
  createdAt: new Date(),
})

const makePayment = (amount: number): CreditPayment => ({
  id: crypto.randomUUID(),
  businessId: 'b1',
  customerId: 'c1',
  amount,
  notes: null,
  createdAt: new Date(),
})

describe('calcDebtBalance', () => {
  it('retorna soma das vendas quando não há pagamentos', () => {
    const sales = [makeSale(1000), makeSale(500)]
    expect(calcDebtBalance(sales, [])).toBe(1500)
  })

  it('desconta pagamentos corretamente', () => {
    const sales = [makeSale(2000)]
    const payments = [makePayment(800)]
    expect(calcDebtBalance(sales, payments)).toBe(1200)
  })

  it('retorna zero quando dívida está quitada', () => {
    const sales = [makeSale(1000)]
    const payments = [makePayment(1000)]
    expect(calcDebtBalance(sales, payments)).toBe(0)
  })

  it('retorna zero quando pagamentos excedem a dívida', () => {
    const sales = [makeSale(500)]
    const payments = [makePayment(600)]
    expect(calcDebtBalance(sales, payments)).toBe(0)
  })

  it('ignora vendas à vista no cálculo', () => {
    const cashSale: Sale = { ...makeSale(1000), paymentType: 'cash', customerId: null }
    const creditSale = makeSale(500)
    expect(calcDebtBalance([cashSale, creditSale], [])).toBe(500)
  })
})

describe('isDebtSettled', () => {
  it('retorna true quando saldo é zero', () => {
    expect(isDebtSettled(0)).toBe(true)
  })
  it('retorna false quando há saldo devedor', () => {
    expect(isDebtSettled(1)).toBe(false)
  })
})
