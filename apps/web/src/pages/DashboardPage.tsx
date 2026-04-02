import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'

// ─── Types ────────────────────────────────────────────────
interface ChartDay { label: string; revenue: number; orders: number }
interface RecentOrder { id: string; orderNumber: string; total: number; status: string; createdAt: string; user: { name?: string; phone: string; avatarUrl?: string }; items: { productName: string }[] }
interface TopProduct { name: string; revenue: number }
interface StatusDist { status: string; count: number }

// ─── Status colours ───────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  PENDING: '#F59E0B',
  CONFIRMED: '#3B82F6',
  PROCESSING: '#8B5CF6',
  DISPATCHED: '#06B6D4',
  DELIVERED: '#10B981',
  CANCELLED: '#EF4444',
  REFUNDED: '#6B7280',
}

const STATUS_BG: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PROCESSING: 'bg-purple-50 text-purple-700',
  DISPATCHED: 'bg-cyan-50 text-cyan-700',
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-600',
}

// ─── Mini Revenue Bar Chart ────────────────────────────────
function RevenueChart({ data }: { data: ChartDay[] }) {
  const maxRev = Math.max(...data.map(d => d.revenue), 1)
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short' })

  return (
    <div className="flex items-end gap-1.5 h-28 pt-3">
      {data.map((d, i) => {
        const pct = d.revenue / maxRev
        const isToday = d.label === today
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center" style={{ height: 80 }}>
              <div
                className="w-full rounded-t-sm transition-all duration-500"
                style={{
                  height: `${Math.max(pct * 100, 4)}%`,
                  background: isToday
                    ? 'linear-gradient(180deg, #25D366 0%, #128C7E 100%)'
                    : 'linear-gradient(180deg, #D1FAE5 0%, #A7F3D0 100%)',
                }}
              />
            </div>
            <span className={`text-[10px] font-medium ${isToday ? 'text-[#128C7E]' : 'text-gray-400'}`}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, trend, trendUp }: { icon: string; label: string; value: string; sub?: string; trend?: string; trendUp?: boolean }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[20px]">{icon}</span>
        {trend && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {trendUp ? '▲' : '▼'} {trend}
          </span>
        )}
      </div>
      <p className="text-[22px] font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-[12px] font-medium text-gray-500">{label}</p>
      {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
    </div>
  )
}

// ─── Status Donut ─────────────────────────────────────────
function StatusDonut({ data, total }: { data: StatusDist[]; total: number }) {
  if (total === 0) return <p className="text-[13px] text-gray-400 py-4 text-center">No orders yet</p>
  let cumulative = 0
  const segments = data.map(d => {
    const pct = (d.count / total) * 100
    const offset = cumulative
    cumulative += pct
    return { ...d, pct, offset }
  })
  const r = 36
  const circ = 2 * Math.PI * r

  return (
    <div className="flex items-center gap-4">
      <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0 -rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#F3F4F6" strokeWidth="12" />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx="44" cy="44" r={r}
            fill="none"
            stroke={STATUS_COLOR[s.status] ?? '#9CA3AF'}
            strokeWidth="12"
            strokeDasharray={`${(s.pct / 100) * circ} ${circ}`}
            strokeDashoffset={-((s.offset / 100) * circ)}
          />
        ))}
      </svg>
      <div className="flex-1 space-y-1.5">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLOR[s.status] ?? '#9CA3AF' }} />
            <span className="text-[12px] text-gray-600 flex-1">{s.status.charAt(0) + s.status.slice(1).toLowerCase()}</span>
            <span className="text-[12px] font-semibold text-gray-900">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Settings Panel ───────────────────────────────────────
