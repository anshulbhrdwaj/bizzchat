import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useState } from 'react'
import { ProductRow, Cart } from './CatalogPage'

export default function SharedCartPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [addedSuccess, setAddedSuccess] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['shared-cart', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/shared-carts/${id}`)
      return data
    },
    enabled: !!id,
  })

  // Fetch USER's own cart for this business (to enable inline edits)
  const businessId = data?.business?.id || data?.businessId
  const { data: cart } = useQuery<Cart>({
    queryKey: ["cart", businessId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/cart?businessId=${businessId}`);
      return data;
    },
    enabled: !!businessId,
  });

  // Add all items to personal cart
  const addToCart = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/cart/from-shared/${id}`)
    },
    onSuccess: () => {
      setAddedSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['shared-cart', id] })
      queryClient.invalidateQueries({ queryKey: ["cart", businessId] })
      // Navigate to the cart after 1.2s so the success animation shows
      setTimeout(() => {
        navigate(`/cart/${businessId}`)
      }, 1200)
    },
  })

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 pb-20 bg-white">
        <div className="space-y-3 animate-pulse">
          <div className="h-16 rounded-xl bg-gray-100" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-3">
              <div className="w-16 h-16 rounded-xl bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-gray-100" />
                <div className="h-3 w-16 rounded bg-gray-50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 bg-white">
        <span className="text-4xl">⚠️</span>
        <p className="text-[15px] font-medium text-gray-900">Failed to load shared catalogue</p>
        <button
          onClick={() => refetch()}
          className="px-6 py-2.5 rounded-full text-[14px] font-semibold text-white bg-[#128C7E] active:bg-[#075E54] transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  const isExpired = data.expiresAt && new Date(data.expiresAt) < new Date()
  const items: any[] = data.items || []
  const subtotal = items.reduce((s: number, i: any) => {
    const price = i.variant?.priceOverride ?? i.product?.basePrice ?? 0
    return s + Number(price) * i.quantity
  }, 0)

  const statusLabel: Record<string, string> = {
    PENDING: 'New',
    VIEWED: 'Viewed',
    ADDED_TO_CART: 'Added to Cart',
    ORDERED: 'Ordered',
    EXPIRED: 'Expired',
  }
  const statusColors: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: 'rgba(245, 158, 11, 0.12)', text: '#D97706' },
    VIEWED: { bg: 'rgba(8, 145, 178, 0.12)', text: '#0891B2' },
    ADDED_TO_CART: { bg: 'rgba(18, 140, 126, 0.12)', text: '#128C7E' },
    ORDERED: { bg: 'rgba(5, 150, 105, 0.12)', text: '#059669' },
    EXPIRED: { bg: 'rgba(107, 114, 128, 0.12)', text: '#6B7280' },
  }

  const status = isExpired ? 'EXPIRED' : (data.status || 'PENDING')
  const sc = statusColors[status] || statusColors.PENDING

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F0F2F5]">
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Header */}
        <header className="safe-area-top bg-[#075E54] text-white">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-full active:bg-white/10 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[18px] font-semibold">Shared Catalogue</h1>
              {data.business?.name && (
                <p className="text-[12px] text-white/70 truncate">from {data.business.name}</p>
              )}
            </div>
            <span
              className="px-3 py-[5px] rounded-full text-[11px] font-bold shrink-0"
              style={{ background: sc.bg, color: sc.text }}
            >
              {statusLabel[status] || status}
            </span>
          </div>
        </header>

        {/* Business Card */}
        <div className="mx-4 mt-4 p-4 rounded-2xl bg-[#128C7E] shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 shrink-0">
              {data.business?.logoUrl ? (
                <img src={data.business.logoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-xl">🛒</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-semibold text-white truncate">{data.business?.name || 'Business'}</p>
              <p className="text-[13px] text-white/70">
                {items.length} item{items.length !== 1 ? 's' : ''} · ₹{subtotal.toLocaleString('en-IN')}
              </p>
            </div>
            {!isExpired && (
              <button
                onClick={() => navigate(`/catalog/${businessId}`)}
                className="px-3 py-1.5 rounded-full bg-white/20 text-[12px] font-semibold text-white active:bg-white/30 transition-colors shrink-0"
              >
                Full Catalogue
              </button>
            )}
          </div>
        </div>

        {/* Expiry notice */}
        {data.expiresAt && !isExpired && (
          <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl flex items-center gap-2 text-[13px] font-medium"
            style={{ background: 'rgba(217, 119, 6, 0.08)', color: '#D97706' }}>
            <span>⏰</span>
            <span>Offer expires {new Date(data.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        )}

        {isExpired && (
          <div className="mx-4 mt-3 px-4 py-3 rounded-xl text-center text-[13px] font-semibold bg-gray-100 text-gray-500">
            This shared catalogue has expired
          </div>
        )}

        {/* Seller note */}
        {data.note && (
          <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-white border border-gray-200">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Message from seller</p>
            <p className="text-[14px] text-gray-800 leading-relaxed">"{data.note}"</p>
          </div>
        )}

        {/* Items list */}
        <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ opacity: isExpired ? 0.5 : 1 }}>
          <p className="px-4 pt-4 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Items</p>
          <div className="flex flex-col">
            {items.map((item: any, i: number) => (
              <ProductRow
                key={item.id}
                product={item.product}
                cart={cart}
                businessId={businessId!}
                isLast={i === items.length - 1}
              />
            ))}
          </div>
          {/* Total row */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-[14px] font-bold text-gray-700">Recommended Total</span>
            <span className="text-[16px] font-bold text-[#128C7E]">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      {!isExpired && (
        <div className="px-4 py-3 safe-area-bottom bg-white border-t border-gray-200 shrink-0">
          {addedSuccess ? (
            <div className="w-full py-3.5 rounded-full bg-green-500 text-white text-[16px] font-semibold flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Added to Cart! Redirecting…
            </div>
          ) : (
            <button
              id="shared-cart-add-all"
              onClick={() => addToCart.mutate()}
              disabled={addToCart.isPending}
              className={`w-full py-3.5 rounded-full text-[16px] font-semibold transition-all ${
                addToCart.isPending
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-[#128C7E] text-white active:bg-[#075E54] shadow-sm'
              }`}
            >
              {addToCart.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding…
                </span>
              ) : (
                <>Add All to My Cart · ₹{subtotal.toLocaleString('en-IN')}</>
              )}
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes collapsible-down { from { height: 0; } to { height: var(--radix-collapsible-content-height); } }
        @keyframes collapsible-up { from { height: var(--radix-collapsible-content-height); } to { height: 0; } }
        .animate-collapsible-down { animation: collapsible-down 0.25s cubic-bezier(0.87, 0, 0.13, 1); }
        .animate-collapsible-up { animation: collapsible-up 0.25s cubic-bezier(0.87, 0, 0.13, 1); }
      `}</style>
    </div>
  )
}
