import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Package, Users, BarChart2, Settings, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/application/stores/authStore'

const tabs = [
  { to: '/', icon: Home, label: 'Início', end: true },
  { to: '/stock', icon: Package, label: 'Produtos', end: false },
  { to: '/customers', icon: Users, label: 'Clientes', end: false },
  { to: '/reports', icon: BarChart2, label: 'Relatórios', end: false },
  { to: '/settings', icon: Settings, label: 'Configurações', end: false },
]

export function Sidebar() {
  const navigate = useNavigate()
  const { currentBusiness } = useAuthStore()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border/40 bg-background lg:flex">
      {/* Business name */}
      <div className="border-b border-border/40 px-5 py-4">
        <p className="text-sm font-bold tracking-tight truncate">
          {currentBusiness?.name ?? 'Meu negócio'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <tab.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* FAB */}
      <div className="border-t border-border/40 p-4">
        <button
          onClick={() => navigate('/sales/new')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Nova venda
        </button>
      </div>
    </aside>
  )
}
