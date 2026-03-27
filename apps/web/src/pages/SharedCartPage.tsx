import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'

export default function SharedCartPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['shared-cart', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/shared-carts/${id}`)
      return data
    },
    enabled: !!id,
  })

  // ─── Loading ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4" style={{ background: 'var(--color-background)' }}>
        <div className="space-y-3 animate-pulse">
          <div className="h-16 rounded-2xl" style={{ background: 'var(--color-surface)' }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-3"><div className="w-14 h-14 rounded-xl" style={{ background: 'var(--color-surface)' }} /><div className="flex-1 space-y-2"><div className="h-3 w-32 rounded" style={{ background: 'var(--color-surface)' }} /><div className="h-3 w-16 rounded" style={{ background: 'var(--color-surface)' }} /></div></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8" style={{ background: 'var(--color-background)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Failed to load shared cart</p>
        <button onClick={() => refetch()} className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: 'var(--color-primary)' }}>Retry</button>
      </div>
    )
  }

  if (!data) return null

  const isExpired = data.expiresAt && new Date(data.expiresAt) < new Date()
  const items = data.items || []
  const subtotal = items.reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0)

  const statusColors: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: 'rgba(217, 119, 6, 0.15)', text: '#D97706' },
    VIEWED: { bg: 'rgba(8, 145, 178, 0.15)', text: '#0891B2' },
    ADDED: { bg: 'rgba(91, 63, 217, 0.15)', text: '#5B3FD9' },
    ORDERED: { bg: 'rgba(5, 150, 105, 0.15)', text: '#059669' },
    EXPIRED: { bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280' },
  }

  const status = isExpired ? 'EXPIRED' : (data.status || 'PENDING')
  const sc = statusColors[status] || statusColors.PENDING

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--color-background)' }}>
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Header */}
        <header className="px-4 pt-4 pb-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center touch-target md:hidden"
            style={{ color: 'var(--color-text-primary)' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Shared Cart</h1>
          <span className="ml-auto px-3 py-1 rounded-full text-[10px] font-bold" style={{ background: sc.bg, color: sc.text }}>
            {status}
          </span>
        </header>

        {/* Business info */}
        <div className="mx-4 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <span className="text-lg">🛒</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">{data.business?.name || 'Business'}</p>
              <p className="text-[10px] text-white/70">{items.length} items · ₹{subtotal.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Expiry warning */}
        {data.expiresAt && !isExpired && (
          <div className="mx-4 mt-3 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-medium"
            style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#D97706' }}>
            ⏰ Expires {new Date(data.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
        )}

        {/* Expired overlay text */}
        {isExpired && (
          <div className="mx-4 mt-3 px-4 py-3 rounded-xl text-center text-xs font-bold"
            style={{ background: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' }}>
            This cart has expired
          </div>
        )}

        {/* Items */}
        <div className="px-4 mt-4" style={{ opacity: isExpired ? 0.5 : 1 }}>
          {items.map((item: any) => (
            <div key={item.id} className="flex gap-3 py-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--color-surface)' }}>
                {item.product?.images?.[0]?.url ? (
                  <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                ) : <div className="w-full h-full flex items-center justify-center"><span className="text-xl">📦</span></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate mb-0.5" style={{ color: 'var(--color-text-primary)' }}>{item.product?.name || 'Product'}</p>
                {item.variantLabel && <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{item.variantLabel}</p>}
                {item.note && <p className="text-[10px] italic mt-0.5" style={{ color: 'var(--color-text-muted)' }}>"{item.note}"</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>×{item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Cart note */}
        {data.note && (
          <div className="mx-4 mt-4 p-3 rounded-xl" style={{ background: 'var(--color-surface)' }}>
            <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Note from business</p>
            <p className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{data.note}</p>
          </div>
        )}
      </div>

      {/* CTA */}
      {!isExpired && (
        <div className="px-4 py-3 safe-area-bottom" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--glass-border)' }}>
          <button className="w-full h-14 rounded-xl font-semibold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))', boxShadow: '0 4px 20px rgba(91, 63, 217, 0.3)' }}>
            Add All to My Cart · ₹{subtotal.toLocaleString('en-IN')}
          </button>
        </div>
      )}
    </div>
  )
}
