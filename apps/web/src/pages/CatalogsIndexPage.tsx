import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import apiClient from '@/lib/api'
import { getInitials } from '@/lib/utils'

export default function CatalogsIndexPage() {
  const navigate = useNavigate()

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['catalogs', 'businesses'],
    queryFn: async () => {
      const { data } = await apiClient.get('/chats')
      const bSet = new Map()
      data.forEach((chat: any) => {
        chat.members.forEach((m: any) => {
          if (m.user?.businessProfile) {
            bSet.set(m.user.businessProfile.id, m.user.businessProfile)
          }
        })
      })
      return Array.from(bSet.values())
    }
  })

  return (
    <div className="flex-1 flex flex-col bg-white">
      <header className="shrink-0 safe-area-top bg-[#075E54] text-white">
        <div className="px-4 py-3">
          <h1 className="text-[20px] font-medium">Catalogs</h1>
          <p className="text-[13px] text-white/70">Businesses you've chatted with</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 animate-pulse">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-square rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : !businesses || businesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <span className="text-4xl mb-4">🏪</span>
            <p className="text-[15px] font-medium text-gray-900">No Catalogs Yet</p>
            <p className="text-[14px] mt-1 text-gray-500">Start chatting with a business to see their catalog here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
            {businesses.map((biz: any) => (
              <button key={biz.id} onClick={() => navigate(`/catalog/${biz.id}`)}
                className="overflow-hidden text-left relative aspect-square flex flex-col justify-end p-3 rounded-lg bg-gray-100 active:opacity-90">
                {biz.coverUrl || biz.logoUrl ? (
                  <img src={biz.coverUrl || biz.logoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#128C7E]">
                    <span className="text-4xl font-bold text-white opacity-50">{getInitials(biz.name)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative">
                  <p className="text-[14px] font-medium text-white leading-tight mb-0.5">{biz.name}</p>
                  <p className="text-[12px] text-white/80">{biz.category || 'Business'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
