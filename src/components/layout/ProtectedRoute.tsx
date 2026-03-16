import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/application/stores/authStore'

interface Props {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const { session, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
