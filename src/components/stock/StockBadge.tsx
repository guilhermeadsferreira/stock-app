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
        'bg-red-100 text-red-700',
      )}>
        Zerado
      </span>
    )
  }
  if (quantity <= threshold) {
    return (
      <span className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
        'bg-amber-100 text-amber-700',
      )}>
        Baixo · {quantity}
      </span>
    )
  }
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
      'bg-emerald-100 text-emerald-700',
    )}>
      {quantity} un
    </span>
  )
}
