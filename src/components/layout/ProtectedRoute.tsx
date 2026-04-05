import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/application/stores/authStore'

interface Props {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const { session, businesses, currentBusiness, isLoading } = useAuthStore()

  // 1. Ainda verificando sessão / carregando dados → spinner
  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // 2. Sem sessão → login
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // 3. Sem empresas → onboarding
  if (!businesses || businesses.length === 0) {
    return <Navigate to="/onboarding" replace />
  }

  // 4. Tem empresas mas nenhuma selecionada → seleção
  if (!currentBusiness) {
    return <Navigate to="/companies" replace />
  }

  // 5. Tudo pronto → renderiza
  return <>{children}</>
}
