import { create } from 'zustand'
import type { Cart, CartItem } from '@bizchat/shared'

interface CartStore {
  carts: Record<string, Cart>
  setCart: (businessId: string, cart: Cart) => void
  addItem: (businessId: string, item: CartItem) => void
  updateItem: (businessId: string, itemId: string, qty: number) => void
  removeItem: (businessId: string, itemId: string) => void
  clearCart: (businessId: string) => void
  getTotalItems: (businessId: string) => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  carts: {},

  setCart: (businessId, cart) => set(state => ({
    carts: { ...state.carts, [businessId]: cart },
  })),

  addItem: (businessId, item) => set(state => {
    const cart = state.carts[businessId]
    if (!cart) return state
    return {
      carts: {
        ...state.carts,
        [businessId]: { ...cart, items: [...cart.items, item] },
      },
    }
  }),

  updateItem: (businessId, itemId, qty) => set(state => {
    const cart = state.carts[businessId]
    if (!cart) return state
    return {
      carts: {
        ...state.carts,
        [businessId]: {
          ...cart,
          items: cart.items.map(i => i.id === itemId ? { ...i, quantity: qty } : i),
        },
      },
    }
  }),

  removeItem: (businessId, itemId) => set(state => {
    const cart = state.carts[businessId]
    if (!cart) return state
    return {
      carts: {
        ...state.carts,
        [businessId]: { ...cart, items: cart.items.filter(i => i.id !== itemId) },
      },
    }
  }),

  clearCart: (businessId) => set(state => {
    const cart = state.carts[businessId]
    if (!cart) return state
    return {
      carts: {
        ...state.carts,
        [businessId]: { ...cart, items: [] },
      },
    }
  }),

  getTotalItems: (businessId) => {
    const cart = get().carts[businessId]
    if (!cart) return 0
    return cart.items.reduce((sum, item) => sum + item.quantity, 0)
  },
}))
