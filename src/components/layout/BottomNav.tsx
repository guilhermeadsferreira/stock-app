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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-white/88 backdrop-blur-md pb-safe">
      <div className="mx-auto flex max-w-lg items-center px-1">
        {tabs.slice(0, 2).map((tab) => (
          <NavTab key={tab.to} {...tab} />
        ))}

        {/* FAB central — Nova Venda */}
        <button
          onClick={() => navigate('/sales/new')}
          aria-label="Nova venda"
          className="relative -top-4 mx-2 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 active:scale-95 transition-all duration-200"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
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
      className="flex flex-1 flex-col items-center gap-0.5 py-2"
    >
      {({ isActive }) => (
        <>
          <div className={cn(
            'flex h-7 w-14 items-center justify-center rounded-full transition-all duration-200',
            isActive && 'bg-primary/10',
          )}>
            <Icon className={cn(
              'h-5 w-5 transition-all duration-200',
              isActive ? 'text-primary stroke-[2.5]' : 'text-muted-foreground/60 stroke-[1.75]',
            )} />
          </div>
          <span className={cn(
            'text-[10px] font-medium transition-colors duration-200',
            isActive ? 'text-primary' : 'text-muted-foreground/60',
          )}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}
