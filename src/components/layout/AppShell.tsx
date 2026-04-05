import { Outlet, ScrollRestoration, useNavigate } from 'react-router-dom'
import { Building2, ChevronRight } from 'lucide-react'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/application/stores/authStore'

export function AppShell() {
  const navigate = useNavigate()
  const { currentBusiness } = useAuthStore()

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <ScrollRestoration />
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-60">
        {currentBusiness && (
          <header className="border-b border-border/50 bg-background/95 backdrop-blur-sm shrink-0 z-40 lg:hidden">
            <button
              onClick={() => navigate('/companies')}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
            >
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-sm font-medium truncate">{currentBusiness.name}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </header>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-6">
          <div className="mx-auto lg:max-w-4xl">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom nav */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
