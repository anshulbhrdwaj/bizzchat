import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'

export default function SharedCartPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['shared-cart', id],
    queryFn: async () => { const { data } = await apiClient.get(`/shared-carts/${id}`); return data },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4 bg-white">
        <div className="space-y-3 animate-pulse">
          <div className="h-16 rounded-lg bg-gray-100" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-3"><div className="w-14 h-14 rounded-lg bg-gray-100" /><div className="flex-1 space-y-2"><div className="h-3 w-32 rounded bg-gray-100" /><div className="h-3 w-16 rounded bg-gray-50" /></div></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 bg-white">
        <p className="text-[15px] font-medium text-gray-900">Failed to load shared cart</p>
        <button onClick={() => refetch()} className="px-6 py-2.5 rounded-full text-[14px] font-medium text-white bg-[#128C7E]">Retry</button>
      </div>
    )
  }

  if (!data) return null

  const isExpired = data.expiresAt && new Date(data.expiresAt) < new Date()
  const items = data.items || []
  const subtotal = items.reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0)

  const statusColors: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: 'rgba(217, 119, 6, 0.1)', text: '#D97706' },
    VIEWED: { bg: 'rgba(8, 145, 178, 0.1)', text: '#0891B2' },
    ADDED: { bg: 'rgba(18, 140, 126, 0.1)', text: '#128C7E' },
    ORDERED: { bg: 'rgba(5, 150, 105, 0.1)', text: '#059669' },
    EXPIRED: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280' },
  }

  const status = isExpired ? 'EXPIRED' : (data.status || 'PENDING')
  const sc = statusColors[status] || statusColors.PENDING

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Header */}
        <header className="safe-area-top bg-[#075E54] text-white">
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center md:hidden">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <h1 className="text-[20px] font-medium flex-1">Shared Cart</h1>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: sc.bg, color: sc.text }}>
              {status}
            </span>
          </div>
        </header>

        {/* Business info */}
        <div className="mx-4 mt-3 p-4 rounded-lg bg-[#128C7E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/20">
              <span className="text-lg">🛒</span>
            </div>
            <div>
              <p className="text-[15px] font-medium text-white">{data.business?.name || 'Business'}</p>
              <p className="text-[12px] text-white/70">{items.length} items · ₹{subtotal.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Expiry warning */}
        {data.expiresAt && !isExpired && (
          <div className="mx-4 mt-3 px-4 py-2 rounded-lg flex items-center gap-2 text-[13px] font-medium"
            style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#D97706' }}>
            ⏰ Expires {new Date(data.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
        )}

        {isExpired && (
          <div className="mx-4 mt-3 px-4 py-3 rounded-lg text-center text-[13px] font-bold bg-gray-100 text-gray-500">
            This cart has expired
          </div>
        )}

        {/* Items */}
        <div className="px-4 mt-4" style={{ opacity: isExpired ? 0.5 : 1 }}>
          {items.map((item: any) => (
            <div key={item.id} className="flex gap-3 py-3 border-b border-gray-100">
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                {item.product?.images?.[0]?.url ? (
                  <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                ) : <div className="w-full h-full flex items-center justify-center"><span className="text-xl">📦</span></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-gray-900 truncate mb-0.5">{item.product?.name || 'Product'}</p>
                {item.variantLabel && <p className="text-[12px] text-gray-500">{item.variantLabel}</p>}
                {item.note && <p className="text-[12px] italic text-gray-400 mt-0.5">"{item.note}"</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[14px] font-bold text-[#128C7E]">₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</p>
                <p className="text-[12px] text-gray-500">×{item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Cart note */}
        {data.note && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-gray-50">
            <p className="text-[12px] font-medium text-gray-500 mb-1">Note from business</p>
            <p className="text-[14px] text-gray-900">{data.note}</p>
          </div>
        )}
      </div>

      {/* CTA */}
      {!isExpired && (
        <div className="px-4 py-3 safe-area-bottom bg-white border-t border-gray-200">
          <button className="w-full py-3.5 rounded-full text-[16px] font-medium text-white bg-[#128C7E] active:bg-[#075E54]">
            Add All to My Cart · ₹{subtotal.toLocaleString('en-IN')}
          </button>
        </div>
      )}
    </div>
  )
}
