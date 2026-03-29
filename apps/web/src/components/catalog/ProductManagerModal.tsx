import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'

interface Props {
  productId: string
  onClose: () => void
}

interface VariantValue {
  id: string
  label: string
  priceOverride: number | null
  stock: number
}

interface VariantGroup {
  id: string
  name: string
  values: VariantValue[]
}

export default function ProductManagerModal({ productId, onClose }: Props) {
  const queryClient = useQueryClient()
  const [newGroupName, setNewGroupName] = useState('')
  const [newValues, setNewValues] = useState<{label: string, price: string}[]>([{label: '', price: ''}])
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [addingValueTo, setAddingValueTo] = useState<string | null>(null)
  const [newValueLabel, setNewValueLabel] = useState('')
  const [newValuePrice, setNewValuePrice] = useState('')

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-manage', productId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/catalog/products/${productId}`)
      return data
    },
    enabled: !!productId,
  })

  const createGroup = useMutation({
    mutationFn: async ({ name, values }: { name: string; values: { label: string; priceOverride?: number }[] }) => {
      await apiClient.post(`/catalog/products/${productId}/variants`, { name, values })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-manage', productId] })
      setNewGroupName('')
      setNewValues([{label: '', price: ''}])
      setShowAddGroup(false)
    },
  })

  const deleteGroup = useMutation({
    mutationFn: async (groupId: string) => {
      await apiClient.delete(`/catalog/variants/${groupId}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product-manage', productId] }),
  })

  const addValue = useMutation({
    mutationFn: async ({ groupId, label, priceOverride }: { groupId: string; label: string; priceOverride?: number }) => {
      await apiClient.post(`/catalog/variants/${groupId}/values`, { label, priceOverride })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-manage', productId] })
      setAddingValueTo(null)
      setNewValueLabel('')
      setNewValuePrice('')
    },
  })

  const handleCreateGroup = () => {
    const name = newGroupName.trim()
    if (!name) return
    const validValues = newValues
      .filter(v => v.label.trim() !== '')
      .map(v => ({ label: v.label.trim(), priceOverride: v.price ? parseFloat(v.price) : undefined }))
    if (validValues.length === 0) return
    createGroup.mutate({ name, values: validValues })
  }

  const groups: VariantGroup[] = product?.variantGroups || []

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50 animate-slide-in-right">
      {/* Header */}
      <header className="px-4 py-3 bg-[#075E54] text-white flex items-center gap-3 safe-area-top shrink-0 shadow-sm">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center -ml-2 active:bg-black/10 rounded-full transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[17px] font-medium truncate">{isLoading ? 'Loading...' : product?.name || 'Item Options'}</h1>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-6">

        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="h-16 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : (
          <>
            <div className="bg-white px-4 py-3 border-b border-gray-200 flex justify-between items-center text-[15px]">
              <span className="text-gray-600">Base Price</span>
              <span className="font-medium text-gray-900">₹{Number(product?.basePrice || 0).toLocaleString('en-IN')}</span>
            </div>

            {/* Existing Variant Groups */}
            {groups.length > 0 && (
              <div className="mt-4">
                {groups.map((group: VariantGroup) => (
                  <div key={group.id} className="bg-white border-y border-gray-200 mb-4">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                      <span className="text-[15px] font-medium text-gray-900">{group.name}</span>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setAddingValueTo(addingValueTo === group.id ? null : group.id)}
                          className="text-[#128C7E] font-bold text-lg leading-none"
                        >+</button>
                        <button onClick={() => confirm('Delete this variant group?') && deleteGroup.mutate(group.id)}
                          className="text-gray-400 active:text-red-500"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>
                    </div>

                    {/* Values chips */}
                    <div className="px-4 py-3 flex flex-wrap gap-2">
                      {group.values.map((val: VariantValue) => (
                        <span key={val.id} className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-green-50 text-[#128C7E] border border-green-100">
                          {val.label}
                          {val.priceOverride != null && <span className="ml-1 opacity-70">₹{Number(val.priceOverride).toLocaleString('en-IN')}</span>}
                        </span>
                      ))}
                    </div>

                    {/* Inline add value */}
                    {addingValueTo === group.id && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
                        <input type="text" value={newValueLabel} onChange={e => setNewValueLabel(e.target.value)}
                          placeholder="Label (e.g. XL)" autoFocus
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-[14px] outline-none focus:border-[#128C7E]" />
                        <input type="number" value={newValuePrice} onChange={e => setNewValuePrice(e.target.value)}
                          placeholder="Price (Optional)" step="0.01"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-[14px] outline-none focus:border-[#128C7E]" />
                        <div className="flex gap-3 justify-end mt-1">
                          <button onClick={() => { setAddingValueTo(null); setNewValueLabel(''); setNewValuePrice('') }}
                            className="text-[14px] text-gray-500 font-medium px-2">Cancel</button>
                          <button onClick={() => {
                            if (!newValueLabel.trim()) return
                            addValue.mutate({ groupId: group.id, label: newValueLabel.trim(), priceOverride: newValuePrice ? parseFloat(newValuePrice) : undefined })
                          }}
                            disabled={!newValueLabel.trim() || addValue.isPending}
                            className="bg-[#128C7E] text-white px-4 py-1.5 rounded disabled:opacity-50 text-[14px]">
                            {addValue.isPending ? 'Wait...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {groups.length === 0 && !showAddGroup && (
              <div className="flex flex-col items-center py-12 text-center px-4">
                <span className="text-4xl text-gray-300 mb-3">🎨</span>
                <p className="text-[15px] font-medium text-gray-900 mb-1">No options yet</p>
                <p className="text-[14px] text-gray-500">
                  Add options like Size, Color, or Material to let customers choose.
                </p>
              </div>
            )}

            {/* Add new group form */}
            {showAddGroup ? (
              <div className="bg-white border-y border-gray-200 mt-4 p-4">
                <p className="text-[15px] font-medium text-gray-900 mb-4">New Option</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-[13px] text-gray-500 block mb-1">Option Name</label>
                    <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                      placeholder='e.g. Size, Color' autoFocus
                      className="w-full py-2 border-b-2 border-gray-300 focus:border-[#128C7E] outline-none text-[15px] transition-colors" />
                  </div>
                  <div>
                    <label className="text-[13px] text-gray-500 block mb-2">Options</label>
                    <div className="space-y-2">
                      {newValues.map((v, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input type="text" placeholder="Name (e.g. Small)" 
                            value={v.label} 
                            onChange={e => {
                               const cp = [...newValues]; cp[idx].label = e.target.value; setNewValues(cp);
                            }}
                            className="flex-1 py-1.5 px-2 bg-white border border-gray-300 rounded focus:border-[#128C7E] outline-none text-[14px]" />
                          <input type="number" placeholder="Price (₹)" step="0.01"
                            value={v.price} 
                            onChange={e => {
                               const cp = [...newValues]; cp[idx].price = e.target.value; setNewValues(cp);
                            }}
                            className="w-[100px] py-1.5 px-2 bg-white border border-gray-300 rounded focus:border-[#128C7E] outline-none text-[14px]" />
                          {newValues.length > 1 && (
                            <button onClick={() => {
                               const cp = [...newValues]; cp.splice(idx, 1); setNewValues(cp);
                            }} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 shrink-0">
                               <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setNewValues([...newValues, {label: '', price: ''}])} className="text-[#128C7E] text-[13px] font-medium mt-3 flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Add another option
                    </button>
                  </div>
                  <div className="flex justify-end gap-4 pt-2">
                    <button onClick={() => { setShowAddGroup(false); setNewGroupName(''); setNewValues([{label: '', price: ''}]) }}
                      className="text-[15px] text-gray-500 font-medium">Cancel</button>
                    <button onClick={handleCreateGroup}
                      disabled={!newGroupName.trim() || newValues.filter(v => v.label.trim()).length === 0 || createGroup.isPending}
                      className="text-[15px] text-[#128C7E] font-medium disabled:opacity-50">
                      {createGroup.isPending ? 'Saving...' : 'Save Option'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-4 mt-6">
                <button onClick={() => setShowAddGroup(true)}
                  className="w-full py-3 bg-white border border-gray-300 rounded text-[15px] font-medium text-[#128C7E] active:bg-gray-50 shadow-sm">
                  Add Option
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
