import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Package, Users, BarChart2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', icon: Home, label: 'Início', end: true },
  { to: '/stock', icon: Package, label: 'Estoque', end: false },
  { to: '/credit', icon: Users, label: 'Fiado', end: false },
  { to: '/reports', icon: BarChart2, label: 'Relatórios', end: false },
]

export function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-safe">
      <div className="mx-auto flex max-w-lg items-center">
        {tabs.slice(0, 2).map((tab) => (
          <NavTab key={tab.to} {...tab} />
        ))}

        {/* FAB central — Nova Venda */}
        <button
          onClick={() => navigate('/sales/new')}
          aria-label="Nova venda"
          className="relative -top-4 mx-2 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg active:scale-95 transition-transform"
        >
          <Plus className="h-7 w-7" />
        </button>

        {tabs.slice(2).map((tab) => (
          <NavTab key={tab.to} {...tab} />
        ))}
      </div>
    </nav>
  )
}

function NavTab({ to, icon: Icon, label, end }: typeof tabs[number]) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}
