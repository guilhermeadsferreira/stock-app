import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ScanLine, Plus, Minus, X, Pencil, Check, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { useProducts } from '@/application/hooks/useProducts'
import { useStock } from '@/application/hooks/useStock'
import { useCartStore } from '@/application/stores/cartStore'
import { centsToBRL, centsToFloat, floatToCents } from '@/domain/formatters/currency'
import { BarcodeScanner } from '@/components/stock/BarcodeScanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import type { Product } from '@/domain/types'

export function CartPage() {
  const navigate = useNavigate()
  const { findByBarcode, products, load: loadProducts } = useProducts()
  const { getEntry } = useStock()
  const { items, addItem, updateQuantity, updatePrice, removeItem, total } = useCartStore()

  const [scanning, setScanning] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [stockMap, setStockMap] = useState<Record<string, number>>({})
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [editPriceValue, setEditPriceValue] = useState('')

  // Debounce product search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      loadProducts({ search: searchText })
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchText, loadProducts])

  async function handleAddProduct(product: Product) {
    let currentStock = stockMap[product.id]
    if (currentStock === undefined) {
      const entry = await getEntry(product.id)
      currentStock = entry?.quantity ?? 0
      setStockMap(prev => ({ ...prev, [product.id]: currentStock! }))
    }

    const cartItem = items.find(i => i.product.id === product.id)
    const currentCartQty = cartItem?.quantity ?? 0

    if (currentCartQty >= currentStock) {
      toast.error('Estoque insuficiente')
      return
    }

    addItem(product)
    setSearchText('')
  }

  async function handleBarcodeResult(code: string) {
    setScanning(false)
    const product = await findByBarcode(code)
    if (product) {
      handleAddProduct(product)
    } else {
      toast.error('Produto não encontrado para este código')
    }
  }

  function handleIncrement(productId: string) {
    const item = items.find(i => i.product.id === productId)
    if (!item) return
    const stock = stockMap[productId] ?? 0
    if (item.quantity >= stock) {
      toast.error('Estoque insuficiente')
      return
    }
    updateQuantity(productId, item.quantity + 1)
  }

  function handleDecrement(productId: string) {
    const item = items.find(i => i.product.id === productId)
    if (!item) return
    if (item.quantity <= 1) {
      removeItem(productId)
    } else {
      updateQuantity(productId, item.quantity - 1)
    }
  }

  function startEditPrice(productId: string, currentPrice: number) {
    setEditingPrice(productId)
    setEditPriceValue(centsToFloat(currentPrice).toFixed(2))
  }

  function confirmEditPrice(productId: string) {
    const cents = floatToCents(parseFloat(editPriceValue))
    if (isNaN(cents) || cents <= 0) {
      toast.error('Preço inválido')
      return
    }
    updatePrice(productId, cents)
    setEditingPrice(null)
  }

  const showSearchResults = searchText.length > 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 px-4 pt-6 pb-32">
        {/* Header */}
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Início
        </button>
        <h1 className="text-xl font-bold">Nova venda</h1>

        {/* Search + Scanner */}
        {scanning ? (
          <BarcodeScanner onResult={handleBarcodeResult} onClose={() => setScanning(false)} />
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Buscar produto pelo nome..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={() => setScanning(true)} aria-label="Ler código de barras">
              <ScanLine className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Search Results */}
        {showSearchResults && (
          <div className="space-y-2">
            {products.map(p => {
              const stock = stockMap[p.id]
              const cartQty = items.find(i => i.product.id === p.id)?.quantity ?? 0
              const isOutOfStock = stock !== undefined && stock <= 0
              const isMaxed = stock !== undefined && cartQty >= stock

              return (
                <button
                  key={p.id}
                  onClick={() => handleAddProduct(p)}
                  disabled={isOutOfStock || isMaxed}
                  className={`flex w-full items-center justify-between rounded-xl border border-border p-3 text-left ${
                    isOutOfStock || isMaxed ? 'bg-muted opacity-50' : 'bg-white'
                  }`}
                >
                  <div>
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{centsToBRL(p.salePrice)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOutOfStock && <span className="text-xs text-destructive font-medium">Sem estoque</span>}
                    {!isOutOfStock && cartQty > 0 && (
                      <span className="text-xs text-muted-foreground">{cartQty} no carrinho</span>
                    )}
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Cart Items */}
        {items.length > 0 && !showSearchResults && (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground">
              Carrinho ({items.length} {items.length === 1 ? 'item' : 'itens'})
            </h2>

            <div className="space-y-2">
              {items.map(item => (
                <div key={item.product.id} className="rounded-xl border border-border bg-white p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.product.name}</p>
                      {editingPrice === item.product.id ? (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            inputMode="decimal"
                            value={editPriceValue}
                            onChange={e => setEditPriceValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && confirmEditPrice(item.product.id)}
                            className="w-20 h-7 px-1.5 text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() => confirmEditPrice(item.product.id)}
                            className="text-primary"
                            aria-label="Confirmar preço"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditPrice(item.product.id, item.unitPrice)}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                          {centsToBRL(item.unitPrice)}
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecrement(item.product.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border text-muted-foreground hover:bg-muted"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => handleIncrement(item.product.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border text-muted-foreground hover:bg-muted"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold">{centsToBRL(item.quantity * item.unitPrice)}</span>
                    </div>

                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="ml-2 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      aria-label="Remover item"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && !showSearchResults && (
          <EmptyState icon={ShoppingCart} message="Busque um produto ou escaneie o código de barras para começar" />
        )}
      </div>

      {/* Fixed footer */}
      {items.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 border-t bg-background px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold text-primary">{centsToBRL(total())}</span>
          </div>
          <Button className="w-full" size="lg" onClick={() => navigate('/sales/new/checkout')}>
            Ir para pagamento
          </Button>
        </div>
      )}
    </div>
  )
}
