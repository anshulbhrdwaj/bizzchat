import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'

export default function CartPage() {
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [address, setAddress] = useState('')
  const [addressError, setAddressError] = useState(false)
  const [note, setNote] = useState('')
  const [placing, setPlacing] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [stockErrors, setStockErrors] = useState<any[]>([])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cart', businessId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/cart?businessId=${businessId}`)
      return data
    },
    enabled: !!businessId,
  })

  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity === 0) {
        await apiClient.delete(`/cart/items/${itemId}`)
      } else {
        await apiClient.put(`/cart/items/${itemId}`, { quantity })
      }
    },
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart', businessId] })
      const previousCart = queryClient.getQueryData(['cart', businessId])
      const previousCartsAll = queryClient.getQueryData(['carts', 'all'])

      queryClient.setQueryData(['cart', businessId], (old: any) => {
        if (!old) return old
        if (quantity === 0) {
          return { ...old, items: old.items.filter((i: any) => i.id !== itemId) }
        }
        return {
          ...old,
          items: old.items.map((i: any) => i.id === itemId ? { ...i, quantity } : i)
        }
      })

      if (previousCartsAll) {
        queryClient.setQueryData(['carts', 'all'], (oldCarts: any) => {
          if (!oldCarts) return oldCarts
          return oldCarts.map((c: any) => {
            if (c.businessId === businessId) {
               if (quantity === 0) return { ...c, items: c.items.filter((i: any) => i.id !== itemId) }
               return { ...c, items: c.items.map((i: any) => i.id === itemId ? { ...i, quantity } : i) }
            }
            return c
          })
        })
      }
      return { previousCart, previousCartsAll }
    },
    onError: (_err, _newTodo, context: any) => {
      if (context?.previousCart) queryClient.setQueryData(['cart', businessId], context.previousCart)
      if (context?.previousCartsAll) queryClient.setQueryData(['carts', 'all'], context.previousCartsAll)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', businessId] })
      queryClient.invalidateQueries({ queryKey: ['carts', 'all'] })
    }
  })

  const placeOrder = async () => {
    if (!address.trim()) {
      setAddressError(true)
      return
    }

    setPlacing(true)
    setStockErrors([])
    try {
      const { data: order } = await apiClient.post(`/orders`, { businessId, deliveryAddress: address, customerNote: note })
      setOrderSuccess(true)
      setTimeout(() => navigate(`/orders/${order.id}`), 2500)
    } catch (err: any) {
      if (err.response?.data?.error === 'STOCK_UNAVAILABLE') {
        setStockErrors(err.response.data.items)
      }
      console.error('Failed to place order', err)
    } finally {
      setPlacing(false)
    }
  }

  // ─── Order Success 🎉 ──────────────────────────────────
  if (orderSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-gray-50 pb-20 overflow-hidden relative">
        {/* CSS Confetti */}
        {Array.from({ length: 45 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2.5 h-2.5 rounded-sm opacity-0 animate-[confetti_1.2s_ease-out_forwards]"
            style={{
              backgroundColor: ['#25D366', '#34B7F1', '#FFC107', '#FF5722', '#9C27B0'][Math.floor(Math.random() * 5)],
              left: `50%`,
              top: `45%`,
              '--tx': `${(Math.random() - 0.5) * 250}px`,
              '--ty': `${(Math.random() - 0.5) * 250 - 100}px`,
              '--r': `${Math.random() * 720}deg`,
              animationDelay: `${Math.random() * 0.15}s`,
            } as any}
          />
        ))}

        <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-[#25D366] text-white shadow-xl animate-[popIn_0.6s_cubic-bezier(0.175,0.885,0.32,1.275)] z-10">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M14 24L22 32L38 16" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" 
              className="animate-[drawCheck_0.5s_ease-out_0.35s_forwards]" 
              strokeDasharray="60" strokeDashoffset="60" />
          </svg>
        </div>
        <div className="text-center animate-[fadeInUp_0.5s_ease-out_0.6s_both] z-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-[15px] font-medium text-gray-500">Redirecting to order details...</p>
        </div>

        <style>{`
          @keyframes confetti {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) rotate(var(--r)); opacity: 0; }
          }
          @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes drawCheck {
            0% { stroke-dashoffset: 60; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes fadeInUp {
            0% { transform: translateY(15px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  // ─── Loading ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50">
        <header className="px-4 py-3 bg-[#075E54] text-white safe-area-top shrink-0">
          <h1 className="text-[17px] font-medium">Cart</h1>
        </header>
        <div className="flex-1 p-4 space-y-4">
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  // ─── Error ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-gray-600 font-medium">Failed to load cart</p>
        <button onClick={() => refetch()} className="px-6 py-2.5 rounded text-white bg-green-600 font-medium">Retry</button>
      </div>
    )
  }

  const items = data?.items || []
  const getItemPrice = (item: any) => {
    if (item.variant?.priceOverride != null) return Number(item.variant.priceOverride)
    return Number(item.product?.basePrice || 0)
  }
  const subtotal = items.reduce((s: number, i: any) => s + getItemPrice(i) * i.quantity, 0)
  const tax = Math.round(subtotal * 0.18)
  const total = subtotal + tax

  // ─── Empty Cart ────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-200 text-3xl">🛒</div>
        <h3 className="text-[17px] font-medium text-gray-900">Your cart is empty</h3>
        <p className="text-[14px] text-gray-500 text-center mb-2">Browse the catalog to add items</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-full text-[15px] font-medium text-white bg-[#128C7E]">Browse Catalog</button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full relative">
      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-3 safe-area-top shrink-0 bg-[#075E54] text-white">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center -ml-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="text-[17px] font-medium flex-1">Cart <span className="text-[14px] font-normal opacity-80 pl-1">({items.length} items)</span></h1>
      </header>

      {/* Items */}
      <div className="flex-1 overflow-y-auto pb-64">
        <div className="bg-white border-b border-gray-200 pb-2">
          {items.map((item: any, idx: number) => (
            <div key={item.id} 
              onClick={() => navigate(`/catalog/${businessId}/product/${item.productId}`)}
              className="p-4 flex gap-4 cursor-pointer active:bg-gray-50 transition-colors" 
              style={{ borderBottom: idx < items.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              <div className="w-16 h-16 rounded overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                {item.product?.images?.[0]?.url ? (
                  <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <p className="text-[16px] text-gray-900 font-medium truncate leading-tight">{item.product?.name || 'Product'}</p>
                  {item.variant && <p className="text-[13px] text-gray-500 mt-1">{item.variant.label}</p>}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[15px] font-medium text-green-700">₹{(getItemPrice(item) * item.quantity).toLocaleString('en-IN')}</p>
                  
                  {/* Quantity control */}
                  <div className="flex items-center gap-4 bg-gray-100 rounded px-2 py-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateQuantity.mutate({ itemId: item.id, quantity: item.quantity - 1 }) }}
                      className="text-green-700 font-bold text-lg leading-none py-1 px-2"
                    >
                      {item.quantity === 1 ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> : '−'}
                    </button>
                    <span className="text-[14px] font-medium min-w-[12px] text-center">{item.quantity}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 }) }}
                      className="text-green-700 font-bold text-lg leading-none py-1 px-2"
                    >+</button>
                  </div>
                </div>
                
                {(() => {
                  const stockErr = stockErrors.find(e => e.variantId ? e.variantId === item.variantId : e.productId === item.productId)
                  if (!stockErr) return null
                  return (
                    <div className="mt-3 text-[12px] font-medium text-red-600 bg-red-50 p-2 rounded-md">
                      Requested {stockErr.requested}, but only {stockErr.available} available in stock.
                    </div>
                  )
                })()}
              </div>
            </div>
          ))}
        </div>

        {/* Delivery Address */}
        <div className="mt-3 bg-white p-4 border-t border-gray-200">
          <p className="text-[14px] font-medium text-gray-900 mb-2">Delivery Address <span className="text-red-500">*</span></p>
          <textarea
            value={address}
            onChange={e => { setAddress(e.target.value); setAddressError(false) }}
            placeholder="Enter complete delivery address..."
            rows={2}
            className={`w-full p-3 rounded text-[14px] outline-none border transition-colors ${
              addressError ? 'bg-red-50 border-red-300 text-red-900 placeholder:text-red-400 focus:border-red-500' : 'bg-gray-50 border-gray-200 text-gray-700 focus:border-green-600'
            }`}
          />
          {addressError && <p className="text-[12px] text-red-500 mt-1">Delivery address is required to place order.</p>}
        </div>

        {/* Custom Note */}
        <div className="bg-white p-4 border-y border-gray-200 mt-2">
          <p className="text-[14px] font-medium text-gray-900 mb-2">Delivery Note (Optional)</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add instructions for the business..."
            rows={2}
            className="w-full bg-gray-50 p-3 rounded text-[14px] text-gray-700 outline-none border border-gray-200 focus:border-green-600"
          />
        </div>
      </div>

      {/* Checkout Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pt-4 pb-4 px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[14px] text-gray-600">Subtotal</span>
          <span className="text-[14px] text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[14px] text-gray-600">Tax</span>
          <span className="text-[14px] text-gray-900">₹{tax.toLocaleString('en-IN')}</span>
        </div>
        
        <button 
          onClick={placeOrder} 
          disabled={placing}
          className="w-full bg-[#128C7E] text-white rounded-full py-3.5 flex items-center justify-between px-6 font-medium active:bg-[#075E54] transition-colors"
        >
          {placing ? (
            <div className="flex items-center justify-center gap-2 w-full">
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               <span className="text-[16px]">Placing Order...</span>
            </div>
          ) : (
            <>
              <div className="flex flex-col text-left">
                <span className="text-[13px] opacity-90 leading-none">Total</span>
                <span className="text-[16px] leading-tight">₹{total.toLocaleString('en-IN')}</span>
              </div>
              <span className="text-[16px]">Place Order {'>'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
