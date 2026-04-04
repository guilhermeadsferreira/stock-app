import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  message,
}: {
  icon: LucideIcon
  message: string
}) {
  return (
    <div className="py-16 text-center">
      <Icon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
