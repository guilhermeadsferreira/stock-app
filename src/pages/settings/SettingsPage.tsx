import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useSettings } from '@/application/hooks/useSettings'
import { useAuth } from '@/application/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const schema = z.object({
  businessName: z.string().min(1, 'Nome obrigatório'),
  lowStockThreshold: z.coerce.number().int().min(1),
  expirationAlertDays: z.coerce.number().int().min(1),
})
type FormValues = z.output<typeof schema>

export function SettingsPage() {
  const { businessName, lowStockThreshold, expirationAlertDays, loadFromSupabase, save } = useSettings()
  const { signOut } = useAuth()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: { businessName, lowStockThreshold, expirationAlertDays },
  })

  useEffect(() => {
    loadFromSupabase().then(() => {
      form.reset({ businessName, lowStockThreshold, expirationAlertDays })
    })
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
                <FormControl><Input {...field} /></FormControl>
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
                <FormControl><Input type="number" min="1" inputMode="numeric" {...field} /></FormControl>
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
                <FormControl><Input type="number" min="1" inputMode="numeric" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">Salvar</Button>
        </form>
      </Form>

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
