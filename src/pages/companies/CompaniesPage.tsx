import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, Plus, LogIn, ChevronLeft, Building2 } from 'lucide-react'
import { useBusiness } from '@/application/hooks/useBusiness'
import { useAuthStore } from '@/application/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function CompaniesPage() {
  const navigate = useNavigate()
  const { businesses, currentBusiness, user } = useAuthStore()
  const { switchBusiness, createBusiness, joinByCode } = useBusiness()

  const [mode, setMode] = useState<'list' | 'create' | 'join'>('list')
  const [businessName, setBusinessName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSwitch(businessId: string) {
    const business = businesses.find((b) => b.id === businessId)
    if (!business) return
    switchBusiness(business)
    navigate('/', { replace: true })
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
      if (msg === 'Já é membro desta empresa') {
        toast.error('Você já faz parte desta empresa')
      } else if (msg === 'Código inválido') {
        toast.error('Código de convite inválido')
      } else {
        toast.error('Erro ao entrar na empresa')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 border-b">
        {currentBusiness && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold">Minhas empresas</h1>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3 max-w-lg mx-auto w-full">
        {mode === 'list' && (
          <>
            {businesses.map((business) => {
              const isActive = business.id === currentBusiness?.id
              const isOwner = business.ownerId === user?.id
              return (
                <button
                  key={business.id}
                  onClick={() => handleSwitch(business.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                    isActive
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  )}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{business.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isOwner ? 'Proprietário' : 'Membro'}
                    </p>
                  </div>
                  {isActive && (
                    <Check className="h-5 w-5 text-primary shrink-0" />
                  )}
                </button>
              )
            })}

            <div className="pt-2 space-y-2">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl"
                onClick={() => setMode('create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar nova empresa
              </Button>
              <Button
                variant="ghost"
                className="w-full h-11 rounded-xl"
                onClick={() => setMode('join')}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Entrar com código de convite
              </Button>
            </div>
          </>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <button
              onClick={() => { setMode('list'); setBusinessName('') }}
              className="flex items-center gap-1 text-sm text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
            <h2 className="font-semibold text-base">Nova empresa</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                placeholder="Nome da empresa"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={loading}
                className="rounded-xl h-11"
                autoFocus
              />
              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold"
                disabled={loading || !businessName.trim()}
              >
                {loading ? 'Criando...' : 'Criar empresa'}
              </Button>
            </form>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <button
              onClick={() => { setMode('list'); setInviteCode('') }}
              className="flex items-center gap-1 text-sm text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
            <h2 className="font-semibold text-base">Entrar em empresa</h2>
            <form onSubmit={handleJoin} className="space-y-3">
              <Input
                placeholder="Código de convite (8 caracteres)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={8}
                disabled={loading}
                className="rounded-xl h-11"
                autoFocus
              />
              <Button
                type="submit"
                variant="outline"
                className="w-full h-11 rounded-xl font-semibold"
                disabled={loading || inviteCode.length < 8}
              >
                {loading ? 'Entrando...' : 'Entrar com código'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
