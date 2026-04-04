import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | null
  variant?: 'default' | 'credit'
  icon?: LucideIcon
  onClick?: () => void
  children?: ReactNode
}

export function StatCard({ label, value, variant = 'default', icon: Icon, onClick, children }: StatCardProps) {
  const isCredit = variant === 'credit'

  const content = (
    <>
      <div className={cn('flex items-center gap-1.5 mb-3', isCredit ? 'text-blue-200' : 'text-muted-foreground')}>
        {Icon && <Icon className="h-4 w-4" strokeWidth={1.75} />}
        <p className={cn('font-medium', isCredit ? 'text-sm' : 'text-xs')}>{label}</p>
      </div>
      {value === null
        ? <Skeleton className={cn('h-8 w-32', isCredit && 'bg-white/20')} />
        : <p className={cn(
            'font-bold leading-none tracking-tight',
            isCredit ? 'text-3xl text-white' : 'text-2xl text-foreground',
          )}>
            {value}
          </p>
      }
      {children}
    </>
  )

  const baseClass = cn(
    'rounded-2xl p-5',
    isCredit ? 'bg-credit' : 'bg-card shadow-sm',
    onClick && 'active:scale-[0.98] transition-transform cursor-pointer w-full text-left',
  )

  if (onClick) {
    return <button onClick={onClick} className={baseClass}>{content}</button>
  }

  return <div className={baseClass}>{content}</div>
}
