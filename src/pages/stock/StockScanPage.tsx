import { useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useProducts } from '@/application/hooks/useProducts'
import { BarcodeScanner } from '@/components/stock/BarcodeScanner'

export function StockScanPage() {
  const navigate = useNavigate()
  const { findByBarcode } = useProducts()
  const lookingRef = useRef(false)

  const handleResult = useCallback(async (code: string) => {
    if (lookingRef.current) return
    lookingRef.current = true
    try {
      const product = await findByBarcode(code)
      if (product) {
        navigate(`/stock/${product.id}`)
      } else {
        navigate(`/stock/new?barcode=${encodeURIComponent(code)}`)
      }
    } catch {
      toast.error('Erro ao buscar produto')
      lookingRef.current = false
    }
  }, [findByBarcode, navigate])

  return (
    <div className="space-y-4 px-4 pt-6">
      <button onClick={() => navigate('/stock')} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Estoque
      </button>

      <div>
        <h1 className="text-xl font-bold">Entrada por código de barras</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aponte para o código do produto para repor ou cadastrar
        </p>
      </div>

      <BarcodeScanner
        onResult={handleResult}
        onClose={() => navigate('/stock')}
      />
    </div>
  )
}
