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
        {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />}
        <p className={cn(
          'font-semibold uppercase tracking-wider',
          isCredit ? 'text-[11px]' : 'text-[10px]',
        )}>{label}</p>
      </div>
      {value === null
        ? <Skeleton className={cn('h-9 w-32', isCredit && 'bg-white/20')} />
        : <p className={cn(
            'font-bold leading-none tracking-tight',
            isCredit ? 'text-3xl text-white' : 'text-3xl text-foreground',
          )}>
            {value}
          </p>
      }
      {children}
    </>
  )

  const baseClass = cn(
    'rounded-2xl p-5',
    isCredit ? 'bg-credit' : 'bg-card border border-border/50 shadow-sm',
    onClick && 'active:scale-[0.98] transition-transform cursor-pointer w-full text-left',
  )

  if (onClick) {
    return <button onClick={onClick} className={baseClass}>{content}</button>
  }

  return <div className={baseClass}>{content}</div>
}
