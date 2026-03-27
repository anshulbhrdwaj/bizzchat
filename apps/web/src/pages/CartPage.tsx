import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'

export default function CartPage() {
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')
  const [placing, setPlacing] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cart', businessId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/cart/${businessId}`)
      return data
    },
    enabled: !!businessId,
  })

  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity === 0) {
        await apiClient.delete(`/cart/${businessId}/items/${itemId}`)
      } else {
        await apiClient.put(`/cart/${businessId}/items/${itemId}`, { quantity })
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart', businessId] }),
  })

  const placeOrder = async () => {
    setPlacing(true)
    try {
      const { data: order } = await apiClient.post(`/orders`, { businessId, note })
      setOrderSuccess(true)
      setTimeout(() => navigate(`/orders/${order.id}`), 2500)
    } catch (err) {
      console.error('Failed to place order', err)
    } finally {
      setPlacing(false)
    }
  }

  // ─── Order Success 🎉 ──────────────────────────────────
  if (orderSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8" style={{ background: 'var(--color-background)' }}>
        <div className="relative">
          <div className="w-24 h-24 rounded-full flex items-center justify-center animate-scale-in"
            style={{ background: 'var(--color-success)', boxShadow: '0 0 40px rgba(5, 150, 105, 0.3)' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="animate-check-draw">
              <path d="M12 24L20 32L36 16" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {/* Confetti particles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                background: ['var(--color-primary)', 'var(--color-warning)', 'var(--color-success)', 'var(--color-accent-cyan)'][i % 4],
                left: '50%', top: '50%',
                animationDelay: `${i * 80}ms`,
                transform: `rotate(${i * 30}deg) translateY(-60px)`,
              }} />
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Order Placed!</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Your order has been confirmed</p>
        </div>
        <style>{`
          @keyframes check-draw { from { stroke-dashoffset: 60; } to { stroke-dashoffset: 0; } }
          .animate-check-draw { stroke-dasharray: 60; animation: check-draw 600ms ease-out forwards 200ms; stroke-dashoffset: 60; }
          @keyframes confetti { 0% { opacity: 1; transform: rotate(var(--r, 0deg)) translateY(0) scale(1); } 100% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-80px) scale(0); } }
          .animate-confetti { animation: confetti 1s ease-out forwards; }
        `}</style>
      </div>
    )
  }

  // ─── Loading ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4" style={{ background: 'var(--color-background)' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-4 animate-pulse" style={{ borderBottom: '1px solid var(--glass-border)' }}>
            <div className="w-16 h-16 rounded-xl" style={{ background: 'var(--color-surface)' }} />
            <div className="flex-1 space-y-2"><div className="h-3.5 w-32 rounded" style={{ background: 'var(--color-surface)' }} /><div className="h-3 w-16 rounded" style={{ background: 'var(--color-surface)' }} /></div>
          </div>
        ))}
      </div>
    )
  }

  // ─── Error ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8" style={{ background: 'var(--color-background)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Failed to load cart</p>
        <button onClick={() => refetch()} className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: 'var(--color-primary)' }}>Retry</button>
      </div>
    )
  }

  const items = data?.items || []
  const subtotal = items.reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0)
  const tax = Math.round(subtotal * 0.18)
  const total = subtotal + tax

  // ─── Empty Cart ────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8" style={{ background: 'var(--color-background)' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
          <span className="text-3xl">🛒</span>
        </div>
        <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Your cart is empty</h3>
        <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>Browse catalogs to add items</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: 'var(--color-primary)' }}>Browse Catalog</button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center touch-target md:hidden"
          style={{ color: 'var(--color-text-primary)' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Cart</h1>
        <span className="text-xs ml-1" style={{ color: 'var(--color-text-muted)' }}>({items.length} items)</span>
      </header>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {items.map((item: any) => (
          <div key={item.id} className="flex gap-3 py-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
            {/* Thumb */}
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--color-surface)' }}>
              {item.product?.images?.[0]?.url ? (
                <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
              ) : <div className="w-full h-full flex items-center justify-center"><span className="text-xl">📦</span></div>}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate mb-0.5" style={{ color: 'var(--color-text-primary)' }}>{item.product?.name || 'Product'}</p>
              {item.variant && <p className="text-[10px] mb-1" style={{ color: 'var(--color-text-muted)' }}>{item.variant.label}</p>}
              <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</p>
            </div>
            {/* Quantity */}
            <div className="flex items-center rounded-xl overflow-hidden shrink-0" style={{ border: '1.5px solid var(--glass-border)' }}>
              <button onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                className="w-8 h-8 flex items-center justify-center text-sm font-medium"
                style={{ color: item.quantity === 1 ? 'var(--color-error)' : 'var(--color-text-primary)', background: 'var(--color-surface)' }}>
                {item.quantity === 1 ? '🗑' : '−'}
              </button>
              <span className="w-8 text-center text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{item.quantity}</span>
              <button onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                className="w-8 h-8 flex items-center justify-center text-sm font-medium"
                style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}>+</button>
            </div>
          </div>
        ))}

        {/* Delivery note */}
        <div className="mt-4">
          <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-primary)' }}>Delivery Note</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add instructions for the business..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ background: 'var(--color-surface)', border: '1.5px solid var(--glass-border)', color: 'var(--color-text-primary)', caretColor: 'var(--color-primary)' }}
          />
        </div>
      </div>

      {/* Sticky Order Summary */}
      <div className="px-4 py-3 safe-area-bottom" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--glass-border)' }}>
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-xs"><span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span><span style={{ color: 'var(--color-text-primary)' }}>₹{subtotal.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between text-xs"><span style={{ color: 'var(--color-text-muted)' }}>Tax (18% GST)</span><span style={{ color: 'var(--color-text-primary)' }}>₹{tax.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between text-sm font-bold pt-1.5" style={{ borderTop: '1px solid var(--glass-border)' }}>
            <span style={{ color: 'var(--color-text-primary)' }}>Total</span>
            <span style={{ color: 'var(--color-primary)' }}>₹{total.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <button onClick={placeOrder} disabled={placing}
          className="w-full h-14 rounded-xl font-semibold text-sm text-white transition-all"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))', boxShadow: '0 4px 20px rgba(91, 63, 217, 0.3)' }}>
          {placing ? (
            <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing Order...</span>
          ) : `Place Order · ₹${total.toLocaleString('en-IN')}`}
        </button>
      </div>
    </div>
  )
}
