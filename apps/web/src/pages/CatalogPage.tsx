import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { getInitials } from '@/lib/utils'

export default function CatalogPage() {
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  const tabsRef = useRef<HTMLDivElement>(null)

  // Fetch business + catalog
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['catalog', businessId],
    queryFn: async () => {
      const [bizRes, catalogRes] = await Promise.all([
        apiClient.get(`/business/${businessId}/profile`),
        apiClient.get(`/catalog/${businessId}`),
      ])
      return { business: bizRes.data, collections: catalogRes.data }
    },
    enabled: !!businessId,
  })

  useEffect(() => {
    if (data?.collections?.length && !activeCollection) {
      setActiveCollection(data.collections[0].id)
    }
  }, [data, activeCollection])

  const business = data?.business
  const collections = data?.collections || []
  const activeProducts = collections.find((c: any) => c.id === activeCollection)?.products || []

  // ─── Loading Skeleton ──────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto pb-20 md:pb-4" style={{ background: 'var(--color-background)' }}>
        <div className="h-40 animate-pulse" style={{ background: 'var(--color-surface)' }} />
        <div className="px-4 pt-4">
          <div className="h-5 w-48 rounded mb-2 animate-pulse" style={{ background: 'var(--color-surface)' }} />
          <div className="h-3 w-32 rounded mb-6 animate-pulse" style={{ background: 'var(--color-surface)' }} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'var(--color-surface)' }}>
                <div className="aspect-square" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-20 rounded" style={{ background: 'var(--glass-border)' }} />
                  <div className="h-3 w-12 rounded" style={{ background: 'var(--glass-border)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Error State ───────────────────────────────────────
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8" style={{ background: 'var(--color-background)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--color-error)" strokeWidth="1.5" /><path d="M12 8V12M12 16H12.01" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" /></svg>
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Failed to load catalog</p>
        <button onClick={() => refetch()} className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: 'var(--color-primary)' }}>Retry</button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20 md:pb-4" style={{ background: 'var(--color-background)' }}>
      {/* Business Cover + Logo Header */}
      <div className="relative h-40 md:h-48" style={{
        background: business?.coverUrl
          ? `url(${business.coverUrl}) center/cover`
          : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))',
      }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))' }} />
        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center touch-target"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M12 3L6 9L12 15" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        {/* Logo */}
        <div className="absolute bottom-4 left-4 flex items-end gap-3">
          <div className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center overflow-hidden"
            style={{ borderColor: 'white', background: business?.logoUrl ? 'white' : 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
            {business?.logoUrl ? (
              <img src={business.logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-white">{getInitials(business?.name)}</span>
            )}
          </div>
          <div className="pb-0.5">
            <h1 className="text-lg font-bold text-white drop-shadow-md">{business?.name}</h1>
            <p className="text-xs text-white/80">{business?.category}</p>
          </div>
        </div>
      </div>

      {/* Sticky Collection Tabs */}
      <div ref={tabsRef} className="sticky top-0 z-10 px-4 py-3 overflow-x-auto flex gap-2 no-scrollbar"
        style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--glass-border)' }}>
        {collections.map((col: any) => (
          <button
            key={col.id}
            onClick={() => setActiveCollection(col.id)}
            className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0"
            style={{
              background: activeCollection === col.id ? 'var(--color-primary)' : 'var(--color-surface)',
              color: activeCollection === col.id ? 'white' : 'var(--color-text-muted)',
              boxShadow: activeCollection === col.id ? '0 2px 8px rgba(91, 63, 217, 0.3)' : 'none',
            }}
          >
            {col.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="px-4 pt-4">
        {activeProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No products in this collection</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {activeProducts.map((product: any) => (
              <button
                key={product.id}
                onClick={() => navigate(`/catalog/${businessId}/product/${product.id}`)}
                className="glass-card overflow-hidden text-left transition-all hover:shadow-lg group"
                style={{ borderRadius: 'var(--radius-lg)' }}
              >
                {/* Product Image */}
                <div className="aspect-square relative overflow-hidden" style={{ background: 'var(--color-surface)' }}>
                  {product.images?.[0]?.url ? (
                    <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl">📦</span>
                    </div>
                  )}
                  {!product.isActive && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-xs font-bold text-white px-3 py-1 rounded-full" style={{ background: 'var(--color-error)' }}>Unavailable</span>
                    </div>
                  )}
                </div>
                {/* Product Info */}
                <div className="p-3">
                  <p className="text-xs font-semibold truncate mb-1" style={{ color: 'var(--color-text-primary)' }}>{product.name}</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>₹{Number(product.basePrice).toLocaleString('en-IN')}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scrollbar hide */}
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  )
}
