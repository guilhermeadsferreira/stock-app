import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, ScanLine } from 'lucide-react'
import { useProducts } from '@/application/hooks/useProducts'
import { floatToCents } from '@/domain/formatters/currency'
import { BarcodeScanner } from '@/components/stock/BarcodeScanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  brand: z.string().optional(),
  barcode: z.string().optional(),
  purchasePrice: z.coerce.number().min(0.01, 'Preço obrigatório'),
  salePrice: z.coerce.number().min(0.01, 'Preço obrigatório'),
  maxDiscountPct: z.coerce.number().int().min(0).max(100).optional(),
  expirationDate: z.string().optional(),
  quantity: z.coerce.number().int().min(0),
  notes: z.string().optional(),
})
type FormValues = z.output<typeof schema>

export function NewProductPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { create, findByBarcode } = useProducts()
  const [scanning, setScanning] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: { name: '', brand: '', barcode: searchParams.get('barcode') ?? '', purchasePrice: 0, salePrice: 0, maxDiscountPct: undefined, expirationDate: '', quantity: 0, notes: '' },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      await create(
        {
          name: values.name,
          brand: values.brand || null,
          barcode: values.barcode || null,
          notes: values.notes || null,
          maxDiscountPct: values.maxDiscountPct ?? null,
          purchasePrice: floatToCents(values.purchasePrice),
          salePrice: floatToCents(values.salePrice),
          expirationDate: values.expirationDate ? new Date(values.expirationDate + 'T00:00:00') : null,
        },
        values.quantity,
      )
      toast.success('Produto cadastrado!')
      navigate('/stock')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar produto')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 px-4 pt-6 pb-8">
      <button onClick={() => navigate('/stock')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Estoque
      </button>
      <h1 className="text-xl font-bold">Novo produto</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do produto *</FormLabel>
                <FormControl><Input placeholder="Ex: Coca-Cola 350ml" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl><Input placeholder="Ex: Coca-Cola" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="barcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de barras</FormLabel>
                {scanning ? (
                  <BarcodeScanner
                    onResult={async (code) => {
                      setScanning(false)
                      const existing = await findByBarcode(code)
                      if (existing) {
                        toast.info('Produto já cadastrado — abrindo detalhes')
                        navigate(`/stock/${existing.id}`)
                        return
                      }
                      field.onChange(code)
                      toast.success('Código lido: ' + code)
                    }}
                    onClose={() => setScanning(false)}
                  />
                ) : (
                  <div className="flex gap-2">
                    <FormControl><Input placeholder="Opcional" {...field} /></FormControl>
                    <Button type="button" variant="outline" onClick={() => setScanning(true)} size="icon">
                      <ScanLine className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo (R$) *</FormLabel>
                  <FormControl>
                    <CurrencyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="salePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço venda (R$) *</FormLabel>
                  <FormControl>
                    <CurrencyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="maxDiscountPct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desconto máximo (%)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="100" inputMode="numeric" placeholder="Ex: 10" onFocus={(e) => e.target.select()} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expirationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de validade</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade inicial *</FormLabel>
                <FormControl>
                  <Input type="number" min="0" inputMode="numeric" onFocus={(e) => e.target.select()} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl><Input placeholder="Opcional" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? 'Salvando...' : 'Cadastrar produto'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
