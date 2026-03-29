import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'

const STATUS_COLORS: Record<string, { text: string; icon: string }> = {
  PENDING:    { text: 'text-amber-600', icon: '⏳' },
  CONFIRMED:  { text: 'text-cyan-600', icon: '✅' },
  PROCESSING: { text: 'text-purple-600', icon: '⚙️' },
  DISPATCHED: { text: 'text-blue-500', icon: '🚚' },
  DELIVERED:  { text: 'text-green-600', icon: '📦' },
  CANCELLED:  { text: 'text-red-500', icon: '❌' },
  REFUNDED:   { text: 'text-gray-500', icon: '↩️' },
}

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED']

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/orders/${orderId}`)
      return data
    },
    enabled: !!orderId,
  })

  // ─── Loading ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50">
        <header className="px-4 py-3 bg-[#075E54] text-white safe-area-top shrink-0">
          <h1 className="text-[17px] font-medium">Order details</h1>
        </header>
        <div className="p-4 space-y-4">
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-40 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!order) return null
  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING
  const statusIdx = STATUS_ORDER.indexOf(order.status)

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
      <header className="px-4 py-3 flex items-center gap-3 safe-area-top shrink-0 bg-[#075E54] text-white shadow-sm z-10">
        <button onClick={() => navigate('/orders')} className="w-8 h-8 flex items-center justify-center -ml-2 active:bg-black/10 rounded-full transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="text-[17px] font-medium flex-1">Order details</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-6">
        {/* Order Header Info */}
        <div className="bg-white p-4 border-b border-gray-200 mb-2">
          <div className="flex justify-between items-start mb-1">
            <h2 className="text-[16px] font-medium text-gray-900">Order {order.orderNumber || `#${order.id.slice(0, 8)}`}</h2>
            <span className={`text-[13px] font-medium flex items-center gap-1 ${sc.text}`}>
              {sc.icon} {order.status}
            </span>
          </div>
          <p className="text-[13px] text-gray-500">
            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          <div className="mt-4 flex gap-3">
            <button className="flex-1 py-2 text-[14px] font-medium text-[#128C7E] border border-gray-200 rounded active:bg-gray-50">
              Message Business
            </button>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white p-4 border-y border-gray-200 mb-2">
          <h3 className="text-[14px] font-medium text-gray-900 mb-4">Order Status</h3>
          <div className="relative pl-3">
            {STATUS_ORDER.map((status, i) => {
              const isCompleted = i <= statusIdx
              const isCurrent = i === statusIdx
              const colorClass = isCompleted ? 'bg-green-500' : 'bg-gray-200'
              const textClass = isCompleted ? 'text-gray-900 font-medium' : 'text-gray-400'
              const historyEntry = order.statusHistory?.find((h: any) => h.status === status)

              return (
                <div key={status} className="relative pb-6 last:pb-0 pl-6 border-l-2" style={{ borderColor: i === STATUS_ORDER.length - 1 ? 'transparent' : (isCompleted ? '#22C55E' : '#E5E7EB') }}>
                  {/* Dot */}
                  <div className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${colorClass} ${isCurrent ? 'ring-2 ring-green-500/30' : ''}`} />
                  
                  {/* Content */}
                  <div className="-mt-1">
                    <p className={`text-[14px] leading-tight ${textClass}`}>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </p>
                    {historyEntry && (
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        {new Date(historyEntry.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {historyEntry.note && ` · ${historyEntry.note}`}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white border-y border-gray-200 mb-2">
          <h3 className="text-[14px] font-medium text-gray-900 !px-4 !pt-4 !pb-2">Items</h3>
          <div>
            {(order.items || []).map((item: any, idx: number) => (
              <div key={item.id} className="flex gap-3 px-4 py-3" style={{ borderBottom: idx < order.items.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <div className="w-14 h-14 rounded bg-gray-100 flex justify-center items-center overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : <span className="text-xl">📦</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-[15px] font-medium text-gray-900 truncate pr-2">{item.productName}</p>
                    <p className="text-[15px] font-medium text-gray-900">₹{Number(item.lineTotal).toLocaleString('en-IN')}</p>
                  </div>
                  {item.variantLabel && <p className="text-[13px] text-gray-500 mt-0.5">{item.variantLabel}</p>}
                  <p className="text-[13px] text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Summary */}
        <div className="bg-white border-y border-gray-200 p-4">
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-[14px]">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">₹{Number(order.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-gray-600">Tax</span>
              <span className="text-gray-900">₹{Number(order.tax || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="flex justify-between text-[15px] font-medium pt-3 border-t border-gray-200">
            <span className="text-gray-900">Total</span>
            <span className="text-green-700">₹{Number(order.total).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
