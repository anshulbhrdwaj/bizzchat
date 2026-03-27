import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { formatTimestamp } from '@/lib/utils'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'rgba(217, 119, 6, 0.15)', text: '#D97706' },
  CONFIRMED: { bg: 'rgba(8, 145, 178, 0.15)', text: '#0891B2' },
  PROCESSING: { bg: 'rgba(91, 63, 217, 0.15)', text: '#5B3FD9' },
  DISPATCHED: { bg: 'rgba(6, 182, 212, 0.15)', text: '#06B6D4' },
  DELIVERED: { bg: 'rgba(5, 150, 105, 0.15)', text: '#059669' },
  CANCELLED: { bg: 'rgba(220, 38, 38, 0.15)', text: '#DC2626' },
  REFUNDED: { bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280' },
}

type TabKey = 'active' | 'completed' | 'cancelled'

export default function OrdersPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>('active')

  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await apiClient.get('/orders')
      return data
    },
  })

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  const filtered = orders.filter((o: any) => {
    if (tab === 'active') return !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status)
    if (tab === 'completed') return o.status === 'DELIVERED'
    return ['CANCELLED', 'REFUNDED'].includes(o.status)
  })

  // ─── Loading ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto pb-20 md:pb-4" style={{ background: 'var(--color-background)' }}>
        <header className="px-4 pt-4 pb-3"><h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Orders</h1></header>
        <div className="px-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="flex justify-between mb-2"><div className="h-3.5 w-28 rounded" style={{ background: 'var(--color-surface)' }} /><div className="h-5 w-20 rounded-full" style={{ background: 'var(--color-surface)' }} /></div>
              <div className="h-3 w-40 rounded" style={{ background: 'var(--color-surface)' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Error ─────────────────────────────────────────────
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
      <header className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Orders</h1>
      </header>

      {/* Tab bar */}
      <div className="px-4 flex gap-2 mb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
            style={{
              background: tab === t.key ? 'var(--color-primary)' : 'var(--color-surface)',
              color: tab === t.key ? 'white' : 'var(--color-text-muted)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="px-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--color-primary-light)' }}>
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No {tab} orders</p>
          </div>
        ) : (
          filtered.map((order: any) => {
            const statusColor = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING
            return (
              <button
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="glass-card w-full p-4 text-left transition-all hover:shadow-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {order.orderNumber || `#${order.id.slice(0, 8)}`}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold transition-colors"
                    style={{ background: statusColor.bg, color: statusColor.text, transitionDuration: '300ms' }}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {order.items?.length || 0} items · {formatTimestamp(order.createdAt)}
                  </p>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                    ₹{Number(order.total).toLocaleString('en-IN')}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
