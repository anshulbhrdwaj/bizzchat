import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { formatTimestamp } from '@/lib/utils'

const STATUS_LABELS: Record<string, { color: string; icon: string }> = {
  PENDING:    { color: 'text-amber-600', icon: '⏳' },
  CONFIRMED:  { color: 'text-cyan-600', icon: '✅' },
  PROCESSING: { color: 'text-purple-600', icon: '⚙️' },
  DISPATCHED: { color: 'text-blue-500', icon: '🚚' },
  DELIVERED:  { color: 'text-green-600', icon: '📦' },
  CANCELLED:  { color: 'text-red-500', icon: '❌' },
  REFUNDED:   { color: 'text-gray-500', icon: '↩️' },
}

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED']

export default function OrderManagerPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [statusNote, setStatusNote] = useState('')
  const [tab, setTab] = useState('ALL')

  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['business-orders'],
    queryFn: async () => {
      const { data } = await apiClient.get('/business/orders')
      return data.data || []
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status, note }: { orderId: string; status: string; note: string }) => {
      await apiClient.patch(`/business/orders/${orderId}/status`, { status, note })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-orders'] })
      setSelectedOrder(null)
      setStatusNote('')
    },
  })

  const filtered = tab === 'ALL' ? orders : orders.filter((o: any) => o.status === tab)

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50">
        <header className="px-4 py-3 bg-[#075E54] text-white safe-area-top shrink-0">
          <h1 className="text-[17px] font-medium">Order Manager</h1>
        </header>
        <div className="p-4 space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-gray-600 font-medium">Failed to load orders</p>
        <button onClick={() => refetch()} className="px-6 py-2.5 rounded text-white bg-green-600 font-medium">Retry</button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <header className="px-4 py-3 flex items-center gap-3 safe-area-top shrink-0 bg-[#075E54] text-white shadow-sm">
        <button onClick={() => navigate('/dashboard')} className="w-8 h-8 flex items-center justify-center -ml-2 active:bg-black/10 rounded-full transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="text-[17px] font-medium flex-1">Order Manager</h1>
        <span className="text-[13px] opacity-80">{orders.length} orders</span>
      </header>

      {/* Status tabs */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto no-scrollbar">
        <div className="flex">
          {['ALL', ...STATUS_FLOW, 'CANCELLED'].map(s => {
            const count = s === 'ALL' ? orders.length : orders.filter((o: any) => o.status === s).length
            return (
              <button key={s} onClick={() => setTab(s)}
                className={`px-4 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1 ${
                  tab === s ? 'border-[#128C7E] text-[#128C7E]' : 'border-transparent text-gray-500'
                }`}>
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                <span className={`text-[11px] ${tab === s ? 'text-[#128C7E]' : 'text-gray-400'}`}>({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Orders */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-4xl text-gray-300 mb-3">📦</span>
            <p className="text-[15px] text-gray-500">No orders</p>
          </div>
        ) : (
          <div className="mt-2 space-y-2 px-3">
            {filtered.map((order: any) => {
              const sl = STATUS_LABELS[order.status] || STATUS_LABELS.PENDING
              const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]
              const isExpanded = selectedOrder?.id === order.id

              return (
                <div key={order.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[15px] font-medium text-gray-900">{order.orderNumber || `#${order.id.slice(0, 8)}`}</span>
                      <span className={`text-[13px] font-medium flex items-center gap-1 ${sl.color}`}>
                        {sl.icon} {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[14px] text-gray-700">{order.user?.name || 'Customer'}</p>
                        <p className="text-[12px] text-gray-500">{order.items?.length || 0} items · {formatTimestamp(order.createdAt)}</p>
                      </div>
                      <p className="text-[15px] font-medium text-green-700">₹{Number(order.total).toLocaleString('en-IN')}</p>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2">
                      {nextStatus && (
                        <button
                          onClick={() => setSelectedOrder(isExpanded ? null : { ...order, nextStatus })}
                          className="flex-1 py-2 rounded text-[14px] font-medium text-white bg-[#128C7E] active:bg-[#075E54]">
                          → {nextStatus.charAt(0) + nextStatus.slice(1).toLowerCase()}
                        </button>
                      )}
                      {order.status === 'PENDING' && (
                        <button onClick={() => updateStatus.mutate({ orderId: order.id, status: 'CANCELLED', note: 'Cancelled by business' })}
                          className="px-4 py-2 rounded text-[14px] font-medium text-red-500 border border-red-200 active:bg-red-50">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status update note */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
                      <input type="text" value={statusNote} onChange={e => setStatusNote(e.target.value)}
                        placeholder="Add a note (optional)..."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-[14px] outline-none focus:border-[#128C7E]" />
                      <button onClick={() => updateStatus.mutate({ orderId: order.id, status: selectedOrder.nextStatus, note: statusNote })}
                        className="w-full py-2.5 rounded text-[14px] font-medium text-white bg-[#128C7E] active:bg-[#075E54]">
                        Confirm → {selectedOrder.nextStatus.charAt(0) + selectedOrder.nextStatus.slice(1).toLowerCase()}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  )
}
