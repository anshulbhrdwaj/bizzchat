import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { getInitials } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Product Drawer — slides up from the bottom, same-page experience
// ─────────────────────────────────────────────────────────────────────────────
function ProductDrawer({
  product,
  businessId,
  onClose,
}: {
  product: any
  businessId: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({})
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [added, setAdded] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [initialCartItems, setInitialCartItems] = useState<any[]>([])

  const { data: cart } = useQuery({
    queryKey: ['cart', businessId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/cart?businessId=${businessId}`)
      return data
    },
    enabled: !!businessId,
  })

  // Fetch full product details (includes variantGroups)
  const { data: fullProduct, isLoading: productLoading } = useQuery({
    queryKey: ['product', product.id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/catalog/products/${product.id}`)
      return data
    },
    placeholderData: product, // show shallow data immediately
  })

  const prod = fullProduct || product
  const hasVariants = (prod?.variantGroups || []).length > 0
  const totalVariantQty = Object.values(variantQuantities).reduce((a, b) => a + b, 0)
  const totalItems = hasVariants ? totalVariantQty : quantity

  // Pre-fill from cart
  useEffect(() => {
    if (prod && cart !== undefined && !initialized) {
      if (cart) {
        const items = cart.items?.filter((i: any) => i.productId === prod.id) || []
        if (items.length > 0) {
          setInitialCartItems(items)
          if ((prod.variantGroups || []).length > 0) {
            const vQs: Record<string, number> = {}
            items.forEach((i: any) => { if (i.variantId) vQs[i.variantId] = i.quantity })
            setVariantQuantities(vQs)
          } else {
            setQuantity(items[0].quantity)
          }
        }
      }
      setInitialized(true)
    }
  }, [prod, cart, initialized])

  const { displayPrice, isFrom } = useMemo(() => {
    if (!prod) return { displayPrice: 0, isFrom: false }
    const base = Number(prod.basePrice)
    const prices: number[] = [base]
    let variance = false
    for (const g of prod.variantGroups || []) {
      for (const v of g.values) {
        if (v.priceOverride && Number(v.priceOverride) !== base) {
          prices.push(Number(v.priceOverride))
          variance = true
        }
      }
    }
    return { displayPrice: Math.min(...prices), isFrom: variance }
  }, [prod])

  const handleAddToCart = async () => {
    if (totalItems === 0 && initialCartItems.length === 0) return
    setAddingToCart(true)
    try {
      const requests: Promise<any>[] = []
      if (hasVariants) {
        for (const [vId, qty] of Object.entries(variantQuantities)) {
          const existing = initialCartItems.find((i) => i.variantId === vId)
          if (existing) {
            if (qty !== existing.quantity) {
              requests.push(qty === 0
                ? apiClient.delete(`/cart/items/${existing.id}`)
                : apiClient.put(`/cart/items/${existing.id}`, { quantity: qty }))
            }
          } else if (qty > 0) {
            requests.push(apiClient.post('/cart/items', { businessId, productId: prod.id, variantId: vId, quantity: qty }))
          }
        }
        initialCartItems.forEach((item) => {
          if (variantQuantities[item.variantId] === undefined) {
            requests.push(apiClient.delete(`/cart/items/${item.id}`))
          }
        })
      } else {
        const existing = initialCartItems[0]
        if (existing) {
          if (quantity !== existing.quantity) {
            requests.push(quantity === 0
              ? apiClient.delete(`/cart/items/${existing.id}`)
              : apiClient.put(`/cart/items/${existing.id}`, { quantity }))
          }
        } else if (quantity > 0) {
          requests.push(apiClient.post('/cart/items', { businessId, productId: prod.id, variantId: null, quantity }))
        }
      }

      if (requests.length > 0) {
        await Promise.all(requests)
        queryClient.invalidateQueries({ queryKey: ['cart', businessId] })
        queryClient.invalidateQueries({ queryKey: ['carts', 'all'] })
        setInitialized(false)
      }
      setAdded(true)
      setTimeout(() => { setAdded(false); onClose() }, 1400)
    } catch (err) {
      console.error('Cart error', err)
    } finally {
      setAddingToCart(false)
    }
  }

  const images = prod?.images || []

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[92dvh] animate-slide-up">
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200 transition-colors z-10"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-36">
          {/* Hero Image */}
          <div className="relative w-full aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
            {productLoading && !images.length ? (
              <div className="w-full h-full bg-gray-200 animate-pulse" />
            ) : images.length > 0 ? (
              <img
                src={images[0]?.url}
                alt={prod.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-6xl text-gray-300">📦</span>
            )}
          </div>

          {/* Product info */}
          <div className="px-5 pt-4 pb-3">
            <h2 className="text-[20px] font-semibold text-[#111B21] leading-tight">{prod.name}</h2>
            <p className="text-[18px] font-medium text-[#111B21] mt-1">
              {isFrom && <span className="text-[#54656F] text-[14px] font-normal mr-1.5">From</span>}
              ₹{displayPrice.toLocaleString('en-IN')}
            </p>
            {prod.description && (
              <p className="text-[14px] text-[#54656F] leading-relaxed mt-2.5 whitespace-pre-wrap">{prod.description}</p>
            )}
          </div>

          {/* Variants */}
          {(prod?.variantGroups || []).length > 0 && (
            <div className="px-5 py-4 border-t border-gray-100">
              {prod.variantGroups.map((group: any) => (
                <div key={group.id} className="mb-5 last:mb-0">
                  <p className="text-[13px] font-semibold text-[#54656F] uppercase tracking-wider mb-3">{group.name}</p>
                  <div className="flex flex-col rounded-xl border border-gray-200 overflow-hidden">
                    {group.values.map((val: any, idx: number) => {
                      const vQty = variantQuantities[val.id] || 0
                      const vPrice = val.priceOverride ? Number(val.priceOverride) : Number(prod.basePrice)
                      return (
                        <div
                          key={val.id}
                          className={`flex items-center justify-between px-4 py-3 bg-white ${idx < group.values.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-medium text-[#111B21] truncate">{val.label}</p>
                            <p className="text-[13px] text-[#128C7E] font-semibold">₹{vPrice.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="flex items-center gap-3 bg-[#F0F2F5] rounded-full px-2 py-1 ml-3 shrink-0">
                            <button
                              onClick={() => setVariantQuantities(p => ({ ...p, [val.id]: Math.max(0, (p[val.id] || 0) - 1) }))}
                              className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[#128C7E] font-bold text-xl bg-white shadow-sm pb-[2px] active:bg-gray-50"
                            >−</button>
                            <span className="text-[15px] font-medium min-w-[20px] text-center text-[#111B21]">{vQty}</span>
                            <button
                              onClick={() => setVariantQuantities(p => ({ ...p, [val.id]: (p[val.id] || 0) + 1 }))}
                              className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[#128C7E] font-bold text-xl bg-white shadow-sm pb-[2px] active:bg-gray-50"
                            >+</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fixed bottom action bar */}
        <div className="absolute bottom-0 inset-x-0 bg-white border-t border-gray-100 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shrink-0">
          {added && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#075E54] text-white px-5 py-2 rounded-full text-[13px] font-semibold shadow-md animate-fade-up whitespace-nowrap">
              ✓ Cart updated
            </div>
          )}

          {/* Qty stepper (no-variant products) */}
          {!hasVariants && !productLoading && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-[14px] text-[#54656F] font-medium">Quantity</span>
              <div className="flex items-center gap-3 bg-[#F0F2F5] rounded-full px-2 py-1">
                <button
                  onClick={() => setQuantity(q => Math.max(0, q - 1))}
                  disabled={quantity <= 0}
                  className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[#128C7E] font-bold text-xl disabled:opacity-30 bg-white shadow-sm pb-[2px] active:bg-gray-50"
                >−</button>
                <span className="text-[15px] font-medium min-w-[20px] text-center text-[#111B21]">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(99, q + 1))}
                  disabled={quantity >= 99}
                  className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[#128C7E] font-bold text-xl disabled:opacity-30 bg-white shadow-sm pb-[2px] active:bg-gray-50"
                >+</button>
              </div>
            </div>
          )}

          <button
            disabled={(totalItems === 0 && initialCartItems.length === 0) || addingToCart}
            onClick={handleAddToCart}
            className={`w-full py-3.5 rounded-full text-[15px] font-semibold flex items-center justify-center gap-2 transition-all ${
              totalItems === 0 && initialCartItems.length === 0
                ? 'bg-[#F0F2F5] text-[#8696A0]'
                : 'bg-[#128C7E] text-white active:bg-[#075E54] shadow-md'
            }`}
          >
            {addingToCart && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {initialCartItems.length > 0
              ? totalItems === 0 ? 'Remove from cart' : `Update cart · ${totalItems} item${totalItems > 1 ? 's' : ''}`
              : totalItems === 0 ? 'Select options above' : `Add to cart · ${totalItems} item${totalItems > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-up  { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .animate-slide-up  { animation: slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1) both; }
        .animate-fade-in   { animation: fade-in  0.2s ease both; }
        .animate-fade-up   { animation: fade-up  0.25s ease both; }
      `}</style>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CatalogPage — main view with inline product drawer
// ─────────────────────────────────────────────────────────────────────────────
export default function CatalogPage() {
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Cart for badge count
  const { data: cart } = useQuery({
    queryKey: ['cart', businessId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/cart?businessId=${businessId}`)
      return data
    },
    enabled: !!businessId,
  })
  const cartCount = cart?.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0

  // Business + collections
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['catalog', businessId],
    queryFn: async () => {
      const [bizRes, catalogRes] = await Promise.all([
        apiClient.get(`/business/${businessId}/profile`),
        apiClient.get(`/catalog/business/${businessId}/collections`),
      ])
      return { business: bizRes.data, collections: catalogRes.data }
    },
    enabled: !!businessId,
  })

  useEffect(() => {
    if (!activeCollection) setActiveCollection('all')
  }, [activeCollection])

  const business = data?.business
  const rawCollections = data?.collections || []
  const collections = [{ id: 'all', name: 'All Items', isVirtual: true }, ...rawCollections]

  // Products for active tab
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['catalog-products', businessId, activeCollection, debouncedSearch],
    queryFn: async () => {
      if (!activeCollection) return { data: [] }
      let url = activeCollection === 'all'
        ? `/catalog/business/${businessId}/products?limit=50`
        : `/catalog/collections/${activeCollection}/products?limit=50`
      if (debouncedSearch) {
        url += `&q=${encodeURIComponent(debouncedSearch)}`
      }
      const { data } = await apiClient.get(url)
      return data
    },
    enabled: !!activeCollection && !!businessId,
  })

  const activeProducts = productsData?.data || []

  // ── Cart item count per product (for the badge)
  const cartQtyMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of cart?.items || []) {
      map[item.productId] = (map[item.productId] || 0) + item.quantity
    }
    return map
  }, [cart])

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-[#F0F2F5]">
        <header className="px-4 py-3 bg-[#075E54] text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 animate-pulse" />
          <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
        </header>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center w-full p-4 bg-white rounded-xl">
              <div className="w-[80px] h-[80px] rounded-xl bg-gray-200 animate-pulse shrink-0 mr-4" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#F0F2F5]">
        <p className="text-gray-500 font-medium">Failed to load catalog</p>
        <button onClick={() => refetch()} className="px-6 py-2.5 rounded-full text-white bg-[#128C7E] font-medium">Retry</button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 pb-20 md:pb-4">
      {/* Header */}
      <header className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3 safe-area-top shrink-0 shadow-sm bg-[#075E54] text-white">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center -ml-2 active:bg-white/10 rounded-full">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center shrink-0">
          {business?.logoUrl
            ? <img src={business.logoUrl} alt="" className="w-full h-full object-cover" />
            : <span className="text-gray-400 font-bold text-[13px]">{getInitials(business?.name)}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[17px] font-medium truncate">{business?.name || 'Catalogue'}</h1>
          <p className="text-[13px] text-white/80">Catalogue</p>
        </div>
        <button
          onClick={() => navigate(`/cart/${businessId}`)}
          className="relative w-10 h-10 flex items-center justify-center shrink-0 active:bg-white/10 rounded-full"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </button>
      </header>

      {/* Collection tabs */}
      {collections.length > 1 && (
        <div className="bg-white sticky top-[60px] md:top-[68px] z-10 border-b border-gray-200">
          <div className="flex overflow-x-auto no-scrollbar">
            {collections.map((col: any) => (
              <button
                key={col.id}
                onClick={() => setActiveCollection(col.id)}
                className={`px-4 py-3.5 text-[14px] font-medium whitespace-nowrap border-b-[3px] transition-colors shrink-0 ${
                  activeCollection === col.id
                    ? 'border-[#128C7E] text-[#128C7E]'
                    : 'border-transparent text-gray-500'
                }`}
              >
                {col.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="relative flex items-center">
          <svg className="absolute left-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F0F2F5] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#128C7E]/20 transition-all placeholder:text-[#8696A0]"
          />
        </div>
      </div>

      {/* Product list */}
      <div className="bg-white border-t border-gray-200 mt-0 min-h-[50vh]">
        {productsLoading ? (
          <div className="flex flex-col">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center w-full p-4 bg-white border-b border-gray-100">
                <div className="w-[90px] h-[90px] rounded-xl bg-gray-100 animate-pulse shrink-0 mr-4" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : activeProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-4xl text-gray-300 mb-2">📦</span>
            <p className="text-[#8696A0] text-[15px]">No items available</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {activeProducts.map((product: any, i: number) => {
              const isLast = i === activeProducts.length - 1
              const inCart = cartQtyMap[product.id] || 0
              const hasVariants = (product.variantGroups?.length || 0) > 0

              return (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`flex items-center w-full p-4 bg-white active:bg-[#F0F2F5] transition-colors text-left border-b ${isLast ? 'border-transparent' : 'border-gray-100'}`}
                >
                  {/* Thumbnail */}
                  <div className="w-[90px] h-[90px] rounded-xl bg-[#F0F2F5] shrink-0 mr-[14px] flex justify-center items-center overflow-hidden border border-gray-100 relative">
                    {product.images?.[0]?.url
                      ? <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                      : <span className="text-2xl text-gray-300">📦</span>}
                    {inCart > 0 && (
                      <div className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#128C7E] flex items-center justify-center px-1">
                        <span className="text-[9px] font-bold text-white">{inCart}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center pb-1">
                    <p className="text-[16px] text-[#111B21] leading-tight mb-1 truncate">{product.name}</p>
                    <p className="text-[15px] text-[#54656F] font-medium leading-none">
                      ₹{Number(product.basePrice).toLocaleString('en-IN')}
                    </p>
                    {product.description && (
                      <p className="text-[13px] text-[#8696A0] mt-1 truncate">{product.description}</p>
                    )}
                    {hasVariants && (
                      <p className="text-[11px] text-[#128C7E] mt-1 font-medium">Multiple options</p>
                    )}
                  </div>

                  {/* CTA chevron or in-cart indicator */}
                  <div className="ml-2 shrink-0 flex flex-col items-center gap-1.5">
                    {inCart > 0 ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-7 h-7 rounded-full bg-[#128C7E] flex items-center justify-center">
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path d="M1.5 7l3.5 3.5 6-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="text-[9px] font-semibold text-[#128C7E]">In cart</span>
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8696A0" strokeWidth="2">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Product Drawer */}
      {selectedProduct && businessId && (
        <ProductDrawer
          product={selectedProduct}
          businessId={businessId}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  )
}
