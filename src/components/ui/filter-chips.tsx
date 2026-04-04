import { cn } from '@/lib/utils'

interface FilterChipsProps<T extends string> {
  options: { label: string; value: T }[]
  value: T
  onChange: (value: T) => void
  variant?: 'default' | 'compact'
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  variant = 'default',
}: FilterChipsProps<T>) {
  if (variant === 'compact') {
    return (
      <div className="inline-flex rounded-xl bg-muted p-0.5 gap-0.5">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
              value === opt.value
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
            value === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground border border-border/60',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
