import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { ChevronLeft } from 'lucide-react'

const STATUS_COLORS: Record<string, { text: string; bg: string; icon: string }> = {
  PENDING:    { text: 'text-amber-700', bg: 'bg-amber-50', icon: '⏳' },
  CONFIRMED:  { text: 'text-cyan-700', bg: 'bg-cyan-50', icon: '✅' },
  PROCESSING: { text: 'text-purple-700', bg: 'bg-purple-50', icon: '⚙️' },
  DISPATCHED: { text: 'text-blue-700', bg: 'bg-blue-50', icon: '🚚' },
  DELIVERED:  { text: 'text-green-700', bg: 'bg-green-50', icon: '📦' },
  CANCELLED:  { text: 'text-red-600', bg: 'bg-red-50', icon: '❌' },
  REFUNDED:   { text: 'text-gray-600', bg: 'bg-gray-100', icon: '↩️' },
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

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-[#F0F2F5]">
        <header className="px-4 py-3 bg-[#075E54] text-white safe-area-top shrink-0 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
          <div className="h-5 w-28 bg-white/20 rounded animate-pulse" />
        </header>
        <div className="p-4 space-y-3">
          <div className="h-24 bg-white rounded-3xl animate-pulse shadow-sm" />
          <div className="h-40 bg-white rounded-3xl animate-pulse shadow-sm" />
        </div>
      </div>
    )
  }

  if (!order) return null
  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING
  const statusIdx = STATUS_ORDER.indexOf(order.status)

  return (
    <div className="flex-1 flex flex-col bg-[#F0F2F5] overflow-hidden">
      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-2 safe-area-top shrink-0 bg-[#075E54] text-white shadow-sm">
        <button
          onClick={() => navigate('/orders')}
          className="w-9 h-9 flex items-center justify-center -ml-1 rounded-full active:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-[18px] font-bold flex-1">Order Details</h1>
        <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${sc.text} ${sc.bg}`}>
          {sc.icon} {order.status}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto pb-6">
        {/* Order Header Info */}
        <div className="mx-4 mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h2 className="text-[18px] font-bold text-gray-900">
              Order {order.orderNumber || `#${order.id.slice(0, 8)}`}
            </h2>
            <p className="text-[13px] text-gray-400 mt-1">
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="px-4 py-3">
            <button className="w-full py-3 text-[14px] font-semibold text-[#128C7E] border border-[#128C7E]/20 rounded-2xl active:bg-[#128C7E]/5 transition-colors bg-[#128C7E]/5">
              Message Business
            </button>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="mx-4 mt-3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Order Status</h3>
          </div>
          <div className="relative px-5 pb-4">
            {STATUS_ORDER.map((status, i) => {
              const isCompleted = i <= statusIdx
              const isCurrent = i === statusIdx
              const historyEntry = order.statusHistory?.find((h: any) => h.status === status)

              return (
                <div key={status} className="relative pb-5 last:pb-0 pl-7">
                  {/* Vertical line */}
                  {i < STATUS_ORDER.length - 1 && (
                    <div
                      className="absolute left-[6px] top-3 bottom-0 w-0.5"
                      style={{ background: isCompleted && i < statusIdx ? '#22C55E' : '#E5E7EB' }}
                    />
                  )}
                  {/* Dot */}
                  <div className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${isCompleted ? 'bg-green-500' : 'bg-gray-200'} ${isCurrent ? 'ring-2 ring-green-400/30' : ''}`} />

                  {/* Content */}
                  <div className="-mt-0.5">
                    <p className={`text-[14px] font-semibold leading-tight ${isCompleted ? 'text-gray-900' : 'text-gray-300'}`}>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </p>
                    {historyEntry && (
                      <p className="text-[12px] text-gray-400 mt-0.5">
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
        <div className="mx-4 mt-3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Items</h3>
          </div>
          <div>
            {(order.items || []).map((item: any, idx: number) => (
              <div
                key={item.id}
                className={`flex gap-3 px-4 py-3.5 ${idx < order.items.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex justify-center items-center overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : <span className="text-xl">📦</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-[15px] font-semibold text-gray-900 truncate pr-2">{item.productName}</p>
                    <p className="text-[15px] font-bold text-gray-900">₹{Number(item.lineTotal).toLocaleString('en-IN')}</p>
                  </div>
                  {item.variantLabel && <p className="text-[12px] text-gray-400 mt-0.5">{item.variantLabel}</p>}
                  <p className="text-[12px] text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Summary */}
        <div className="mx-4 mt-3 mb-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-4">
          <div className="space-y-2.5 mb-3">
            <div className="flex justify-between text-[14px]">
              <span className="text-gray-500 font-medium">Subtotal</span>
              <span className="text-gray-900 font-medium">₹{Number(order.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-gray-500 font-medium">Tax</span>
              <span className="text-gray-900 font-medium">₹{Number(order.tax || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <span className="text-[16px] font-bold text-gray-900">Total</span>
            <span className="text-[18px] font-bold text-[#128C7E]">₹{Number(order.total).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
