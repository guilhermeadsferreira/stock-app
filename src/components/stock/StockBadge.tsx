import { cn } from '@/lib/utils'

interface Props {
  quantity: number
  threshold: number
}

export function StockBadge({ quantity, threshold }: Props) {
  if (quantity === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Zerado
      </span>
    )
  }
  if (quantity <= threshold) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        Baixo · {quantity}
      </span>
    )
  }
  return (
    <span className={cn('inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700')}>
      {quantity} un
    </span>
  )
}
