import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/application/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      await signIn(values.email, values.password)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code === 'email_not_confirmed') {
        toast.error('Confirme seu email antes de entrar. Verifique sua caixa de entrada.')
      } else {
        toast.error('Email ou senha incorretos')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <span className="text-2xl">📦</span>
          </div>
          <h1 className="text-2xl font-bold">Gestão de Estoque</h1>
          <p className="mt-1 text-sm text-muted-foreground">Entre na sua conta</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="seu@email.com" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
