import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/application/stores/authStore'

interface Props {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const { session, businesses, currentBusiness, isLoading } = useAuthStore()

  if (session && currentBusiness) {
    return <>{children}</>
  }

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

  if (businesses.length === 0) {
    return <Navigate to="/onboarding" replace />
  }

  // Autenticado, tem empresas mas nenhuma selecionada
  return <Navigate to="/companies" replace />
}
