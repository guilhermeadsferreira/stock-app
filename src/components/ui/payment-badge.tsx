import { cn } from '@/lib/utils'

type PaymentMethod = 'cash' | 'card' | 'pix' | 'credit'

const colorMap: Record<PaymentMethod, string> = {
  cash: 'bg-payment-cash-surface text-payment-cash',
  card: 'bg-payment-card-surface text-payment-card',
  pix: 'bg-payment-pix-surface text-payment-pix',
  credit: 'bg-credit-surface text-credit',
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
