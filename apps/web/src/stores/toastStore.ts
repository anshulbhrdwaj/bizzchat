import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'undo'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
  onUndo?: () => void
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toastProps: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  addToast: (toastProps) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toastProps, id, duration: toastProps.type === 'undo' ? 5000 : 4000 }
    
    set((state) => {
      const updated = [...state.toasts, newToast]
      if (updated.length > 3) {
        // remove oldest
        return { toasts: updated.slice(updated.length - 3) }
      }
      return { toasts: updated }
    })

    if (newToast.duration !== Infinity) {
      setTimeout(() => {
        get().removeToast(id)
      }, newToast.duration)
    }

    return id
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  success: (msg: string) => useToastStore.getState().addToast({ type: 'success', message: msg }),
  error: (msg: string) => useToastStore.getState().addToast({ type: 'error', message: msg }),
  info: (msg: string) => useToastStore.getState().addToast({ type: 'info', message: msg }),
  warning: (msg: string) => useToastStore.getState().addToast({ type: 'warning', message: msg }),
  undo: (msg: string, onUndo: () => void) => useToastStore.getState().addToast({ type: 'undo', message: msg, onUndo }),
}
