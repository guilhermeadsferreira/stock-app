import { Outlet, useNavigate } from 'react-router-dom'
import { Building2, ChevronRight } from 'lucide-react'
import { BottomNav } from './BottomNav'
import { useAuthStore } from '@/application/stores/authStore'

export function AppShell() {
  const navigate = useNavigate()
  const { currentBusiness, businesses } = useAuthStore()

  const showSwitcher = businesses.length > 1

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {currentBusiness && (
        <header className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-40">
          <button
            onClick={() => showSwitcher && navigate('/companies')}
            disabled={!showSwitcher}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
          >
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="flex-1 text-sm font-medium truncate">{currentBusiness.name}</span>
            {showSwitcher && (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>
        </header>
      )}

      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
