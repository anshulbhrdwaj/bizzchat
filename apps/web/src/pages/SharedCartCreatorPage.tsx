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

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', customerSearch],
    queryFn: async () => {
      const { data } = await apiClient.get(`/chats?search=${customerSearch}`)
      return data
    },
  })

  // Fetch own catalog
  const { data: catalog } = useQuery({
    queryKey: ['own-catalog'],
    queryFn: async () => {
      const { data } = await apiClient.get('/business/catalog')
      return data
    },
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
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/dashboard')}
          className="w-9 h-9 rounded-xl flex items-center justify-center touch-target"
          style={{ color: 'var(--color-text-primary)' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Share Cart</h1>
      </header>

      {/* Stepper */}
      <div className="px-4 pb-4 flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className="flex items-center gap-1.5 flex-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{
                  background: i <= step ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: i <= step ? 'white' : 'var(--color-text-muted)',
                }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-[10px] font-medium truncate hidden md:block" style={{ color: i <= step ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 rounded" style={{ background: i < step ? 'var(--color-primary)' : 'var(--glass-border)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Step 1: Select Customer */}
        {step === 0 && (
          <div className="animate-fade-up">
            <input type="text" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-4"
              style={{ background: 'var(--color-surface)', border: '1.5px solid var(--glass-border)', color: 'var(--color-text-primary)', caretColor: 'var(--color-primary)' }} />
            {customers.map((chat: any) => {
              const user = chat.members?.find((m: any) => m.user)?.user
              if (!user) return null
              const isSelected = selectedCustomer?.id === user.id
              return (
                <button key={user.id} onClick={() => setSelectedCustomer(user)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2"
                  style={{
                    background: isSelected ? 'var(--color-primary-light)' : 'transparent',
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--glass-border)',
                  }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))' }}>
                    <span className="text-xs font-bold text-white">{getInitials(user.name)}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{user.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{user.phone}</p>
                  </div>
                  {isSelected && <span className="ml-auto text-sm" style={{ color: 'var(--color-primary)' }}>✓</span>}
                </button>
              )
            })}
            {customers.length === 0 && (
              <p className="text-center py-8 text-xs" style={{ color: 'var(--color-text-muted)' }}>No customers found</p>
            )}
          </div>
        )}

        {/* Step 2: Build Cart */}
        {step === 1 && (
          <div className="animate-fade-up">
            {/* Cart items */}
            {cartItems.length > 0 && (
              <div className="mb-4 glass-card p-3">
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Cart ({cartItems.length} items)</p>
                {cartItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-2" style={{ borderBottom: i < cartItems.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                    <p className="text-xs flex-1 truncate" style={{ color: 'var(--color-text-body)' }}>{item.product.name} ×{item.quantity}</p>
                    <p className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</p>
                    <button onClick={() => setCartItems(cartItems.filter((_, j) => j !== i))} className="text-xs" style={{ color: 'var(--color-error)' }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Browse catalog */}
            {(catalog?.collections || []).map((col: any) => (
              <div key={col.id} className="mb-4">
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>{col.name}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(col.products || []).map((product: any) => (
                    <button key={product.id}
                      onClick={() => setCartItems([...cartItems, { product, price: product.basePrice, quantity: 1, variantId: null, note: '' }])}
                      className="rounded-xl overflow-hidden text-left" style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)' }}>
                      <div className="aspect-square flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
                        {product.images?.[0]?.url ? <img src={product.images[0].url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">📦</span>}
                      </div>
                      <div className="p-2">
                        <p className="text-[10px] font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{product.name}</p>
                        <p className="text-[10px] font-bold" style={{ color: 'var(--color-primary)' }}>₹{Number(product.basePrice).toLocaleString('en-IN')}</p>
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
          <div className="animate-fade-up space-y-4">
            {/* Per-item notes */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Item Notes</p>
              {cartItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 mb-2">
                  <p className="text-xs font-medium flex-1 truncate" style={{ color: 'var(--color-text-body)' }}>{item.product.name}</p>
                  <input type="text" value={item.note} onChange={e => {
                    const updated = [...cartItems]
                    updated[i] = { ...updated[i], note: e.target.value }
                    setCartItems(updated)
                  }} placeholder="Add note..." className="w-40 px-3 py-1.5 rounded-lg text-xs outline-none"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', color: 'var(--color-text-primary)' }} />
                </div>
              ))}
            </div>

            {/* Cart note */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-primary)' }}>Cart Note</label>
              <textarea value={cartNote} onChange={e => setCartNote(e.target.value)}
                placeholder="Add a message for the customer..." rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: 'var(--color-surface)', border: '1.5px solid var(--glass-border)', color: 'var(--color-text-primary)', caretColor: 'var(--color-primary)' }} />
            </div>

            {/* Expiry */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-primary)' }}>Cart Expiry</label>
              <div className="flex gap-2">
                {[3, 7, 14, 30].map(d => (
                  <button key={d} onClick={() => setExpiryDays(d)}
                    className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: expiryDays === d ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: expiryDays === d ? 'white' : 'var(--color-text-muted)',
                    }}>
                    {d} days
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Preview & Send */}
        {step === 3 && (
          <div className="animate-fade-up">
            {/* Customer */}
            <div className="glass-card p-4 mb-4">
              <p className="text-[10px] font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Sending to</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))' }}>
                  <span className="text-xs font-bold text-white">{getInitials(selectedCustomer?.name)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{selectedCustomer?.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{selectedCustomer?.phone}</p>
                </div>
              </div>
            </div>

            {/* Items preview */}
            <div className="glass-card p-4 mb-4">
              <p className="text-[10px] font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Items ({cartItems.length})</p>
              {cartItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < cartItems.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.product.name}</p>
                    {item.note && <p className="text-[10px] italic" style={{ color: 'var(--color-text-muted)' }}>"{item.note}"</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>×{item.quantity}</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-2" style={{ borderTop: '1px solid var(--glass-border)' }}>
                <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Total</span>
                <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Meta */}
            <div className="glass-card p-4 space-y-2">
              {cartNote && <div><p className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>Note</p><p className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{cartNote}</p></div>}
              <div><p className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>Expires in</p><p className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{expiryDays} days</p></div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-4 py-3 safe-area-bottom" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--glass-border)' }}>
        <button
          onClick={() => step < 3 ? setStep(step + 1) : sendCart.mutate()}
          disabled={!canProceed || sending}
          className="w-full h-14 rounded-xl font-semibold text-sm transition-all"
          style={{
            background: canProceed ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))' : 'var(--color-surface)',
            color: canProceed ? 'white' : 'var(--color-text-muted)',
            boxShadow: canProceed ? '0 4px 20px rgba(91, 63, 217, 0.3)' : 'none',
          }}>
          {sending ? (
            <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</span>
          ) : step < 3 ? `Continue · Step ${step + 2} of 4` : `Confirm & Send · ₹${subtotal.toLocaleString('en-IN')}`}
        </button>
      </div>
    </div>
  )
}
