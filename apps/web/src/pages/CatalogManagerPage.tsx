import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import ProductFormModal from '@/components/catalog/ProductFormModal'
import ProductManagerModal from '@/components/catalog/ProductManagerModal'

function ProductSelectorModal({
  allProducts,
  currentProducts,
  onClose,
  onSubmit,
  isLoading,
}: {
  allProducts: any[]
  currentProducts: any[]
  onClose: () => void
  onSubmit: (productIds: string[]) => void
  isLoading: boolean
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const availableProducts = allProducts.filter(p => !currentProducts.some(cp => cp.id === p.id))

  const toggle = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end md:justify-center p-0 md:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md mx-auto md:rounded-2xl rounded-t-2xl flex flex-col max-h-[85vh] animate-slide-up">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-[18px] font-semibold text-gray-900">Add Existing Items</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 1l12 12M13 1L1 13"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {availableProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-3xl">📦</span>
              <p className="text-sm text-gray-500 font-medium">No available products to add</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {availableProducts.map(p => (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className="flex items-center gap-3 p-3 w-full rounded-xl active:bg-gray-50 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                    selectedIds.has(p.id) ? 'bg-[#128C7E] border-[#128C7E]' : 'border-gray-300 bg-white'
                  }`}>
                    {selectedIds.has(p.id) && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5 9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-[13px] text-gray-500">₹{Number(p.basePrice).toLocaleString('en-IN')}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex items-center gap-3">
          <button onClick={onClose} className="flex-1 py-3 font-semibold text-gray-600 bg-gray-100 rounded-xl active:bg-gray-200">
            Cancel
          </button>
          <button
            disabled={selectedIds.size === 0 || isLoading}
            onClick={() => onSubmit(Array.from(selectedIds))}
            className="flex-[2] py-3 font-semibold text-white bg-[#128C7E] rounded-xl active:bg-[#075E54] disabled:opacity-50 disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              `Add ${selectedIds.size > 0 ? selectedIds.size : ''} item${selectedIds.size !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in  { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up  { animation: slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1) both; }
        .animate-fade-in   { animation: fade-in  0.2s ease both; }
      `}</style>
    </div>
  )
}

export default function CatalogManagerPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [newCollectionName, setNewCollectionName] = useState('')
  const [showNewCollection, setShowNewCollection] = useState(false)
  // null = adding a standalone product (no collection); string = adding to a specific collection
  const [addingProductTo, setAddingProductTo] = useState<string | null | 'standalone'>(null)
  const [linkingProductTo, setLinkingProductTo] = useState<string | null>(null)
  const [managingProductId, setManagingProductId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['catalog-manager'],
    queryFn: async () => {
      const { data } = await apiClient.get('/catalog/manager')
      return data
    },
  })

  const createCollection = useMutation({
    mutationFn: async (name: string) => {
      await apiClient.post('/catalog/collections', { name })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-manager'] })
      setNewCollectionName('')
      setShowNewCollection(false)
    },
  })

  const deleteCollection = useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/catalog/collections/${id}`) },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog-manager'] }),
  })

  // We don't need a strict "images" upload logic here if it's already well handled in ProductFormModal.
  // Actually, we do need it because ProductFormModal just passes data up.
  const createProduct = useMutation({
    mutationFn: async ({ collectionId, name, basePrice, description, image }: any) => {
      // 1. Create product
      const { data: product } = await apiClient.post('/catalog/products', { name, basePrice, description })
      // 2. Link to collection only if a specific one was given
      if (collectionId && collectionId !== 'standalone') {
        await apiClient.post(`/catalog/collections/${collectionId}/products`, { productId: product.id })
      }
      // 3. Upload image if present
      if (image) {
        const formData = new FormData()
        formData.append('image', image)
        await apiClient.post(`/catalog/products/${product.id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-manager'] })
      setAddingProductTo(null)
    },
  })

  const linkProducts = useMutation({
    mutationFn: async ({ collectionId, productIds }: { collectionId: string, productIds: string[] }) => {
      await apiClient.post(`/catalog/collections/${collectionId}/products`, { productIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-manager'] })
      setLinkingProductTo(null)
    },
  })

  const collections = data?.collections || []
  const standaloneProducts: any[] = data?.standaloneProducts || []

  // ─── Loading ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <header className="px-4 py-3 bg-[#075E54] text-white safe-area-top shrink-0">
          <h1 className="text-xl font-medium">Catalog</h1>
        </header>
        <div className="p-4 space-y-4">
          <div className="h-12 bg-gray-100 rounded animate-pulse" />
          <div className="h-20 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 pb-20 md:pb-4">
      <header className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3 safe-area-top shrink-0 bg-[#075E54] text-white shadow-sm">
        <button onClick={() => navigate('/dashboard')} className="w-8 h-8 flex items-center justify-center -ml-2 active:bg-white/10 rounded-full transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="text-xl font-medium flex-1">Catalog</h1>
      </header>

      {/* ── Top action row ── */}
      <div className="bg-white mt-3 border-y border-gray-200">
        {/* Add standalone product (goes into All Items only) */}
        <button
          onClick={() => setAddingProductTo('standalone')}
          className="flex items-center gap-4 w-full p-4 active:bg-gray-50 transition-colors text-left border-b border-gray-100"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#128C7E]/10 text-[#128C7E] font-bold text-xl shrink-0">
            +
          </div>
          <div>
            <p className="font-semibold text-[15px] text-[#128C7E]">Add product</p>
            <p className="text-[12px] text-gray-400">Goes into All Items by default</p>
          </div>
        </button>

        {/* Add collection */}
        <button
          onClick={() => setShowNewCollection(true)}
          className="flex items-center gap-4 w-full p-4 active:bg-gray-50 transition-colors text-left"
          style={{ borderBottom: showNewCollection ? 'none' : undefined }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-700 font-bold shrink-0">
            📁
          </div>
          <div>
            <p className="font-medium text-[15px] text-green-700">Add collection</p>
            <p className="text-[12px] text-gray-400">Group products into collections</p>
          </div>
        </button>

        {showNewCollection && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <input type="text" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)}
              placeholder="Collection name e.g. Bestsellers" autoFocus
              className="w-full px-3 py-2 border-b-2 border-green-600 outline-none bg-transparent text-sm mb-3" />
            <div className="flex gap-2 justify-end text-sm font-medium">
              <button onClick={() => { setShowNewCollection(false); setNewCollectionName('') }} className="px-3 py-1.5 text-gray-500">Cancel</button>
              <button
                onClick={() => newCollectionName.trim() && createCollection.mutate(newCollectionName.trim())}
                disabled={!newCollectionName.trim()}
                className="px-3 py-1.5 text-white rounded bg-green-600 disabled:opacity-50"
              >Save</button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {/* ── All Items (standalone products) ── */}
        {standaloneProducts.length > 0 && (
          <div className="bg-white border-y border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-800">All Items</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Not in any collection</p>
              </div>
              <span className="px-2 py-1 rounded text-[10px] bg-[#128C7E]/10 text-[#128C7E] font-semibold">
                {standaloneProducts.length}
              </span>
            </div>
            <div className="pl-4">
              {standaloneProducts.map((p: any, i: number) => (
                <button key={p.id} onClick={() => setManagingProductId(p.id)}
                  className="flex items-center w-full py-3 pr-4 active:bg-gray-50 transition-colors"
                  style={{ borderBottom: i === standaloneProducts.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                  <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 shrink-0 mr-4 flex justify-center items-center">
                    {p.images?.[0]?.url ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">📦</span>}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[15px] text-gray-900 truncate">{p.name}</p>
                    <p className="text-[14px] text-gray-500 mt-0.5">₹{Number(p.basePrice).toLocaleString('en-IN')}</p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded bg-gray-100 text-gray-500 font-medium ml-2 shrink-0">
                    All Items only
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Named collections ── */}
        {collections.map((col: any) => (
          <div key={col.id} className="bg-white border-y border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-[15px] font-semibold text-gray-800">{col.name}</h2>
              <button onClick={() => confirm('Delete collection?') && deleteCollection.mutate(col.id)} className="text-xs text-red-500 font-medium">Delete</button>
            </div>
            
            <div className="flex px-4 py-2 border-b border-gray-100 gap-3">
              <button onClick={() => setAddingProductTo(col.id)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-green-50 text-green-700 font-semibold text-[13px] active:bg-green-100 transition-colors">
                <span>+</span> New Item
              </button>
              <button onClick={() => setLinkingProductTo(col.id)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-50 text-gray-700 font-semibold text-[13px] active:bg-gray-100 transition-colors">
                <span>+</span> Existing Item
              </button>
            </div>

            <div className="pl-4">
              {(col.products || []).map((p: any, i: number) => (
                <button key={p.id} onClick={() => setManagingProductId(p.id)} className="flex items-center w-full py-3 pr-4 active:bg-gray-50 transition-colors" style={{ borderBottom: i === col.products.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                  <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 shrink-0 mr-4 flex justify-center items-center">
                    {p.images?.[0]?.url ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">📦</span>}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[15px] text-gray-900 truncate">{p.name}</p>
                    <p className="text-[14px] text-gray-500 mt-0.5">₹{Number(p.basePrice).toLocaleString('en-IN')}</p>
                  </div>
                  {(p.variantGroups?.length > 0) && (
                    <span className="px-2 py-1 rounded text-[10px] bg-gray-100 text-gray-600 font-medium ml-2 shrink-0">
                      {p.variantGroups.length} variants
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>


      {addingProductTo !== null && (
        <ProductFormModal
          onClose={() => setAddingProductTo(null)}
          onSubmit={(formData) => createProduct.mutate({ ...formData, collectionId: addingProductTo })}
          isLoading={createProduct.isPending}
        />
      )}

      {linkingProductTo !== null && (
        <ProductSelectorModal
          allProducts={(() => {
            const map = new Map()
            standaloneProducts.forEach(p => map.set(p.id, p))
            collections.forEach((c: any) => c.products.forEach((p: any) => map.set(p.id, p)))
            return Array.from(map.values())
          })()}
          currentProducts={collections.find((c: any) => c.id === linkingProductTo)?.products || []}
          onClose={() => setLinkingProductTo(null)}
          onSubmit={(productIds) => linkProducts.mutate({ collectionId: linkingProductTo, productIds })}
          isLoading={linkProducts.isPending}
        />
      )}

      {managingProductId && (
        <ProductManagerModal
          productId={managingProductId}
          onClose={() => {
            setManagingProductId(null)
            queryClient.invalidateQueries({ queryKey: ['catalog-manager'] })
          }}
        />
      )}
    </div>
  )
}
