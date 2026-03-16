import { format, formatDistanceToNow, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(date: Date): string {
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateTime(date: Date): string {
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatRelative(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
}

export function daysUntilExpiry(date: Date): number {
  return differenceInDays(date, new Date())
}

export function formatExpiryLabel(date: Date): string {
  const days = daysUntilExpiry(date)
  if (days < 0) return 'Vencido'
  if (days === 0) return 'Vence hoje'
  if (days === 1) return 'Vence amanhã'
  return `Vence em ${days} dias`
}
