import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { getInitials } from '@/lib/utils'

const STEPS = ['Select Contact', 'Pick Products', 'Notes & Expiry', 'Preview & Send']

interface CartItem {
  product: any
  price: number | string
  quantity: number
  variantId: string | null
  note: string
}

export default function SharedCartCreatorPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartNote, setCartNote] = useState('')
  const [expiryDays, setExpiryDays] = useState(7)
  const [contactSearch, setContactSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [activeCollection, setActiveCollection] = useState<string>('all')

  // ── Contacts ──────────────────────────────────────────────
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data } = await apiClient.get('/contacts')
      return data
    },
  })

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return contacts
    const q = contactSearch.toLowerCase()
    return contacts.filter((c: any) => {
      const name = (c.savedName || c.displayName || c.name || '').toLowerCase()
      const phone = (c.phone || '').toLowerCase()
      return name.includes(q) || phone.includes(q)
    })
  }, [contacts, contactSearch])

  // ── Catalog ────────────────────────────────────────────────
  const { data: catalogData } = useQuery({
    queryKey: ['own-catalog-manager'],
    queryFn: async () => {
      const { data } = await apiClient.get('/catalog/manager')
      return data
    },
    enabled: step >= 1,
  })

  const collections = catalogData?.collections || []
  // Build "All Products" flat list
  const allProducts: any[] = useMemo(() => {
    if (!collections.length) return []
    const seen = new Set<string>()
    const all: any[] = []
    for (const col of collections) {
      for (const p of (col.products || [])) {
        if (!seen.has(p.id)) { seen.add(p.id); all.push(p) }
      }
    }
    return all
  }, [collections])

  const displayCollections = useMemo(() => {
    return [{ id: 'all', name: 'All Items', products: allProducts }, ...collections]
  }, [collections, allProducts])

  const activeProducts = useMemo(() => {
    if (activeCollection === 'all') return allProducts
    return collections.find((c: any) => c.id === activeCollection)?.products || []
  }, [activeCollection, collections, allProducts])

  // ── Send Cart ─────────────────────────────────────────────
  const sendCart = useMutation({
    mutationFn: async () => {
      setSending(true)
      const { data } = await apiClient.post('/shared-carts', {
        recipientId: selectedContact?.contactId || selectedContact?.id,
        items: cartItems.map(i => ({
          productId: i.product.id,
          variantId: i.variantId,
          quantity: i.quantity,
          note: i.note,
        })),
        note: cartNote,
        expiresInDays: expiryDays,
      })
      return data
    },
    onSuccess: (data) => {
      // Navigate to the chat if created, otherwise dashboard
      if (data?.chatId) {
        navigate(`/chat/${data.chatId}`)
      } else {
        navigate('/chats')
      }
    },
    onError: () => setSending(false),
    onSettled: () => setSending(false),
  })

  const subtotal = cartItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0)

  const canProceed =
    step === 0 ? !!selectedContact :
    step === 1 ? cartItems.length > 0 :
    true

  const addToCart = (product: any) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id && i.variantId === null)
      if (existing) {
        return prev.map(i => i.product.id === product.id && i.variantId === null
          ? { ...i, quantity: i.quantity + 1 }
          : i
        )
      }
      return [...prev, { product, price: product.basePrice, quantity: 1, variantId: null, note: '' }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(i => i.product.id !== productId))
  }

  const adjustQty = (productId: string, delta: number) => {
    setCartItems(prev => prev.flatMap(i => {
      if (i.product.id !== productId) return [i]
      const newQty = i.quantity + delta
      return newQty <= 0 ? [] : [{ ...i, quantity: newQty }]
    }))
  }

  const cartCount = (productId: string) =>
    cartItems.find(i => i.product.id === productId)?.quantity || 0

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="safe-area-top bg-[#075E54] text-white shrink-0">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full active:bg-white/10 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[18px] font-semibold">Share Catalogue</h1>
            <p className="text-[12px] text-white/70">{STEPS[step]}</p>
          </div>
          {cartItems.length > 0 && step >= 1 && (
            <div className="px-3 py-1 rounded-full bg-white/20 text-[13px] font-bold">
              {cartItems.length} items
            </div>
          )}
        </div>
      </header>

      {/* Stepper */}
      <div className="px-4 py-2.5 flex items-center gap-1 bg-white border-b border-gray-100 shrink-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                i < step ? 'bg-[#128C7E] text-white' : i === step ? 'bg-[#128C7E] text-white ring-2 ring-[#128C7E]/30' : 'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-medium truncate hidden sm:block ${i <= step ? 'text-gray-800' : 'text-gray-400'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-4 rounded flex-shrink-0 ${i < step ? 'bg-[#128C7E]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto pb-28">

        {/* ── Step 0: Select Contact ── */}
        {step === 0 && (
          <div className="pt-3 px-4">
            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                placeholder="Search contacts by name or phone…"
                className="w-full pl-9 pr-4 py-3 rounded-xl text-[15px] outline-none bg-gray-100 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#128C7E] focus:bg-white transition-colors"
              />
            </div>

            {contactsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <span className="text-4xl">👥</span>
                <p className="text-[15px] font-medium text-gray-500">No contacts found</p>
                <p className="text-[13px] text-gray-400 text-center">Add contacts from the Contacts page first</p>
                <button
                  onClick={() => navigate('/contacts')}
                  className="mt-1 px-5 py-2.5 rounded-full bg-[#128C7E] text-white text-[14px] font-medium active:bg-[#075E54] transition-colors"
                >
                  Go to Contacts
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((c: any) => {
                  const name = c.savedName || c.displayName || c.name || c.phone
                  const isSelected = selectedContact?.id === c.id
                  return (
                    <button
                      key={c.id}
                      id={`contact-${c.id}`}
                      onClick={() => setSelectedContact(c)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[#128C7E] bg-[#128C7E]/5 shadow-sm'
                          : 'border-gray-200 bg-white active:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#128C7E]' : 'bg-gray-200'}`}>
                        {c.avatarUrl ? (
                          <img src={c.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className={`text-[13px] font-bold ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                            {getInitials(name)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-[15px] font-medium text-gray-900 truncate">{name}</p>
                        <p className="text-[12px] text-gray-400">{c.phone}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#128C7E] flex items-center justify-center shrink-0">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Step 1: Pick Products ── */}
        {step === 1 && (
          <div>
            {/* Cart Summary Bar */}
            {cartItems.length > 0 && (
              <div className="mx-4 mt-3 p-3 rounded-xl bg-[#128C7E]/8 border border-[#128C7E]/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-semibold text-[#128C7E]">
                    {cartItems.length} product{cartItems.length > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-[13px] font-bold text-[#128C7E]">₹{subtotal.toLocaleString('en-IN')}</p>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {cartItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-[#128C7E]/20 shrink-0">
                      <span className="text-[12px] font-medium text-gray-800 max-w-[80px] truncate">{item.product.name}</span>
                      <span className="text-[11px] text-[#128C7E] font-bold">×{item.quantity}</span>
                      <button onClick={() => removeFromCart(item.product.id)} className="text-gray-400 hover:text-red-400 ml-0.5">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collection Tabs */}
            {displayCollections.length > 1 && (
              <div className="sticky top-0 bg-white border-b border-gray-100 z-10 mt-3">
                <div className="flex overflow-x-auto no-scrollbar px-4">
                  {displayCollections.map((col: any) => (
                    <button
                      key={col.id}
                      onClick={() => setActiveCollection(col.id)}
                      className={`px-4 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors shrink-0 ${
                        activeCollection === col.id
                          ? 'border-[#128C7E] text-[#128C7E]'
                          : 'border-transparent text-gray-400'
                      }`}
                    >
                      {col.name}
                      {col.products?.length > 0 && (
                        <span className="ml-1 text-[10px] opacity-60">({col.products.length})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Product Grid */}
            <div className="px-4 pt-3">
              {activeProducts.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-3 text-gray-400">
                  <span className="text-3xl">📦</span>
                  <p className="text-[14px]">No products in this collection</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {activeProducts.map((product: any) => {
                    const qty = cartCount(product.id)
                    return (
                      <div
                        key={product.id}
                        className="rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm"
                      >
                        {/* Image */}
                        <div className="aspect-square bg-gray-50 relative">
                          {product.images?.[0]?.url ? (
                            <img
                              src={product.images[0].url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-3xl text-gray-300">📦</span>
                            </div>
                          )}
                          {qty > 0 && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#128C7E] flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white">{qty}</span>
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="p-2.5">
                          <p className="text-[13px] font-semibold text-gray-900 truncate mb-0.5">{product.name}</p>
                          <p className="text-[13px] font-bold text-[#128C7E]">₹{Number(product.basePrice).toLocaleString('en-IN')}</p>
                        </div>
                        {/* Add / Adjust */}
                        <div className="px-2.5 pb-2.5">
                          {qty === 0 ? (
                            <button
                              onClick={() => addToCart(product)}
                              className="w-full py-2 rounded-lg bg-[#128C7E] text-white text-[12px] font-semibold active:bg-[#075E54] transition-colors"
                            >
                              + Add
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-[#128C7E] rounded-lg overflow-hidden">
                              <button
                                onClick={() => adjustQty(product.id, -1)}
                                className="w-8 h-8 flex items-center justify-center text-white text-[18px] font-bold active:bg-[#075E54] transition-colors"
                              >
                                −
                              </button>
                              <span className="text-[13px] font-bold text-white">{qty}</span>
                              <button
                                onClick={() => adjustQty(product.id, +1)}
                                className="w-8 h-8 flex items-center justify-center text-white text-[18px] font-bold active:bg-[#075E54] transition-colors"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Notes & Expiry ── */}
        {step === 2 && (
          <div className="px-4 pt-4 space-y-5">
            <div>
              <label className="text-[13px] font-semibold text-gray-700 mb-2 block">Message to Contact</label>
              <textarea
                value={cartNote}
                onChange={e => setCartNote(e.target.value)}
                placeholder="Hi! Check out this selection from our catalogue…"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-[15px] outline-none resize-none bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#128C7E] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="text-[13px] font-semibold text-gray-700 mb-3 block">Item Notes (optional)</label>
              {cartItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {item.product.images?.[0]?.url
                      ? <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                    }
                  </div>
                  <p className="text-[13px] font-medium flex-1 truncate text-gray-700">{item.product.name} <span className="text-gray-400">×{item.quantity}</span></p>
                  <input
                    type="text"
                    value={item.note}
                    onChange={e => {
                      const updated = [...cartItems]
                      updated[i] = { ...updated[i], note: e.target.value }
                      setCartItems(updated)
                    }}
                    placeholder="Note…"
                    className="w-32 px-3 py-2 rounded-xl text-[12px] outline-none bg-gray-100 border border-gray-200 text-gray-900 focus:border-[#128C7E] transition-colors"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-[13px] font-semibold text-gray-700 mb-3 block">Link expires in</label>
              <div className="flex gap-2 flex-wrap">
                {[1, 3, 7, 14, 30].map(d => (
                  <button
                    key={d}
                    onClick={() => setExpiryDays(d)}
                    className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all border ${
                      expiryDays === d
                        ? 'bg-[#128C7E] text-white border-[#128C7E]'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}
                  >
                    {d} {d === 1 ? 'day' : 'days'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Preview & Send ── */}
        {step === 3 && (
          <div className="px-4 pt-4 space-y-3">
            {/* Sending to */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Sending to</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center shrink-0">
                  <span className="text-[13px] font-bold text-white">
                    {getInitials(selectedContact?.savedName || selectedContact?.displayName || selectedContact?.name)}
                  </span>
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-gray-900">
                    {selectedContact?.savedName || selectedContact?.displayName || selectedContact?.name}
                  </p>
                  <p className="text-[12px] text-gray-400">{selectedContact?.phone}</p>
                </div>
              </div>
            </div>

            {/* Items preview */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                Catalogue ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})
              </p>
              {cartItems.map((item, i) => (
                <div key={i} className={`flex items-center justify-between py-2.5 ${i < cartItems.length - 1 ? 'border-b border-gray-200' : ''}`}>
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                      {item.product.images?.[0]?.url
                        ? <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-gray-900 truncate">{item.product.name}</p>
                      {item.note && <p className="text-[11px] italic text-gray-400">"{item.note}"</p>}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-[13px] font-bold text-[#128C7E]">₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-gray-400">×{item.quantity}</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2.5 mt-2 border-t border-gray-300">
                <span className="text-[14px] font-bold text-gray-900">Total value</span>
                <span className="text-[15px] font-bold text-[#128C7E]">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Meta */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              {cartNote && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Note</p>
                  <p className="text-[14px] text-gray-800">"{cartNote}"</p>
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Expires</p>
                <p className="text-[14px] text-gray-800">In {expiryDays} {expiryDays === 1 ? 'day' : 'days'}</p>
              </div>
            </div>

            {/* Info blurb */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#128C7E]/5 border border-[#128C7E]/15">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#128C7E] mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p className="text-[12px] text-[#128C7E] leading-relaxed">
                A chat message will be sent to <strong>{selectedContact?.savedName || selectedContact?.name}</strong> with your curated catalogue. They can browse, add items to their cart, and place an order.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-4 py-3 safe-area-bottom bg-white border-t border-gray-100 shrink-0">
        {step === 1 && cartItems.length > 0 && (
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[12px] text-gray-500">{cartItems.length} products · ₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
        )}
        <button
          id="shared-cart-cta"
          onClick={() => step < 3 ? setStep(step + 1) : sendCart.mutate()}
          disabled={!canProceed || sending}
          className={`w-full py-3.5 rounded-full text-[16px] font-semibold transition-all ${
            canProceed && !sending
              ? 'bg-[#128C7E] text-white active:bg-[#075E54] shadow-sm'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          {sending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending…
            </span>
          ) : step < 3 ? (
            <>Continue — Step {step + 2} of 4</>
          ) : (
            <>Send Catalogue · ₹{subtotal.toLocaleString('en-IN')}</>
          )}
        </button>
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  )
}
