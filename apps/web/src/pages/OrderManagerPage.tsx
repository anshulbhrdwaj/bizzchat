import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { formatTimestamp } from '@/lib/utils'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:    { bg: 'rgba(217, 119, 6, 0.15)', text: '#D97706' },
  CONFIRMED:  { bg: 'rgba(8, 145, 178, 0.15)', text: '#0891B2' },
  PROCESSING: { bg: 'rgba(91, 63, 217, 0.15)', text: '#5B3FD9' },
  DISPATCHED: { bg: 'rgba(6, 182, 212, 0.15)', text: '#06B6D4' },
  DELIVERED:  { bg: 'rgba(5, 150, 105, 0.15)', text: '#059669' },
  CANCELLED:  { bg: 'rgba(220, 38, 38, 0.15)', text: '#DC2626' },
  REFUNDED:   { bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280' },
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
      return data
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status, note }: { orderId: string; status: string; note: string }) => {
      await apiClient.put(`/business/orders/${orderId}/status`, { status, note })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-orders'] })
      setSelectedOrder(null)
      setStatusNote('')
    },
  })

  const filtered = tab === 'ALL' ? orders : orders.filter((o: any) => o.status === tab)

  // ─── Loading ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4" style={{ background: 'var(--color-background)' }}>
        <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Order Manager</h1>
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="glass-card h-16 animate-pulse" />)}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8" style={{ background: 'var(--color-background)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Failed to load orders</p>
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
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Order Manager</h1>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
          {orders.length}
        </span>
      </header>

      {/* Status tabs */}
      <div className="px-4 flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {['ALL', ...STATUS_FLOW, 'CANCELLED'].map(s => {
          const count = s === 'ALL' ? orders.length : orders.filter((o: any) => o.status === s).length
          return (
            <button key={s} onClick={() => setTab(s)}
              className="px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1"
              style={{
                background: tab === s ? 'var(--color-primary)' : 'var(--color-surface)',
                color: tab === s ? 'white' : 'var(--color-text-muted)',
              }}>
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              <span className="px-1.5 py-0.5 rounded-full text-[9px]"
                style={{ background: tab === s ? 'rgba(255,255,255,0.2)' : 'var(--glass-border)' }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Orders */}
      <div className="px-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12"><p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No orders</p></div>
        ) : filtered.map((order: any) => {
          const sc = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING
          const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]
          return (
            <div key={order.id} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{order.orderNumber || `#${order.id.slice(0, 8)}`}</span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors" style={{ background: sc.bg, color: sc.text, transitionDuration: '300ms' }}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs" style={{ color: 'var(--color-text-body)' }}>{order.user?.name || 'Customer'}</p>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{order.items?.length || 0} items · {formatTimestamp(order.createdAt)}</p>
                </div>
                <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>₹{Number(order.total).toLocaleString('en-IN')}</p>
              </div>
              {/* Actions */}
              <div className="flex gap-2">
                {nextStatus && (
                  <button
                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : { ...order, nextStatus })}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-white"
                    style={{ background: 'var(--color-primary)' }}>
                    → {nextStatus.charAt(0) + nextStatus.slice(1).toLowerCase()}
                  </button>
                )}
                {order.status === 'PENDING' && (
                  <button onClick={() => updateStatus.mutate({ orderId: order.id, status: 'CANCELLED', note: 'Cancelled by business' })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold"
                    style={{ border: '1px solid var(--color-error)', color: 'var(--color-error)' }}>
                    Cancel
                  </button>
                )}
              </div>
              {/* Status update note */}
              {selectedOrder?.id === order.id && (
                <div className="mt-3 space-y-2 animate-fade-up">
                  <input type="text" value={statusNote} onChange={e => setStatusNote(e.target.value)}
                    placeholder="Add a note (optional)..."
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', color: 'var(--color-text-primary)' }} />
                  <button onClick={() => updateStatus.mutate({ orderId: order.id, status: selectedOrder.nextStatus, note: statusNote })}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))' }}>
                    Confirm → {selectedOrder.nextStatus.charAt(0) + selectedOrder.nextStatus.slice(1).toLowerCase()}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  )
}
