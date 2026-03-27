import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'

export default function ProductDetailPage() {
  const { businessId, productId } = useParams()
  const navigate = useNavigate()
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [imageIdx, setImageIdx] = useState(0)
  const [addingToCart, setAddingToCart] = useState(false)
  const [added, setAdded] = useState(false)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/catalog/${businessId}/products/${productId}`)
      return data
    },
    enabled: !!productId,
  })

  // Compute final price based on selected variants
  const finalPrice = useMemo(() => {
    if (!product) return 0
    let price = Number(product.basePrice)
    for (const group of product.variantGroups || []) {
      const selected = selectedVariants[group.id]
      if (selected) {
        const val = group.values.find((v: any) => v.id === selected)
        if (val?.priceOverride) price = Number(val.priceOverride)
      }
    }
    return price
  }, [product, selectedVariants])

  const allVariantsSelected = (product?.variantGroups || []).every(
    (g: any) => selectedVariants[g.id]
  )

  const handleAddToCart = async () => {
    if (!allVariantsSelected) return
    setAddingToCart(true)
    try {
      await apiClient.post(`/cart/${businessId}/items`, {
        productId,
        variantId: Object.values(selectedVariants)[0] || null,
        quantity,
      })
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (err) {
      console.error('Failed to add to cart', err)
    } finally {
      setAddingToCart(false)
    }
  }

  // ─── Loading ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto pb-20 md:pb-4" style={{ background: 'var(--color-background)' }}>
        <div className="aspect-square animate-pulse" style={{ background: 'var(--color-surface)' }} />
        <div className="p-4 space-y-3">
          <div className="h-5 w-48 rounded animate-pulse" style={{ background: 'var(--color-surface)' }} />
          <div className="h-4 w-20 rounded animate-pulse" style={{ background: 'var(--color-surface)' }} />
          <div className="h-3 w-full rounded animate-pulse" style={{ background: 'var(--color-surface)' }} />
          <div className="h-3 w-3/4 rounded animate-pulse" style={{ background: 'var(--color-surface)' }} />
        </div>
      </div>
    )
  }

  if (!product) return null
  const images = product.images || []

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--color-background)' }}>
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Image Carousel */}
        <div className="relative aspect-square overflow-hidden" style={{ background: 'var(--color-surface)' }}>
          {/* Back */}
          <button onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full flex items-center justify-center touch-target"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M12 3L6 9L12 15" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>

          {images.length > 0 ? (
            <img src={images[imageIdx]?.url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><span className="text-6xl">📦</span></div>
          )}

          {/* Image dots */}
          {images.length > 1 && (
            <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5">
              {images.map((_: any, i: number) => (
                <button key={i} onClick={() => setImageIdx(i)}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{ background: i === imageIdx ? 'var(--color-primary)' : 'rgba(255,255,255,0.5)', transform: i === imageIdx ? 'scale(1.3)' : 'scale(1)' }} />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="px-4 pt-4">
          <h1 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{product.name}</h1>
          <p className="text-xl font-bold mb-3" style={{ color: 'var(--color-primary)' }}>
            ₹{finalPrice.toLocaleString('en-IN')}
          </p>
          {product.description && (
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--color-text-muted)' }}>{product.description}</p>
          )}

          {/* Variant Selectors */}
          {(product.variantGroups || []).map((group: any) => (
            <div key={group.id} className="mb-5">
              <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
                {group.name}
              </label>
              <div className="flex flex-wrap gap-2">
                {group.values.map((val: any) => {
                  const isSelected = selectedVariants[group.id] === val.id
                  const outOfStock = val.stock === 0
                  return (
                    <button
                      key={val.id}
                      disabled={outOfStock}
                      onClick={() => setSelectedVariants(prev => ({ ...prev, [group.id]: val.id }))}
                      className="px-4 py-2 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: isSelected ? 'white' : outOfStock ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                        border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                        opacity: outOfStock ? 0.5 : 1,
                        textDecoration: outOfStock ? 'line-through' : 'none',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        pointerEvents: outOfStock ? 'none' : 'auto',
                      }}
                    >
                      {val.label}
                      {val.priceOverride && !outOfStock && (
                        <span className="ml-1 opacity-70">₹{Number(val.priceOverride).toLocaleString('en-IN')}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Quantity stepper */}
          <div className="flex items-center gap-4 mb-6">
            <label className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Quantity</label>
            <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1.5px solid var(--glass-border)' }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center text-lg font-medium touch-target"
                style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}>−</button>
              <span className="w-12 text-center text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center text-lg font-medium touch-target"
                style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}>+</button>
            </div>
          </div>

          {/* Message Business */}
          <button className="w-full py-3 rounded-xl text-xs font-semibold border transition-all"
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
            💬 Message Business
          </button>
        </div>
      </div>

      {/* Sticky Add to Cart */}
      <div className="sticky bottom-0 px-4 py-3 safe-area-bottom"
        style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--glass-border)' }}>
        <button
          onClick={handleAddToCart}
          disabled={!allVariantsSelected || addingToCart}
          className="w-full h-14 rounded-xl font-semibold text-sm transition-all"
          style={{
            background: added
              ? 'var(--color-success)'
              : allVariantsSelected
                ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))'
                : 'var(--color-surface)',
            color: allVariantsSelected || added ? 'white' : 'var(--color-text-muted)',
            boxShadow: allVariantsSelected ? '0 4px 20px rgba(91, 63, 217, 0.3)' : 'none',
          }}
        >
          {added ? '✓ Added to Cart!' : addingToCart ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding...
            </span>
          ) : !allVariantsSelected ? 'Select all options' : `Add to Cart · ₹${(finalPrice * quantity).toLocaleString('en-IN')}`}
        </button>
      </div>
    </div>
  )
}
