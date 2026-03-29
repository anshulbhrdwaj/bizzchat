import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'

function ToolRow({ icon, title, description, badge, onClick }: { icon: string; title: string; description: string; badge?: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 w-full px-4 py-3.5 text-left bg-white active:bg-gray-50 transition-colors border-b border-gray-100">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 bg-[#128C7E]/10">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <p className="text-[16px] text-gray-900">{title}</p>
          {badge ? (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white bg-[#25D366]">{badge}</span>
          ) : null}
        </div>
        <p className="text-[14px] text-gray-500 truncate">{description}</p>
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-gray-400">
        <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => { const { data } = await apiClient.get('/business/dashboard'); return data },
    refetchInterval: 30000,
  })

  const pendingOrders = data?.kpis?.pendingOrders || 0

  return (
    <div className="flex-1 flex flex-col bg-[#F0F2F5]">
      {/* WhatsApp header */}
      <header className="px-4 py-3 flex items-center gap-3 safe-area-top shrink-0 bg-[#075E54] text-white">
        <button onClick={() => navigate('/chats')} className="w-8 h-8 flex items-center justify-center -ml-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="text-[20px] font-medium flex-1">Business tools</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
        <div className="mt-2 bg-white border-y border-gray-200">
          <ToolRow icon="🏪" title="Business profile" description="Manage address, hours, and websites" onClick={() => navigate('/settings')} />
          <ToolRow icon="🛍️" title="Catalog" description="Show products and services" onClick={() => navigate('/dashboard/catalog')} />
          <ToolRow icon="📦" title="Orders" description="Manage your customer orders" badge={pendingOrders > 0 ? pendingOrders : undefined} onClick={() => navigate('/dashboard/orders')} />
          <ToolRow icon="🛒" title="Share custom cart" description="Send a pre-filled cart to a customer" onClick={() => navigate('/dashboard/shared-cart/new')} />
        </div>

        <div className="px-4 pt-5 pb-2">
          <p className="text-[14px] text-[#128C7E] font-medium">Messaging tools</p>
        </div>
        <div className="bg-white border-y border-gray-200">
          <ToolRow icon="👋" title="Greeting message" description="Welcome new customers automatically" onClick={() => alert('Greeting message setup coming soon')} />
          <ToolRow icon="⚡" title="Quick replies" description="Reuse frequent messages" onClick={() => alert('Quick replies coming soon')} />
        </div>
      </div>
    </div>
  )
}
