import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
