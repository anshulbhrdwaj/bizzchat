import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  PENDING:    { bg: 'rgba(217, 119, 6, 0.15)', text: '#D97706', icon: '⏳' },
  CONFIRMED:  { bg: 'rgba(8, 145, 178, 0.15)', text: '#0891B2', icon: '✅' },
  PROCESSING: { bg: 'rgba(91, 63, 217, 0.15)', text: '#5B3FD9', icon: '⚙️' },
  DISPATCHED: { bg: 'rgba(6, 182, 212, 0.15)', text: '#06B6D4', icon: '🚚' },
  DELIVERED:  { bg: 'rgba(5, 150, 105, 0.15)', text: '#059669', icon: '📦' },
  CANCELLED:  { bg: 'rgba(220, 38, 38, 0.15)', text: '#DC2626', icon: '❌' },
  REFUNDED:   { bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280', icon: '↩️' },
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
      <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4" style={{ background: 'var(--color-background)' }}>
        <div className="space-y-4 animate-pulse">
          <div className="h-5 w-40 rounded" style={{ background: 'var(--color-surface)' }} />
          <div className="h-3 w-24 rounded" style={{ background: 'var(--color-surface)' }} />
          <div className="space-y-3 mt-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 rounded-xl" style={{ background: 'var(--color-surface)' }} />)}</div>
        </div>
      </div>
    )
  }

  if (!order) return null
  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING
  const statusIdx = STATUS_ORDER.indexOf(order.status)

  return (
    <div className="flex-1 overflow-y-auto pb-20 md:pb-4" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate('/orders')} className="w-9 h-9 rounded-xl flex items-center justify-center touch-target md:hidden"
          style={{ color: 'var(--color-text-primary)' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{order.orderNumber || `#${order.id.slice(0, 8)}`}</h1>
          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className="ml-auto px-3 py-1 rounded-full text-[10px] font-bold" style={{ background: sc.bg, color: sc.text }}>
          {sc.icon} {order.status}
        </span>
      </header>

      {/* Status Timeline */}
      <div className="px-4 py-4">
        <div className="relative pl-6">
          {STATUS_ORDER.map((status, i) => {
            const isCompleted = i <= statusIdx
            const isCurrent = i === statusIdx
            const color = isCompleted ? STATUS_COLORS[status]?.text || sc.text : 'var(--color-text-muted)'
            const historyEntry = order.statusHistory?.find((h: any) => h.status === status)
            return (
              <div key={status} className="relative pb-6 last:pb-0">
                {/* Connector line */}
                {i < STATUS_ORDER.length - 1 && (
                  <div className="absolute left-[-14px] top-6 w-0.5 h-full" style={{ background: isCompleted ? color : 'var(--glass-border)' }} />
                )}
                {/* Dot */}
                <div className={`absolute left-[-18px] top-1 w-3 h-3 rounded-full border-2 ${isCurrent ? 'animate-pulse' : ''}`}
                  style={{ background: isCompleted ? color : 'var(--color-background)', borderColor: isCompleted ? color : 'var(--glass-border)' }} />
                {/* Content */}
                <div>
                  <p className={`text-xs ${isCompleted ? 'font-semibold' : 'font-medium'}`} style={{ color: isCompleted ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </p>
                  {historyEntry && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
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

      {/* Order Items */}
      <div className="px-4">
        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>Items</h3>
        {(order.items || []).map((item: any) => (
          <div key={item.id} className="flex gap-3 py-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--color-surface)' }}>
              {item.snapshotImageUrl ? (
                <img src={item.snapshotImageUrl} alt="" className="w-full h-full object-cover" />
              ) : <div className="w-full h-full flex items-center justify-center"><span className="text-lg">📦</span></div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{item.snapshotName}</p>
              <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Qty: {item.quantity}</p>
            </div>
            <p className="text-xs font-bold shrink-0" style={{ color: 'var(--color-primary)' }}>₹{(Number(item.snapshotPrice) * item.quantity).toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      {/* Total Summary */}
      <div className="px-4 py-4 mt-2 mx-4 rounded-xl" style={{ background: 'var(--color-surface)' }}>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs"><span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span><span style={{ color: 'var(--color-text-primary)' }}>₹{Number(order.subtotal || 0).toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between text-xs"><span style={{ color: 'var(--color-text-muted)' }}>Tax</span><span style={{ color: 'var(--color-text-primary)' }}>₹{Number(order.tax || 0).toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between text-sm font-bold pt-1.5" style={{ borderTop: '1px solid var(--glass-border)' }}>
            <span style={{ color: 'var(--color-text-primary)' }}>Total</span>
            <span style={{ color: 'var(--color-primary)' }}>₹{Number(order.total).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Message Business */}
      <div className="px-4 py-4">
        <button className="w-full py-3 rounded-xl text-xs font-semibold transition-all"
          style={{ border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)' }}>
          💬 Message Business
        </button>
      </div>
    </div>
  )
}
