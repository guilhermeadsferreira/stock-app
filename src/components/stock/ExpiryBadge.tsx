import { cn } from '@/lib/utils'
import { isExpired, isNearExpiry, daysUntilExpiry } from '@/domain/rules/stock.rules'

interface Props {
  expirationDate: Date | null
  alertDays: number
}

export function ExpiryBadge({ expirationDate, alertDays }: Props) {
  if (!expirationDate) return null

  if (isExpired(expirationDate)) {
    return (
      <span className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
        'bg-red-100 text-red-700',
      )}>
        Vencido
      </span>
    )
  }

  if (isNearExpiry(expirationDate, alertDays)) {
    const days = daysUntilExpiry(expirationDate)
    return (
      <span className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
        'bg-amber-100 text-amber-700',
      )}>
        {days}d
      </span>
    )
  }

  return null
}
