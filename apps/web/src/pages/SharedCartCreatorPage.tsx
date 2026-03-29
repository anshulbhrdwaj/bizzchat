import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { getInitials } from '@/lib/utils'

const STEPS = ['Select Customer', 'Build Cart', 'Notes & Expiry', 'Preview & Send']

export default function SharedCartCreatorPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [cartItems, setCartItems] = useState<any[]>([])
  const [cartNote, setCartNote] = useState('')
  const [expiryDays, setExpiryDays] = useState(7)
  const [customerSearch, setCustomerSearch] = useState('')
  const [sending, setSending] = useState(false)

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', customerSearch],
    queryFn: async () => { const { data } = await apiClient.get(`/chats?search=${customerSearch}`); return data },
  })

  const { data: catalog } = useQuery({
    queryKey: ['own-catalog'],
    queryFn: async () => { const { data } = await apiClient.get('/business/catalog'); return data },
    enabled: step >= 1,
  })

  const sendCart = useMutation({
    mutationFn: async () => {
      setSending(true)
      await apiClient.post('/business/shared-carts', {
        recipientId: selectedCustomer?.id,
        items: cartItems.map(i => ({ productId: i.product.id, variantId: i.variantId, quantity: i.quantity, note: i.note })),
        note: cartNote,
        expiresInDays: expiryDays,
      })
    },
    onSuccess: () => { navigate('/dashboard') },
    onSettled: () => setSending(false),
  })

  const subtotal = cartItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0)
  const canProceed = step === 0 ? !!selectedCustomer : step === 1 ? cartItems.length > 0 : true

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="safe-area-top bg-[#075E54] text-white">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/dashboard')} className="w-9 h-9 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 className="text-[20px] font-medium">Share Cart</h1>
        </div>
      </header>

      {/* Stepper */}
      <div className="px-4 py-3 flex items-center gap-1 bg-white border-b border-gray-100">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className="flex items-center gap-1.5 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                i <= step ? 'bg-[#128C7E] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-medium truncate hidden md:block ${i <= step ? 'text-gray-900' : 'text-gray-400'}`}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded ${i < step ? 'bg-[#128C7E]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Step 1: Select Customer */}
        {step === 0 && (
          <div className="pt-3">
            <input type="text" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full px-4 py-3 rounded-lg text-[15px] outline-none mb-4 bg-gray-100 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#128C7E]" />
            {customers.map((chat: any) => {
              const user = chat.members?.find((m: any) => m.user)?.user
              if (!user) return null
              const isSelected = selectedCustomer?.id === user.id
              return (
                <button key={user.id} onClick={() => setSelectedCustomer(user)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 border ${
                    isSelected ? 'border-[#128C7E] bg-[#128C7E]/5' : 'border-gray-200'
                  }`}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#128C7E]">
                    <span className="text-[12px] font-bold text-white">{getInitials(user.name)}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-[15px] text-gray-900">{user.name}</p>
                    <p className="text-[12px] text-gray-500">{user.phone}</p>
                  </div>
                  {isSelected && <span className="ml-auto text-[#128C7E] font-bold">✓</span>}
                </button>
              )
            })}
            {customers.length === 0 && (
              <p className="text-center py-8 text-[14px] text-gray-400">No customers found</p>
            )}
          </div>
        )}

        {/* Step 2: Build Cart */}
        {step === 1 && (
          <div className="pt-3">
            {cartItems.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-[13px] font-medium text-gray-900 mb-2">Cart ({cartItems.length} items)</p>
                {cartItems.map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 py-2 ${i < cartItems.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <p className="text-[13px] flex-1 truncate text-gray-700">{item.product.name} ×{item.quantity}</p>
                    <p className="text-[13px] font-bold text-[#128C7E]">₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</p>
                    <button onClick={() => setCartItems(cartItems.filter((_, j) => j !== i))} className="text-red-400 text-[13px]">✕</button>
                  </div>
                ))}
              </div>
            )}

            {(catalog?.collections || []).map((col: any) => (
              <div key={col.id} className="mb-4">
                <p className="text-[13px] font-medium text-gray-500 mb-2">{col.name}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(col.products || []).map((product: any) => (
                    <button key={product.id}
                      onClick={() => setCartItems([...cartItems, { product, price: product.basePrice, quantity: 1, variantId: null, note: '' }])}
                      className="rounded-lg overflow-hidden text-left bg-gray-50 border border-gray-100 active:bg-gray-100">
                      <div className="aspect-square flex items-center justify-center bg-gray-100">
                        {product.images?.[0]?.url ? <img src={product.images[0].url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">📦</span>}
                      </div>
                      <div className="p-2">
                        <p className="text-[12px] font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-[12px] font-bold text-[#128C7E]">₹{Number(product.basePrice).toLocaleString('en-IN')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Notes & Expiry */}
        {step === 2 && (
          <div className="pt-3 space-y-4">
            <div>
              <p className="text-[13px] font-medium text-gray-900 mb-2">Item Notes</p>
              {cartItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 mb-2">
                  <p className="text-[13px] flex-1 truncate text-gray-700">{item.product.name}</p>
                  <input type="text" value={item.note} onChange={e => {
                    const updated = [...cartItems]
                    updated[i] = { ...updated[i], note: e.target.value }
                    setCartItems(updated)
                  }} placeholder="Add note..."
                    className="w-40 px-3 py-1.5 rounded-lg text-[13px] outline-none bg-gray-100 border border-gray-200 text-gray-900 focus:border-[#128C7E]" />
                </div>
              ))}
            </div>

            <div>
              <label className="text-[13px] font-medium text-gray-900 mb-2 block">Cart Note</label>
              <textarea value={cartNote} onChange={e => setCartNote(e.target.value)}
                placeholder="Add a message for the customer..." rows={3}
                className="w-full px-4 py-3 rounded-lg text-[15px] outline-none resize-none bg-gray-100 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#128C7E]" />
            </div>

            <div>
              <label className="text-[13px] font-medium text-gray-900 mb-2 block">Cart Expiry</label>
              <div className="flex gap-2">
                {[3, 7, 14, 30].map(d => (
                  <button key={d} onClick={() => setExpiryDays(d)}
                    className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                      expiryDays === d ? 'bg-[#128C7E] text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {d} days
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Preview & Send */}
        {step === 3 && (
          <div className="pt-3">
            {/* Customer */}
            <div className="p-4 mb-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-[12px] font-medium text-gray-500 mb-2">Sending to</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#128C7E]">
                  <span className="text-[12px] font-bold text-white">{getInitials(selectedCustomer?.name)}</span>
                </div>
                <div>
                  <p className="text-[15px] font-medium text-gray-900">{selectedCustomer?.name}</p>
                  <p className="text-[12px] text-gray-500">{selectedCustomer?.phone}</p>
                </div>
              </div>
            </div>

            {/* Items preview */}
            <div className="p-4 mb-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-[12px] font-medium text-gray-500 mb-2">Items ({cartItems.length})</p>
              {cartItems.map((item, i) => (
                <div key={i} className={`flex items-center justify-between py-2 ${i < cartItems.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div>
                    <p className="text-[14px] text-gray-900">{item.product.name}</p>
                    {item.note && <p className="text-[12px] italic text-gray-400">"{item.note}"</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-bold text-[#128C7E]">₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</p>
                    <p className="text-[12px] text-gray-500">×{item.quantity}</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-2 border-t border-gray-200">
                <span className="text-[14px] font-bold text-gray-900">Total</span>
                <span className="text-[15px] font-bold text-[#128C7E]">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Meta */}
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
              {cartNote && <div><p className="text-[12px] font-medium text-gray-500">Note</p><p className="text-[14px] text-gray-900">{cartNote}</p></div>}
              <div><p className="text-[12px] font-medium text-gray-500">Expires in</p><p className="text-[14px] text-gray-900">{expiryDays} days</p></div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-4 py-3 safe-area-bottom bg-white border-t border-gray-200">
        <button
          onClick={() => step < 3 ? setStep(step + 1) : sendCart.mutate()}
          disabled={!canProceed || sending}
          className={`w-full py-3.5 rounded-full text-[16px] font-medium transition-all ${
            canProceed ? 'bg-[#128C7E] text-white active:bg-[#075E54]' : 'bg-gray-200 text-gray-400'
          } ${sending ? 'opacity-70' : ''}`}>
          {sending ? (
            <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</span>
          ) : step < 3 ? `Continue · Step ${step + 2} of 4` : `Confirm & Send · ₹${subtotal.toLocaleString('en-IN')}`}
        </button>
      </div>
    </div>
  )
}
