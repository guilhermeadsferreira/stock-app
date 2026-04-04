import { create } from 'zustand'
import type { Product, CartItem } from '@/domain/types'

interface CartState {
  items: CartItem[]
  addItem: (product: Product) => void
  updateQuantity: (productId: string, qty: number) => void
  updatePrice: (productId: string, price: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  total: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        }
      }
      return {
        items: [...state.items, { product, quantity: 1, unitPrice: product.salePrice }],
      }
    }),

  updateQuantity: (productId, qty) =>
    set((state) => {
      if (qty <= 0) {
        return { items: state.items.filter((i) => i.product.id !== productId) }
      }
      return {
        items: state.items.map((i) =>
          i.product.id === productId ? { ...i, quantity: qty } : i,
        ),
      }
    }),

  updatePrice: (productId, price) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, unitPrice: price } : i,
      ),
    })),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    })),

  clear: () => set({ items: [] }),

  total: () =>
    get().items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
}))
