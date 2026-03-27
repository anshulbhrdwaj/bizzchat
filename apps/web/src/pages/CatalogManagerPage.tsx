import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'

export default function CatalogManagerPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editingCollection, setEditingCollection] = useState<any>(null)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [showNewCollection, setShowNewCollection] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['catalog-manager'],
    queryFn: async () => {
      const { data } = await apiClient.get('/business/catalog')
      return data
    },
  })

  const createCollection = useMutation({
    mutationFn: async (name: string) => {
      await apiClient.post('/business/catalog/collections', { name })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-manager'] })
      setNewCollectionName('')
      setShowNewCollection(false)
    },
  })

  const toggleCollection = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiClient.put(`/business/catalog/collections/${id}`, { isActive })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog-manager'] }),
  })

  const deleteCollection = useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/business/catalog/collections/${id}`) },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog-manager'] }),
  })

  const collections = data?.collections || []

  // ─── Loading ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4" style={{ background: 'var(--color-background)' }}>
        <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Catalog Manager</h1>
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass-card h-20 animate-pulse" />)}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8" style={{ background: 'var(--color-background)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Failed to load catalog</p>
        <button onClick={() => refetch()} className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: 'var(--color-primary)' }}>Retry</button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20 md:pb-4" style={{ background: 'var(--color-background)' }}>
      <header className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="w-9 h-9 rounded-xl flex items-center justify-center touch-target md:hidden"
          style={{ color: 'var(--color-text-primary)' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Catalog Manager</h1>
      </header>

      <div className="px-4">
        {/* Add Collection */}
        <button onClick={() => setShowNewCollection(true)}
          className="w-full py-3 rounded-xl text-xs font-semibold mb-4 border-2 border-dashed transition-all"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
          + New Collection
        </button>

        {showNewCollection && (
          <div className="glass-card p-4 mb-4 animate-fade-up">
            <input type="text" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)}
              placeholder="Collection name..." autoFocus
              className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-3"
              style={{ background: 'var(--color-surface)', border: '1.5px solid var(--glass-border)', color: 'var(--color-text-primary)', caretColor: 'var(--color-primary)' }} />
            <div className="flex gap-2">
              <button onClick={() => newCollectionName.trim() && createCollection.mutate(newCollectionName.trim())}
                disabled={!newCollectionName.trim()}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: newCollectionName.trim() ? 'var(--color-primary)' : 'var(--color-surface)' }}>Create</button>
              <button onClick={() => { setShowNewCollection(false); setNewCollectionName('') }}
                className="px-4 py-2 rounded-xl text-xs font-medium"
                style={{ color: 'var(--color-text-muted)' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Collections */}
        {collections.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--color-primary-light)' }}><span className="text-2xl">📦</span></div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>No collections yet</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Create your first collection to organize products</p>
          </div>
        ) : (
          <div className="space-y-3">
            {collections.map((col: any) => (
              <div key={col.id} className="glass-card overflow-hidden">
                {/* Collection header */}
                <div className="p-4 flex items-center gap-3">
                  {/* Drag handle */}
                  <div className="text-xs cursor-grab" style={{ color: 'var(--color-text-muted)' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="5" cy="3" r="1" fill="currentColor" /><circle cx="9" cy="3" r="1" fill="currentColor" />
                      <circle cx="5" cy="7" r="1" fill="currentColor" /><circle cx="9" cy="7" r="1" fill="currentColor" />
                      <circle cx="5" cy="11" r="1" fill="currentColor" /><circle cx="9" cy="11" r="1" fill="currentColor" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{col.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{col.products?.length || 0} products</p>
                  </div>

                  {/* Active toggle */}
                  <button onClick={() => toggleCollection.mutate({ id: col.id, isActive: !col.isActive })}
                    className="w-10 h-6 rounded-full relative transition-all"
                    style={{ background: col.isActive ? 'var(--color-success)' : 'var(--color-surface)', border: '1px solid var(--glass-border)' }}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                      style={{ transform: col.isActive ? 'translateX(18px)' : 'translateX(2px)' }} />
                  </button>

                  {/* Edit */}
                  <button onClick={() => setEditingCollection(editingCollection === col.id ? null : col.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ color: 'var(--color-text-muted)' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10 2L12 4L5 11H3V9L10 2Z" stroke="currentColor" strokeWidth="1.2" /></svg>
                  </button>

                  {/* Delete */}
                  <button onClick={() => confirm('Delete this collection?') && deleteCollection.mutate(col.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ color: 'var(--color-error)' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4H12M5 4V2H9V4M5 6V11M9 6V11M3 4V12H11V4" stroke="currentColor" strokeWidth="1.2" /></svg>
                  </button>
                </div>

                {/* Products grid */}
                {editingCollection === col.id && (
                  <div className="px-4 pb-4 animate-fade-up">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {(col.products || []).map((p: any) => (
                        <div key={p.id} className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)' }}>
                          <div className="aspect-square flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
                            {p.images?.[0]?.url ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">📦</span>}
                          </div>
                          <div className="p-2">
                            <p className="text-[10px] font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{p.name}</p>
                            <p className="text-[10px] font-bold" style={{ color: 'var(--color-primary)' }}>₹{Number(p.basePrice).toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      ))}
                      {/* Add product button */}
                      <button className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1"
                        style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                        <span className="text-lg">+</span>
                        <span className="text-[10px] font-semibold">Add Product</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
