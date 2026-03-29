import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { getInitials } from '@/lib/utils'

export default function CatalogPage() {
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const [activeCollection, setActiveCollection] = useState<string | null>(null)

  // Fetch business + catalog collections
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
    if (data?.collections?.length && !activeCollection) {
      setActiveCollection(data.collections[0].id)
    }
  }, [data, activeCollection])

  const business = data?.business
  const collections = data?.collections || []

  // Fetch products for the active collection
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['catalog-products', activeCollection],
    queryFn: async () => {
      if (!activeCollection) return { data: [] }
      const { data } = await apiClient.get(`/catalog/collections/${activeCollection}/products?limit=50`)
      return data
    },
    enabled: !!activeCollection,
  })

  const activeProducts = productsData?.data || []

  // ─── Loading Skeleton ──────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-[#F0F2F5]">
        <header className="px-4 py-3 bg-[#075E54] text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 animate-pulse" />
          <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
        </header>
        <div className="p-4 space-y-4">
          <div className="h-6 w-1/4 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 gap-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center w-full p-4 bg-white border-b border-gray-100">
                <div className="w-[90px] h-[90px] rounded-md bg-gray-200 animate-pulse shrink-0 mr-4" />
                <div className="flex-1 min-w-0">
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
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
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#F0F2F5]">
        <p className="text-gray-500 font-medium">Failed to load catalog</p>
        <button onClick={() => refetch()} className="px-6 py-2.5 rounded-full text-white bg-[#128C7E] font-medium transition-colors active:bg-[#075E54]">Retry</button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 pb-20 md:pb-4">
      {/* WhatsApp Header */}
      <header className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3 safe-area-top shrink-0 shadow-sm bg-[#075E54] text-white">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center -ml-2 active:bg-white/10 rounded-full transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center shrink-0">
          {business?.logoUrl ? (
            <img src={business.logoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 font-bold">{getInitials(business?.name)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[17px] font-medium truncate">{business?.name || 'Catalog'}</h1>
          <p className="text-[13px] text-white/80 truncate">Catalog</p>
        </div>
        <button onClick={() => navigate(`/cart/${businessId}`)} className="w-10 h-10 flex items-center justify-center shrink-0 active:bg-white/10 rounded-full transition-colors relative">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        </button>
      </header>

      {/* Categories Tabs */}
      {collections.length > 0 && (
        <div className="bg-white sticky top-[60px] md:top-[68px] z-10 border-b border-gray-200">
          <div className="flex overflow-x-auto no-scrollbar">
            {collections.map((col: any) => (
              <button
                key={col.id}
                onClick={() => setActiveCollection(col.id)}
                className={`px-4 py-3.5 text-[15px] font-medium whitespace-nowrap border-b-[3px] transition-colors ${
                  activeCollection === col.id ? 'border-[#128C7E] text-[#128C7E]' : 'border-transparent text-gray-500'
                }`}
              >
                {col.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="bg-white border-t border-gray-200">
        {productsLoading ? (
          <div className="flex flex-col">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center w-full p-4 bg-white border-b border-gray-100">
                <div className="w-[90px] h-[90px] rounded-md bg-gray-100 animate-pulse shrink-0 mr-4" />
                <div className="flex-1 min-w-0">
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
              return (
                <button
                  key={product.id}
                  onClick={() => navigate(`/catalog/${businessId}/product/${product.id}`)}
                  className={`flex items-center w-full p-4 bg-white active:bg-[#F0F2F5] transition-colors text-left border-b ${isLast ? 'border-transparent' : 'border-gray-100'}`}
                >
                  <div className="w-[90px] h-[90px] rounded-lg bg-[#F0F2F5] shrink-0 mr-[14px] flex justify-center items-center overflow-hidden border border-gray-100">
                    {product.images?.[0]?.url ? (
                      <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl text-gray-300">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center pb-1">
                    <p className="text-[16px] text-[#111B21] leading-tight mb-1 truncate">{product.name}</p>
                    <p className="text-[15px] text-[#54656F] font-medium leading-none">₹{Number(product.basePrice).toLocaleString('en-IN')}</p>
                    {product.description && (
                      <p className="text-[14px] text-[#8696A0] mt-1.5 truncate max-w-xs">{product.description}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  )
}
