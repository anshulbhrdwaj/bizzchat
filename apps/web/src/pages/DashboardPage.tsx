import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { formatTimestamp } from '@/lib/utils'

// ─── KPI Card Component ──────────────────────────────────
function KPICard({ label, value, loading }: { label: string; value: number | string; loading: boolean }) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValue = useRef(0)

  // Count-up animation
  useEffect(() => {
    if (loading || typeof value !== 'number') return
    const start = prevValue.current
    const end = value
    const duration = 600
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplayValue(Math.round(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    animate()
    prevValue.current = end
  }, [value, loading])

  if (loading) {
    return (
      <div className="glass-card p-4 animate-pulse" style={{ borderLeft: '4px solid var(--color-primary)' }}>
        <div className="h-10 w-16 rounded mb-2" style={{ background: 'var(--color-surface)' }} />
        <div className="h-3 w-20 rounded" style={{ background: 'var(--color-surface)' }} />
      </div>
    )
  }

  return (
    <div className="glass-card p-4" style={{ borderLeft: '4px solid var(--color-primary)' }}>
      <p className="text-4xl font-bold leading-none mb-1" style={{ color: 'var(--color-text-primary)', fontSize: '48px' }}>
        {typeof value === 'number' ? displayValue.toLocaleString('en-IN') : value}
      </p>
      <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    </div>
  )
}

// ─── Status Colors ────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:    { bg: 'rgba(217, 119, 6, 0.15)', text: '#D97706' },
  CONFIRMED:  { bg: 'rgba(8, 145, 178, 0.15)', text: '#0891B2' },
  PROCESSING: { bg: 'rgba(91, 63, 217, 0.15)', text: '#5B3FD9' },
  DISPATCHED: { bg: 'rgba(6, 182, 212, 0.15)', text: '#06B6D4' },
  DELIVERED:  { bg: 'rgba(5, 150, 105, 0.15)', text: '#059669' },
  CANCELLED:  { bg: 'rgba(220, 38, 38, 0.15)', text: '#DC2626' },
  REFUNDED:   { bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280' },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [newOrderBanner, setNewOrderBanner] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Fetch dashboard data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get('/business/dashboard')
      return data
    },
    refetchInterval: 30000,
  })

  // Listen for new orders via socket
  useEffect(() => {
    const socket = getSocket()
    const handleNewOrder = (order: any) => {
      setNewOrderBanner(order)
      setTimeout(() => setNewOrderBanner(null), 5000)
      refetch()
    }
    socket?.on('order:new', handleNewOrder)
    return () => { socket?.off('order:new', handleNewOrder) }
  }, [refetch])

  const kpis = data?.kpis || { totalOrders: 0, pendingOrders: 0, revenue: 0, customers: 0 }
  const orders = data?.recentOrders || []
  const filteredOrders = statusFilter === 'ALL'
    ? orders
    : orders.filter((o: any) => o.status === statusFilter)

  // ─── Loading ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4" style={{ background: 'var(--color-background)' }}>
        <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <KPICard key={i} label="" value={0} loading={true} />)}
        </div>
      </div>
    )
  }

  // ─── Error ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8" style={{ background: 'var(--color-background)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Failed to load dashboard</p>
        <button onClick={() => refetch()} className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: 'var(--color-primary)' }}>Retry</button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20 md:pb-4" style={{ background: 'var(--color-background)' }}>
      {/* New Order Banner */}
      {newOrderBanner && (
        <div className="mx-4 mt-4 p-4 rounded-2xl flex items-center gap-3 animate-slide-in-right"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))' }}>
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">New Order!</p>
            <p className="text-xs text-white/70">{newOrderBanner.orderNumber} · {newOrderBanner.items?.length || 0} items</p>
          </div>
          <button onClick={() => navigate(`/dashboard/orders`)} className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>View</button>
        </div>
      )}

      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Dashboard</h1>
          <div className="flex gap-2">
            <button onClick={() => navigate('/dashboard/catalog')} className="px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--glass-border)' }}>
              📦 Catalog
            </button>
            <button onClick={() => navigate('/dashboard/shared-cart/new')} className="px-3 py-2 rounded-xl text-xs font-semibold text-white"
              style={{ background: 'var(--color-primary)' }}>
              🛒 Share Cart
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KPICard label="Total Orders" value={kpis.totalOrders} loading={false} />
          <KPICard label="Pending" value={kpis.pendingOrders} loading={false} />
          <KPICard label="Revenue" value={`₹${Number(kpis.revenue).toLocaleString('en-IN')}`} loading={false} />
          <KPICard label="Customers" value={kpis.customers} loading={false} />
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'].map(status => (
            <button key={status} onClick={() => setStatusFilter(status)}
              className="px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 transition-all"
              style={{
                background: statusFilter === status ? 'var(--color-primary)' : 'var(--color-surface)',
                color: statusFilter === status ? 'white' : 'var(--color-text-muted)',
              }}>
              {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Orders — Desktop: Table / Mobile: Cards */}
        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="glass-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--color-surface)' }}>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Order</th>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Customer</th>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Items</th>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Total</th>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Status</th>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>No orders</td></tr>
                ) : filteredOrders.map((order: any) => {
                  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING
                  return (
                    <tr key={order.id} className="transition-colors cursor-pointer hover:bg-white/50"
                      onClick={() => navigate(`/dashboard/orders`)}
                      style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td className="p-3 font-bold" style={{ color: 'var(--color-text-primary)' }}>{order.orderNumber || `#${order.id.slice(0, 8)}`}</td>
                      <td className="p-3" style={{ color: 'var(--color-text-body)' }}>{order.user?.name || 'Customer'}</td>
                      <td className="p-3" style={{ color: 'var(--color-text-body)' }}>{order.items?.length || 0}</td>
                      <td className="p-3 font-bold" style={{ color: 'var(--color-primary)' }}>₹{Number(order.total).toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: sc.bg, color: sc.text }}>{order.status}</span>
                      </td>
                      <td className="p-3" style={{ color: 'var(--color-text-muted)' }}>{formatTimestamp(order.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <span className="text-2xl mb-2">📦</span>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No orders</p>
            </div>
          ) : filteredOrders.map((order: any) => {
            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING
            return (
              <button key={order.id} onClick={() => navigate(`/dashboard/orders`)}
                className="glass-card w-full p-4 text-left transition-all hover:shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{order.orderNumber || `#${order.id.slice(0, 8)}`}</span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: sc.bg, color: sc.text }}>{order.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--color-text-body)' }}>{order.user?.name || 'Customer'}</p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{order.items?.length || 0} items · {formatTimestamp(order.createdAt)}</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>₹{Number(order.total).toLocaleString('en-IN')}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-in-right { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in-right { animation: slide-in-right 400ms var(--transition-spring) forwards; }
      `}</style>
    </div>
  )
}
