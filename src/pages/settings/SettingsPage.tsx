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
import { supabase } from '@/infrastructure/supabase/client'
import { BusinessRepository } from '@/infrastructure/supabase/BusinessRepository'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import type { BusinessMember } from '@/domain/types'

const schema = z.object({
  businessName: z.string().min(1, 'Nome obrigatório'),
  lowStockThreshold: z.coerce.number().int().min(1),
  expirationAlertDays: z.coerce.number().int().min(1),
})
type FormValues = z.output<typeof schema>

const profileSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
})
type ProfileForm = z.output<typeof profileSchema>

const passwordSchema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
})
type PasswordForm = z.output<typeof passwordSchema>

const businessRepo = new BusinessRepository(supabase)

export function SettingsPage() {
  const { businessName, lowStockThreshold, expirationAlertDays, save } = useSettings()
  const { signOut, updatePassword } = useAuth()
  const { user, currentBusiness } = useAuthStore()
  const { getInviteCode, regenerateInviteCode, removeMember, listMembers } = useBusiness()

  const [members, setMembers] = useState<BusinessMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [codeLoading, setCodeLoading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: { businessName, lowStockThreshold, expirationAlertDays },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) as any, defaultValues: { name: '' } })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) as any, defaultValues: { password: '', confirmPassword: '' } })

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

  useEffect(() => {
    if (!user) return
    businessRepo.getProfileName(user.id).then(name => {
      if (name) profileForm.reset({ name })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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

  async function onSaveProfile(values: ProfileForm) {
    if (!user) return
    setSavingProfile(true)
    try {
      await businessRepo.updateProfileName(user.id, values.name)
      toast.success('Nome atualizado!')
    } catch {
      toast.error('Erro ao atualizar nome')
    } finally {
      setSavingProfile(false)
    }
  }

  async function onChangePassword(values: PasswordForm) {
    setSavingPassword(true)
    try {
      await updatePassword(values.password)
      passwordForm.reset()
      toast.success('Senha alterada!')
    } catch {
      toast.error('Erro ao alterar senha')
    } finally {
      setSavingPassword(false)
    }
  }

  const isOwner = currentBusiness?.ownerId === user?.id

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" />
      <div className="px-5 md:px-8 space-y-6 pb-8">
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

        {/* Perfil */}
        <div className="border-t pt-4 space-y-4">
          <h2 className="font-semibold">Meu perfil</h2>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-3">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl><Input placeholder="Seu nome" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="outline" className="w-full" disabled={savingProfile}>
                {savingProfile ? 'Salvando...' : 'Salvar nome'}
              </Button>
            </form>
          </Form>
        </div>

        {/* Senha */}
        <div className="border-t pt-4 space-y-4">
          <h2 className="font-semibold">Alterar senha</h2>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-3">
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova senha</FormLabel>
                    <FormControl><Input type="password" placeholder="Mínimo 6 caracteres" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl><Input type="password" placeholder="Repita a senha" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="outline" className="w-full" disabled={savingPassword}>
                {savingPassword ? 'Alterando...' : 'Alterar senha'}
              </Button>
            </form>
          </Form>
        </div>

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
                <div key={member.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-sm">{member.email}</span>
                    <Badge variant={member.isOwner ? 'default' : 'secondary'}>
                      {member.isOwner ? 'Dono' : 'Membro'}
                    </Badge>
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
    </div>
  )
}
