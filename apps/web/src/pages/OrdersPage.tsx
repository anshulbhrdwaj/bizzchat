import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { formatTimestamp } from '@/lib/utils'

const STATUS_LABELS: Record<string, { color: string; bg: string; icon: string }> = {
  PENDING:    { color: 'text-amber-700', bg: 'bg-amber-50', icon: '⏳' },
  CONFIRMED:  { color: 'text-cyan-700', bg: 'bg-cyan-50', icon: '✅' },
  PROCESSING: { color: 'text-purple-700', bg: 'bg-purple-50', icon: '⚙️' },
  DISPATCHED: { color: 'text-blue-700', bg: 'bg-blue-50', icon: '🚚' },
  DELIVERED:  { color: 'text-green-700', bg: 'bg-green-50', icon: '📦' },
  CANCELLED:  { color: 'text-red-600', bg: 'bg-red-50', icon: '❌' },
  REFUNDED:   { color: 'text-gray-600', bg: 'bg-gray-50', icon: '↩️' },
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
      <div className="flex-1 flex flex-col bg-[#F0F2F5]">
        <header className="px-4 py-4 bg-[#075E54] text-white safe-area-top shrink-0">
          <h1 className="text-[20px] font-bold tracking-tight">Orders</h1>
        </header>
        <div className="p-4 space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 bg-white rounded-3xl animate-pulse shadow-sm" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col bg-[#F0F2F5]">
        <header className="px-4 py-4 bg-[#075E54] text-white safe-area-top shrink-0">
          <h1 className="text-[20px] font-bold tracking-tight">Orders</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-gray-600 font-medium">Failed to load orders</p>
          <button onClick={() => refetch()} className="px-6 py-2.5 rounded-2xl text-white bg-[#128C7E] font-medium">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F0F2F5] overflow-hidden">
      {/* Header */}
      <header className="px-4 py-4 bg-[#075E54] text-white safe-area-top shrink-0 shadow-sm">
        <h1 className="text-[20px] font-bold tracking-tight">Orders</h1>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 flex shrink-0 shadow-sm">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-3.5 text-[14px] font-semibold border-b-2 transition-colors ${
              tab === t.key ? 'border-[#128C7E] text-[#128C7E]' : 'border-transparent text-gray-400'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-5xl mb-4">📦</span>
            <p className="text-[17px] font-semibold text-gray-800">No {tab} orders</p>
            <p className="text-[14px] text-gray-400 mt-1">Your {tab} orders will appear here</p>
          </div>
        ) : (
          <div className="mx-4 mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {filtered.map((order: any, idx: number) => {
              const sl = STATUS_LABELS[order.status] || STATUS_LABELS.PENDING
              return (
                <button
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className={`w-full flex items-center p-4 text-left active:bg-gray-50 transition-colors ${idx < filtered.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[16px] font-semibold text-gray-900">
                        {order.orderNumber || `#${order.id.slice(0, 8)}`}
                      </span>
                      <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${sl.color} ${sl.bg}`}>
                        {sl.icon} {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-gray-400">
                        {order.items?.length || 0} items · {formatTimestamp(order.createdAt)}
                      </p>
                      <p className="text-[15px] font-bold text-[#128C7E]">
                        ₹{Number(order.total).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <svg className="ml-3 shrink-0 text-gray-300" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
