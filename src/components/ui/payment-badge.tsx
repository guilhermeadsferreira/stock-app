import { cn } from '@/lib/utils'

type PaymentMethod = 'cash' | 'card' | 'pix' | 'credit'

const colorMap: Record<PaymentMethod, string> = {
  cash: 'bg-green-100 text-green-700',
  card: 'bg-purple-100 text-purple-700',
  pix: 'bg-teal-100 text-teal-700',
  credit: 'bg-blue-100 text-blue-700',
}

const labelMap: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  card: 'Cartão',
  pix: 'PIX',
  credit: 'Fiado',
}

export function PaymentBadge({
  method,
  size = 'md',
  className,
}: {
  method: PaymentMethod
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      className={cn(
        'rounded-full font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        colorMap[method],
        className,
      )}
    >
      {labelMap[method]}
    </span>
  )
}
