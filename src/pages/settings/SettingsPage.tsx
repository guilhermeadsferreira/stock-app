import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Copy, RefreshCw, UserMinus } from 'lucide-react'
import { useSettings } from '@/application/hooks/useSettings'
import { useBusiness } from '@/application/hooks/useBusiness'
import { useAuth } from '@/application/hooks/useAuth'
import { useAuthStore } from '@/application/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { BusinessMember } from '@/domain/types'

const schema = z.object({
  businessName: z.string().min(1, 'Nome obrigatório'),
  lowStockThreshold: z.coerce.number().int().min(1),
  expirationAlertDays: z.coerce.number().int().min(1),
})
type FormValues = z.output<typeof schema>

export function SettingsPage() {
  const { businessName, lowStockThreshold, expirationAlertDays, save } = useSettings()
  const { signOut } = useAuth()
  const { user, currentBusiness } = useAuthStore()
  const { getInviteCode, regenerateInviteCode, removeMember, listMembers } = useBusiness()

  const [members, setMembers] = useState<BusinessMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [codeLoading, setCodeLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: { businessName, lowStockThreshold, expirationAlertDays },
  })

  useEffect(() => {
    form.reset({ businessName, lowStockThreshold, expirationAlertDays })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessName, lowStockThreshold, expirationAlertDays])

  useEffect(() => {
    setMembersLoading(true)
    listMembers()
      .then(setMembers)
      .finally(() => setMembersLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: FormValues) {
    try {
      await save(values)
      toast.success('Configurações salvas!')
    } catch {
      toast.error('Erro ao salvar configurações')
    }
  }

  async function handleCopyCode() {
    const code = getInviteCode()
    await navigator.clipboard.writeText(code)
    toast.success('Código copiado!')
  }

  async function handleRegenerateCode() {
    setCodeLoading(true)
    try {
      await regenerateInviteCode()
      toast.success('Novo código gerado!')
    } catch {
      toast.error('Erro ao gerar novo código')
    } finally {
      setCodeLoading(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      await removeMember(memberId)
      setMembers(prev => prev.filter(m => m.id !== memberId))
      toast.success('Membro removido')
    } catch {
      toast.error('Erro ao remover membro')
    }
  }

  const isOwner = currentBusiness?.ownerId === user?.id

  return (
    <div className="space-y-6 px-4 pt-6 pb-8">
      <h1 className="text-xl font-bold">Configurações</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do negócio</FormLabel>
                <FormControl><Input {...field} disabled={!isOwner} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lowStockThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alerta de estoque baixo (quantidade)</FormLabel>
                <FormControl><Input type="number" min="1" inputMode="numeric" onFocus={(e) => e.target.select()} {...field} disabled={!isOwner} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expirationAlertDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alerta de vencimento (dias)</FormLabel>
                <FormControl><Input type="number" min="1" inputMode="numeric" onFocus={(e) => e.target.select()} {...field} disabled={!isOwner} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isOwner
            ? <Button type="submit" className="w-full">Salvar</Button>
            : <p className="text-center text-sm text-muted-foreground">Apenas o dono da empresa pode editar as configurações</p>
          }
        </form>
      </Form>

      <div className="border-t pt-4 space-y-4">
        <h2 className="font-semibold">Membros</h2>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Código de convite</p>
          <div className="flex gap-2">
            <div className="flex-1 rounded-md border px-3 py-2 font-mono text-sm tracking-widest">
              {getInviteCode()}
            </div>
            <Button variant="outline" size="icon" onClick={handleCopyCode} title="Copiar código">
              <Copy className="h-4 w-4" />
            </Button>
            {isOwner && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleRegenerateCode}
                disabled={codeLoading}
                title="Gerar novo código"
              >
                <RefreshCw className={`h-4 w-4 ${codeLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {membersLoading ? (
            <p className="text-sm text-muted-foreground">Carregando membros...</p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-sm">{member.email}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    member.isOwner
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {member.isOwner ? 'Dono' : 'Membro'}
                  </span>
                </div>
                {isOwner && !member.isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          onClick={async () => {
            await signOut()
          }}
        >
          Sair da conta
        </Button>
      </div>
    </div>
  )
}
