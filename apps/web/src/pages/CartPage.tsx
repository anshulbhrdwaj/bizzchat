import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import type { SavedAddress } from '@bizchat/shared'

// ─── Address Management Sheet ─────────────────────────────
function AddressSheet({
  onSelect,
  selectedId,
  onClose,
}: {
  onSelect: (addr: SavedAddress) => void
  selectedId: string | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<SavedAddress | null>(null)
  const [formLabel, setFormLabel] = useState('Home')
  const [formLine1, setFormLine1] = useState('')
  const [formDefault, setFormDefault] = useState(false)
  const [formError, setFormError] = useState('')

  const { data: addresses = [], isLoading } = useQuery<SavedAddress[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data } = await apiClient.get('/addresses')
      return data
    },
  })

  const save = useMutation({
    mutationFn: async () => {
      if (!formLine1.trim()) throw new Error('Address is required')
      const payload = { label: formLabel.trim() || 'Home', line1: formLine1.trim(), isDefault: formDefault }
      if (editing) {
        const { data } = await apiClient.put(`/addresses/${editing.id}`, payload)
        return data
      } else {
        const { data } = await apiClient.post('/addresses', payload)
        return data
      }
    },
    onSuccess: (saved: SavedAddress) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setShowForm(false)
      setEditing(null)
      resetForm()
      onSelect(saved)
    },
    onError: (e: any) => setFormError(e.message || 'Failed to save'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/addresses/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })

  const resetForm = () => {
    setFormLabel('Home')
    setFormLine1('')
    setFormDefault(false)
    setFormError('')
  }

  const openNew = () => {
    resetForm()
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (addr: SavedAddress) => {
    setFormLabel(addr.label)
    setFormLine1(addr.line1)
    setFormDefault(addr.isDefault)
    setFormError('')
    setEditing(addr)
    setShowForm(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="mt-auto bg-white rounded-t-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="px-4 pb-2 flex items-center justify-between shrink-0">
          <h2 className="text-[16px] font-semibold text-gray-900">Delivery Addresses</h2>
          <button onClick={() => { setShowForm(false); onClose() }} className="text-gray-400 text-[22px] leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 pb-4">
          {isLoading && <p className="text-center text-gray-400 py-6 text-[14px]">Loading…</p>}

          {!isLoading && !showForm && (
            <>
              {addresses.length === 0 && (
                <p className="text-center text-gray-400 py-4 text-[14px]">No saved addresses yet</p>
              )}
              <div className="space-y-2 mb-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${selectedId === addr.id ? 'border-[#128C7E] bg-[#128C7E]/5' : 'border-gray-200'}`}
                  >
                    <button className="flex-1 text-left" onClick={() => { onSelect(addr); onClose() }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12px] font-semibold text-[#128C7E] bg-[#128C7E]/10 px-2 py-0.5 rounded-full">{addr.label}</span>
                        {addr.isDefault && <span className="text-[11px] text-gray-400 font-medium">Default</span>}
                      </div>
                      <p className="text-[14px] text-gray-800 leading-relaxed">{addr.line1}</p>
                    </button>
                    <div className="flex gap-3 shrink-0 mt-1">
                      <button onClick={() => openEdit(addr)} className="text-gray-400 hover:text-[#128C7E] transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => remove.mutate(addr.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={openNew}
                className="w-full py-3 rounded-xl border-2 border-dashed border-[#128C7E]/40 text-[#128C7E] text-[14px] font-semibold flex items-center justify-center gap-2 active:bg-[#128C7E]/5 transition-colors"
              >
                + Add New Address
              </button>
            </>
          )}

          {showForm && (
            <div className="space-y-4 pt-1">
              <h3 className="text-[15px] font-semibold text-gray-800">{editing ? 'Edit Address' : 'New Address'}</h3>
              <div>
                <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Label</label>
                <div className="flex gap-2 mt-1.5">
                  {['Home', 'Work', 'Other'].map(l => (
                    <button
                      key={l}
                      onClick={() => setFormLabel(l)}
                      className={`px-4 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${formLabel === l ? 'bg-[#128C7E] text-white border-[#128C7E]' : 'bg-white text-gray-600 border-gray-200'}`}
                    >{l}</button>
                  ))}
                  {!['Home', 'Work', 'Other'].includes(formLabel) && (
                    <input
                      className="flex-1 px-3 py-1.5 rounded-full text-[13px] border border-gray-200 outline-none focus:border-[#128C7E]"
                      placeholder="Custom label"
                      value={formLabel}
                      onChange={e => setFormLabel(e.target.value)}
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Address</label>
                <textarea
                  value={formLine1}
                  onChange={e => { setFormLine1(e.target.value); setFormError('') }}
                  placeholder="House/flat number, street, area, city..."
                  rows={3}
                  className="mt-1.5 w-full p-3 rounded-xl text-[14px] border border-gray-200 outline-none focus:border-[#128C7E] bg-gray-50 resize-none"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={formDefault} onChange={e => setFormDefault(e.target.checked)} className="w-4 h-4 text-[#128C7E] rounded" />
                <span className="text-[13px] text-gray-700 font-medium">Set as default delivery address</span>
              </label>
              {formError && <p className="text-[12px] text-red-500">{formError}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setShowForm(false); setEditing(null); resetForm() }} className="flex-1 py-3 rounded-full border border-gray-200 text-[14px] font-semibold text-gray-600">Cancel</button>
                <button onClick={() => save.mutate()} disabled={save.isPending} className="flex-1 py-3 rounded-full bg-[#128C7E] text-white text-[14px] font-semibold disabled:opacity-50">
                  {save.isPending ? 'Saving…' : 'Save Address'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CartPage ─────────────────────────────────────────────
export default function CartPage() {
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null)
  const [showAddressSheet, setShowAddressSheet] = useState(false)
  const [addressError, setAddressError] = useState(false)
  const [note, setNote] = useState('')
  const [placing, setPlacing] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [stockErrors, setStockErrors] = useState<any[]>([])

  // Fetch saved addresses and auto-select default
  const { data: addresses = [] } = useQuery<SavedAddress[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data } = await apiClient.get('/addresses')
      return data
    },
  })

  // Fetch business pricing settings
  const { data: bizProfile } = useQuery({
    queryKey: ['biz-pricing', businessId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/business/${businessId}/profile`)
      return data
    },
    enabled: !!businessId,
  })
  const taxRate = Number(bizProfile?.taxRate ?? 18)
  const deliveryCharge = Number(bizProfile?.deliveryCharge ?? 0)

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const def = addresses.find(a => a.isDefault) || addresses[0]
      setSelectedAddress(def)
    }
  }, [addresses])

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
    if (!selectedAddress) {
      setAddressError(true)
      return
    }
    setPlacing(true)
    setStockErrors([])
    try {
      const { data: order } = await apiClient.post(`/orders`, {
        businessId,
        deliveryAddress: selectedAddress.line1,
        customerNote: note,
      })
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
          @keyframes confetti { 0% { transform: translate(0, 0) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) rotate(var(--r)); opacity: 0; } }
          @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
          @keyframes drawCheck { 0% { stroke-dashoffset: 60; } 100% { stroke-dashoffset: 0; } }
          @keyframes fadeInUp { 0% { transform: translateY(15px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        `}</style>
      </div>
    )
  }

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
  const tax = Math.round(subtotal * taxRate / 100)
  const total = subtotal + tax + deliveryCharge

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
        <button
          onClick={() => { setShowAddressSheet(true); setAddressError(false) }}
          className={`w-full mt-3 bg-white p-4 border-t border-b text-left transition-colors ${addressError ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Delivery Address <span className="text-red-500">*</span>
              </p>
              {selectedAddress ? (
                <div>
                  <span className="text-[11px] font-semibold text-[#128C7E] bg-[#128C7E]/10 px-2 py-0.5 rounded-full mr-2">{selectedAddress.label}</span>
                  <p className="text-[14px] text-gray-800 mt-1 leading-relaxed">{selectedAddress.line1}</p>
                </div>
              ) : (
                <p className="text-[14px] text-gray-400">Tap to add or select a delivery address</p>
              )}
              {addressError && <p className="text-[12px] text-red-500 mt-1">Please select a delivery address</p>}
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className="shrink-0 ml-3"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </button>

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
        <div className="flex items-center justify-between mb-2">
          <span className="text-[14px] text-gray-600">Tax ({taxRate}%)</span>
          <span className="text-[14px] text-gray-900">₹{tax.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[14px] text-gray-600">Delivery Charge</span>
          <span className="text-[14px] text-gray-900">{deliveryCharge > 0 ? `₹${deliveryCharge.toLocaleString('en-IN')}` : 'Free'}</span>
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

      {/* Address Sheet */}
      {showAddressSheet && (
        <AddressSheet
          selectedId={selectedAddress?.id ?? null}
          onSelect={(addr) => { setSelectedAddress(addr); setAddressError(false) }}
          onClose={() => setShowAddressSheet(false)}
        />
      )}
    </div>
  )
}
