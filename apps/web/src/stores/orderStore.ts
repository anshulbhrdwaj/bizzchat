import { create } from 'zustand'
import type { Order, BusinessStats, OrderStatus } from '@bizchat/shared'

interface OrderStore {
  orders: Order[]
  stats: BusinessStats | null
  setOrders: (orders: Order[]) => void
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: OrderStatus) => void
  setStats: (stats: BusinessStats) => void
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  stats: null,

  setOrders: (orders) => set({ orders }),

  addOrder: (order) => set(state => ({
    orders: [order, ...state.orders],
  })),

  updateOrderStatus: (orderId, status) => set(state => ({
    orders: state.orders.map(o =>
      o.id === orderId ? { ...o, status } : o
    ),
  })),

  setStats: (stats) => set({ stats }),
}))
