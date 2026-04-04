import { cn } from '@/lib/utils'

interface Props {
  quantity: number
  threshold: number
}

export function StockBadge({ quantity, threshold }: Props) {
  if (quantity === 0) {
    return (
      <span className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
        'bg-danger-surface text-danger',
      )}>
        Zerado
      </span>
    )
  }
  if (quantity <= threshold) {
    return (
      <span className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
        'bg-warning-surface text-warning',
      )}>
        Baixo · {quantity}
      </span>
    )
  }
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
      'bg-success-surface text-success',
    )}>
      {quantity} un
    </span>
  )
}
