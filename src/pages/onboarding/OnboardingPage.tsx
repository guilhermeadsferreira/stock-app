import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useBusiness } from '@/application/hooks/useBusiness'
import { useAuthStore } from '@/application/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { session, businesses, currentBusiness, isLoading } = useAuthStore()
  const { createBusiness, joinByCode } = useBusiness()
  const [businessName, setBusinessName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && currentBusiness) {
      navigate('/', { replace: true })
    }
    if (!isLoading && !currentBusiness && businesses.length > 0) {
      // Tem empresas mas nenhuma selecionada — vai para tela de seleção
      navigate('/companies', { replace: true })
    }
    if (!isLoading && !session) {
      navigate('/login', { replace: true })
    }
  }, [isLoading, currentBusiness, businesses, session, navigate])

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!businessName.trim()) return
    setLoading(true)
    try {
      await createBusiness(businessName.trim())
      navigate('/', { replace: true })
    } catch {
      toast.error('Erro ao criar empresa')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (inviteCode.length < 8) return
    setLoading(true)
    try {
      await joinByCode(inviteCode.trim())
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'Código inválido') {
        toast.error('Código de convite inválido')
      } else {
        toast.error('Erro ao entrar na empresa')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Bem-vindo!</h1>
        <p className="text-muted-foreground mt-1">Configure sua empresa para continuar</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="font-semibold">Criar minha empresa</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <Input
              placeholder="Nome da empresa"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" className="w-full" disabled={loading || !businessName.trim()}>
              Criar empresa
            </Button>
          </form>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="font-semibold">Entrar em empresa existente</h2>
          <form onSubmit={handleJoin} className="space-y-3">
            <Input
              placeholder="Código de convite (8 caracteres)"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={8}
              disabled={loading}
            />
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={loading || inviteCode.length < 8}
            >
              Entrar com código
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
