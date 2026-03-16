import type { Sale, CreditPayment } from '@/domain/types'

/**
 * Calcula o saldo devedor de um cliente em centavos.
 * Saldo = soma das vendas no fiado - soma dos pagamentos.
 */
export function calcDebtBalance(creditSales: Sale[], payments: CreditPayment[]): number {
  const totalSales = creditSales
    .filter(s => s.paymentType === 'credit')
    .reduce((sum, s) => sum + s.totalPrice, 0)
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  return Math.max(0, totalSales - totalPaid)
}

export function isDebtSettled(balance: number): boolean {
  return balance === 0
}
