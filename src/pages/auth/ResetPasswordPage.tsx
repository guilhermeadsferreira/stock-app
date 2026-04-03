import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Package } from 'lucide-react'
import { supabase } from '@/infrastructure/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const schema = z.object({
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})
type FormValues = z.output<typeof schema>

// Module-level guard: survives component remounts caused by auth state navigation.
let updateInFlight = false

export function ResetPasswordPage() {
  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function onSubmit(values: FormValues) {
    if (updateInFlight) return
    updateInFlight = true
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password })
      // same_password = a senha já foi alterada (request duplicado do SDK).
      // Tratar como sucesso pois o resultado final é o que o usuário pediu.
      if (error && error.code !== 'same_password') throw error
      toast.success('Senha alterada com sucesso!')
    } catch {
      toast.error('Não foi possível alterar a senha. Tente novamente.')
    } finally {
      updateInFlight = false
    }
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Package className="h-7 w-7 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Nova senha</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Digite sua nova senha para continuar</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Nova senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••"
                      autoComplete="new-password"
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
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Confirmar senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••"
                      autoComplete="new-password"
                      className="rounded-xl h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="mt-2 w-full h-11 rounded-xl font-semibold text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar nova senha'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
