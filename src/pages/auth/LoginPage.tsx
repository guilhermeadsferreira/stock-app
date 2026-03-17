import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Package } from 'lucide-react'
import { useAuth } from '@/application/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})
type FormValues = z.infer<typeof schema>

const REMEMBER_EMAIL_KEY = 'rememberedEmail'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY) ?? ''
  const [rememberEmail, setRememberEmail] = useState(!!savedEmail)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: savedEmail, password: '' },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      if (rememberEmail) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, values.email)
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY)
      }
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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Package className="h-7 w-7 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Estoque</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Entre na sua conta para continuar</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      autoComplete="email"
                      className="rounded-xl h-11"
                      {...field}
                    />
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
                  <FormLabel className="font-medium">Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••"
                      autoComplete="current-password"
                      className="rounded-xl h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="rememberEmail"
                checked={rememberEmail}
                onCheckedChange={(checked) => setRememberEmail(!!checked)}
              />
              <label htmlFor="rememberEmail" className="text-sm text-muted-foreground cursor-pointer select-none">
                Lembrar email
              </label>
            </div>
            <Button
              type="submit"
              className="mt-2 w-full h-11 rounded-xl font-semibold text-base"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
            </Button>
          </form>
        </Form>

        <p className="mt-7 text-center text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link to="/signup" className="font-semibold text-primary">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