function SettingsPanel({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [taxRate, setTaxRate] = useState<number | ''>('')
  const [deliveryCharge, setDeliveryCharge] = useState<number | ''>('')
  const [loaded, setLoaded] = useState(false)

  const { data: profileData } = useQuery({
    queryKey: ['biz-profile'],
    queryFn: async () => {
      const { data } = await apiClient.get('/business/profile')
      return data
    },
  })

  useEffect(() => {
    if (profileData && !loaded) {
      setTaxRate(profileData.taxRate ?? 18)
      setDeliveryCharge(profileData.deliveryCharge ?? 0)
      setLoaded(true)
    }
  }, [profileData])

  const save = useMutation({
    mutationFn: async () => {
      await apiClient.put('/business/profile', {
        taxRate: Number(taxRate),
        deliveryCharge: Number(deliveryCharge),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biz-profile'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="mt-auto bg-white rounded-t-3xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-200" /></div>
        <div className="px-5 pb-6 pt-2">
          <h2 className="text-[17px] font-bold text-gray-900 mb-5">Pricing Settings</h2>

          <div className="space-y-5">
            {/* Tax Rate */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[14px] font-semibold text-gray-700">Tax Rate</label>
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl px-3 py-1.5">
                  <input
                    type="number"
                    min={0} max={100} step={0.5}
                    value={taxRate}
                    onChange={e => setTaxRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-12 bg-transparent text-[15px] font-bold text-gray-900 outline-none text-right"
                  />
                  <span className="text-[14px] text-gray-500 font-medium">%</span>
                </div>
              </div>
              <input
                type="range" min={0} max={30} step={0.5}
                value={Number(taxRate) || 0}
                onChange={e => setTaxRate(Number(e.target.value))}
                className="w-full accent-[#128C7E] bg-gray-200 rounded-lg h-2"
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-0.5">
                <span>0%</span>
                {/* <span>GST 5%</span><span>GST 12%</span><span>GST 18%</span> */}
                <span>30%</span>
              </div>
            </div>

            {/* Delivery Charge */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[14px] font-semibold text-gray-700">Delivery Charge</label>
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl px-3 py-1.5">
                  <span className="text-[14px] text-gray-500 font-medium">₹</span>
                  <input
                    type="number"
                    min={0} step={5}
                    value={deliveryCharge}
                    onChange={e => setDeliveryCharge(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-16 bg-transparent text-[15px] font-bold text-gray-900 outline-none"
                  />
                </div>
              </div>
              <input
                type="range" min={0} max={500} step={5}
                value={Number(deliveryCharge) || 0}
                onChange={e => setDeliveryCharge(Number(e.target.value))}
                className="w-full accent-[#128C7E] bg-gray-200 rounded-lg h-2"
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-0.5">
                <span>Free</span>
                {/* <span>₹50</span><span>₹100</span><span>₹250</span> */}
                <span>₹500</span>
              </div>
            </div>

            <div className="bg-[#128C7E]/8 rounded-2xl p-4 mt-1">
              <p className="text-[12px] text-[#128C7E] font-semibold mb-1">Preview on a ₹500 order</p>
              <div className="space-y-1">
                <div className="flex justify-between text-[13px] text-gray-700"><span>Subtotal</span><span>₹500</span></div>
                <div className="flex justify-between text-[13px] text-gray-700"><span>Tax ({Number(taxRate) || 0}%)</span><span>₹{Math.round(500 * (Number(taxRate) || 0) / 100)}</span></div>
                <div className="flex justify-between text-[13px] text-gray-700"><span>Delivery</span><span>{Number(deliveryCharge) === 0 ? 'Free' : `₹${deliveryCharge}`}</span></div>
                <div className="flex justify-between text-[14px] font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1"><span>Total</span><span>₹{500 + Math.round(500 * (Number(taxRate) || 0) / 100) + (Number(deliveryCharge) || 0)}</span></div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3.5 rounded-full border border-gray-200 text-[15px] font-semibold text-gray-600">Cancel</button>
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="flex-1 py-3.5 rounded-full bg-[#128C7E] text-white text-[15px] font-semibold disabled:opacity-60"
            >
              {save.isPending ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── DashboardPage ────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get('/business/dashboard')
      return data
    },
    refetchInterval: 30_000,
  })

  const kpis = data?.kpis
  const chart: ChartDay[] = data?.chart ?? []
  const recentOrders: RecentOrder[] = data?.recentOrders ?? []
  const topProducts: TopProduct[] = data?.topProducts ?? []
  const statusDist: StatusDist[] = data?.statusDistribution ?? []
  const totalOrdersAll = statusDist.reduce((s, d) => s + d.count, 0)

  const fmt = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` :
    n >= 1000   ? `₹${(n / 1000).toFixed(1)}k`   : `₹${n}`

  return (
    <div className="flex-1 flex flex-col bg-[#F0F2F5] overflow-hidden">
      {/* Header */}
      <header
        className="px-4 pt-safe-top pb-3 flex items-center gap-3 shrink-0"
        style={{ background: 'linear-gradient(135deg, #075E54 0%, #128C7E 100%)' }}
      >
        <button onClick={() => navigate('/chats')} className="w-9 h-9 flex items-center justify-center -ml-1 rounded-full active:bg-white/10 transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-[18px] font-bold text-white leading-tight">Business Dashboard</h1>
          <p className="text-[12px] text-white/60">Real-time analytics</p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full active:bg-white/10 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* ── KPI Grid ── */}
            <div className="px-4 pt-4 grid grid-cols-2 gap-3">
              <KpiCard
                icon="💰"
                label="Total Revenue"
                value={fmt(kpis?.revenue ?? 0)}
                sub={`This month: ${fmt(kpis?.thisMonthRevenue ?? 0)}`}
                trend={kpis?.revenueGrowth != null ? `${Math.abs(kpis.revenueGrowth)}%` : undefined}
                trendUp={(kpis?.revenueGrowth ?? 0) >= 0}
              />
              <KpiCard
                icon="📦"
                label="Total Orders"
                value={String(kpis?.totalOrders ?? 0)}
                sub={`Today: ${chart[chart.length-1]?.orders ?? 0}`}
              />
              <KpiCard
                icon="⏳"
                label="Pending Orders"
                value={String(kpis?.pendingOrders ?? 0)}
                sub="Needs attention"
                trend={kpis?.pendingOrders > 0 ? 'Action needed' : undefined}
                trendUp={false}
              />
              <KpiCard
                icon="👥"
                label="Customers"
                value={String(kpis?.customers ?? 0)}
                sub="Unique buyers"
              />
            </div>

            {/* ── Today Revenue Banner ── */}
            <div className="mx-4 mt-3 rounded-2xl px-5 py-4 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #075E54 0%, #25D366 100%)' }}>
              <div>
                <p className="text-[12px] text-white/70 font-medium">Today's Revenue</p>
                <p className="text-[28px] font-bold text-white leading-tight">{fmt(kpis?.todayRevenue ?? 0)}</p>
              </div>
              <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center text-[22px]">🎯</div>
            </div>

            {/* ── 7-Day Revenue Chart ── */}
            <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-[14px] font-bold text-gray-900 mb-0.5">Revenue — Last 7 Days</p>
              <p className="text-[12px] text-gray-400 mb-2">Excluding cancelled orders</p>
              {chart.length > 0 ? (
                <>
                  <RevenueChart data={chart} />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-[11px] text-gray-400">Peak day</p>
                      <p className="text-[13px] font-bold text-gray-900">
                        {chart.reduce((a,b) => b.revenue > a.revenue ? b : a, chart[0]).label}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] text-gray-400">7-day total</p>
                      <p className="text-[13px] font-bold text-gray-900">{fmt(chart.reduce((s,d) => s+d.revenue, 0))}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] text-gray-400">Avg / day</p>
                      <p className="text-[13px] font-bold text-gray-900">{fmt(Math.round(chart.reduce((s,d) => s+d.revenue, 0) / 7))}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-[13px] text-gray-400 py-6 text-center">No orders in the last 7 days</p>
              )}
            </div>

            {/* ── Quick Actions ── */}
            <div className="mx-4 mt-3">
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Actions</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: '📋', label: 'Orders', badge: kpis?.pendingOrders, action: () => navigate('/dashboard/orders') },
                  { icon: '🛍️', label: 'Catalog', badge: 0, action: () => navigate('/dashboard/catalog') },
                  { icon: '🛒', label: 'Share Cart', badge: 0, action: () => navigate('/dashboard/shared-cart/new') },
                  { icon: '⚙️', label: 'Settings', badge: 0, action: () => navigate('/settings') },
                ].map((a, i) => (
                  <button key={i} onClick={a.action} className="bg-white rounded-2xl p-3 flex flex-col items-center gap-1 shadow-sm active:scale-95 transition-transform relative">
                    {(a.badge ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">{a.badge}</span>
                    )}
                    <span className="text-[22px]">{a.icon}</span>
                    <span className="text-[11px] font-medium text-gray-600">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Order Status Distribution ── */}
            <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-[14px] font-bold text-gray-900 mb-3">Order Status Breakdown</p>
              <StatusDonut data={statusDist} total={totalOrdersAll} />
            </div>

            {/* ── Top Products ── */}
            {topProducts.length > 0 && (
              <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-[14px] font-bold text-gray-900 mb-3">Top Products by Revenue</p>
                <div className="space-y-3">
                  {topProducts.map((p, i) => {
                    const maxRev = topProducts[0].revenue || 1
                    const pct = (p.revenue / maxRev) * 100
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold text-gray-400 w-4">#{i+1}</span>
                            <p className="text-[13px] font-medium text-gray-800 truncate max-w-[160px]">{p.name}</p>
                          </div>
                          <p className="text-[13px] font-bold text-gray-900">{fmt(p.revenue)}</p>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #128C7E, #25D366)' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Recent Orders ── */}
            <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                <p className="text-[14px] font-bold text-gray-900">Recent Orders</p>
                <button onClick={() => navigate('/dashboard/orders')} className="text-[12px] font-semibold text-[#128C7E]">View all →</button>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-[13px] text-gray-400 py-8 text-center">No orders yet</p>
              ) : (
                recentOrders.map((order, idx) => (
                  <button
                    key={order.id}
                    onClick={() => navigate('/dashboard/orders')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-gray-50 transition-colors"
                    style={{ borderBottom: idx < recentOrders.length - 1 ? '1px solid #F9FAFB' : 'none' }}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-[#128C7E]/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {order.user?.avatarUrl ? (
                        <img src={order.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[15px]">👤</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">
                          {order.user?.name || order.user?.phone || 'Customer'}
                        </p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${STATUS_BG[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-400 truncate">
                        {order.orderNumber} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <p className="text-[13px] font-bold text-gray-900 shrink-0">{fmt(Number(order.total))}</p>
                  </button>
                ))
              )}
            </div>

            {/* ── Pricing Info ── */}
            <div className="mx-4 mt-3 mb-4">
              <button
                onClick={() => setShowSettings(true)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 active:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#128C7E]/10 flex items-center justify-center text-[18px]">💳</div>
                <div className="flex-1 text-left">
                  <p className="text-[14px] font-semibold text-gray-900">Pricing Settings</p>
                  <p className="text-[12px] text-gray-500">Set tax rate & delivery charges for customers</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}
