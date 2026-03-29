import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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

type TabKey = 'active' | 'completed' | 'cancelled'

export default function OrdersPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>('active')

  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await apiClient.get('/orders')
      return data.data || []
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

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50">
        <header className="px-4 py-3 bg-[#075E54] text-white safe-area-top shrink-0">
          <h1 className="text-[17px] font-medium">Orders</h1>
        </header>
        <div className="p-4 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />)}
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
      <header className="px-4 py-3 bg-[#075E54] text-white safe-area-top shrink-0 shadow-sm">
        <h1 className="text-[17px] font-medium">Orders</h1>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 flex">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-[14px] font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-[#128C7E] text-[#128C7E]' : 'border-transparent text-gray-500'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-4xl text-gray-300 mb-3">📦</span>
            <p className="text-[15px] text-gray-500">No {tab} orders</p>
          </div>
        ) : (
          <div className="bg-white mt-2 border-y border-gray-200">
            {filtered.map((order: any, idx: number) => {
              const sl = STATUS_LABELS[order.status] || STATUS_LABELS.PENDING
              return (
                <button
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="w-full flex items-center p-4 text-left active:bg-gray-50 transition-colors"
                  style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #F3F4F6' : 'none' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[15px] font-medium text-gray-900">
                        {order.orderNumber || `#${order.id.slice(0, 8)}`}
                      </span>
                      <span className={`text-[13px] font-medium flex items-center gap-1 ${sl.color}`}>
                        {sl.icon} {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-gray-500">
                        {order.items?.length || 0} items · {formatTimestamp(order.createdAt)}
                      </p>
                      <p className="text-[15px] font-medium text-green-700">
                        ₹{Number(order.total).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
