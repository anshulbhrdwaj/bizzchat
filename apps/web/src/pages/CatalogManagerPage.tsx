import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import ProductFormModal from '@/components/catalog/ProductFormModal'
import ProductManagerModal from '@/components/catalog/ProductManagerModal'

export default function CatalogManagerPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [newCollectionName, setNewCollectionName] = useState('')
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [addingProductTo, setAddingProductTo] = useState<string | null>(null)
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
      // 2. Link to collection
      await apiClient.post(`/catalog/collections/${collectionId}/products`, { productId: product.id })
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

  const collections = data?.collections || []

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
    <div className="flex-1 flex flex-col bg-gray-50 pb-20 md:pb-4">
      <header className="px-4 py-3 flex items-center gap-3 safe-area-top shrink-0 bg-[#075E54] text-white">
        <button onClick={() => navigate('/dashboard')} className="w-8 h-8 flex items-center justify-center -ml-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="text-xl font-medium flex-1">Catalog</h1>
      </header>

      <div className="bg-white mt-3 border-y border-gray-200">
        <button onClick={() => setShowNewCollection(true)} className="flex items-center gap-4 w-full p-4 active:bg-gray-50 transition-colors text-left" style={{ borderBottom: showNewCollection ? 'none' : '1px solid #E5E7EB' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-700 font-bold shrink-0">
            +
          </div>
          <p className="font-medium text-[15px] text-green-700">Add new collection</p>
        </button>

        {showNewCollection && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <input type="text" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)}
              placeholder="Collection name" autoFocus
              className="w-full px-3 py-2 border-b-2 border-green-600 outline-none bg-transparent text-sm mb-3" />
            <div className="flex gap-2 justify-end text-sm font-medium">
              <button onClick={() => { setShowNewCollection(false); setNewCollectionName('') }} className="px-3 py-1.5 text-gray-500">Cancel</button>
              <button onClick={() => newCollectionName.trim() && createCollection.mutate(newCollectionName.trim())}
                disabled={!newCollectionName.trim()}
                className="px-3 py-1.5 text-white rounded bg-green-600 disabled:opacity-50">Save</button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {collections.map((col: any) => (
          <div key={col.id} className="bg-white border-y border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-[15px] font-semibold text-gray-800">{col.name}</h2>
              <button onClick={() => confirm('Delete collection?') && deleteCollection.mutate(col.id)} className="text-xs text-red-500 font-medium">Delete</button>
            </div>
            
            <div className="pl-4">
              <button onClick={() => setAddingProductTo(col.id)} className="flex items-center gap-4 w-full py-3 pr-4 active:bg-gray-50 transition-colors border-b border-gray-100">
                <div className="w-12 h-12 rounded border border-dashed border-green-600 flex items-center justify-center text-green-600 shrink-0 bg-green-50">
                  +
                </div>
                <p className="font-medium text-[14px] text-green-700 text-left">Add new item</p>
              </button>

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

      {addingProductTo && (
        <ProductFormModal 
          onClose={() => setAddingProductTo(null)}
          onSubmit={(data) => createProduct.mutate({ ...data, collectionId: addingProductTo })}
          isLoading={createProduct.isPending}
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
