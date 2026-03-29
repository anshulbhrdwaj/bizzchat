import { useNavigate } from 'react-router-dom'
import { getInitials } from '@/lib/utils'

interface ProfilePanelProps {
  user: any
  onClose: () => void
}

export default function ProfilePanel({ user, onClose }: ProfilePanelProps) {
  const navigate = useNavigate()
  const isBusiness = !!user?.businessProfile
  const bp = user?.businessProfile

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#F0F2F5] animate-slide-in-right overflow-hidden">
      {/* Header */}
      <header className="h-14 px-3 flex items-center gap-3 shrink-0 safe-area-top bg-[#075E54] text-white">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-[17px] font-medium">{isBusiness ? 'Business info' : 'Contact info'}</h2>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isBusiness ? (
          <>
            {/* Business cover + logo */}
            <div className="bg-[#128C7E] h-32 relative">
              {bp.coverUrl && <img src={bp.coverUrl} alt="Cover" className="w-full h-full object-cover" />}
              <div className="absolute -bottom-10 left-4">
                <div className="w-20 h-20 rounded-full border-4 border-[#F0F2F5] bg-gray-200 overflow-hidden shadow-sm flex items-center justify-center">
                  {bp.logoUrl ? (
                    <img src={bp.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-gray-500">{getInitials(bp.name)}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white mt-0 pt-12 px-5 pb-5">
              <h3 className="text-[22px] font-medium text-gray-900">{bp.name}</h3>
              <p className="text-[14px] text-[#128C7E] font-medium">{bp.category || 'Business'}</p>

              <button onClick={() => navigate(`/catalog/${bp.id}`)}
                className="w-full mt-4 py-3 flex items-center justify-center gap-2 rounded bg-[#128C7E] text-white text-[15px] font-medium active:bg-[#075E54]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6H21V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2" />
                </svg>
                View Catalog
              </button>
            </div>

            {bp.description && (
              <div className="bg-white mt-2 px-5 py-4">
                <p className="text-[13px] text-gray-500 uppercase font-medium mb-2">About</p>
                <p className="text-[15px] text-gray-700 leading-relaxed">{bp.description}</p>
              </div>
            )}

            <div className="bg-white mt-2 px-5 py-4 space-y-4">
              {user.phone && (
                <div className="flex items-center gap-3">
                  <span className="text-xl">📞</span>
                  <span className="text-[15px] text-gray-700">{user.phone}</span>
                </div>
              )}
              {bp.email && (
                <div className="flex items-center gap-3">
                  <span className="text-xl">✉️</span>
                  <span className="text-[15px] text-gray-700">{bp.email}</span>
                </div>
              )}
              {bp.address && (
                <div className="flex items-start gap-3">
                  <span className="text-xl">📍</span>
                  <span className="text-[15px] text-gray-700">{bp.address}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Regular contact */}
            <div className="bg-white pt-8 px-5 pb-6 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden shadow-sm flex items-center justify-center mb-4">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#8696A0" strokeWidth="1.5">
                    <path d="M20 21V19C20 16.24 15.5 15 12 15C8.5 15 4 16.24 4 19V21" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <h3 className="text-[22px] font-medium text-gray-900">{user?.name || 'Unknown'}</h3>
              <p className="text-[15px] text-gray-500 mt-1">{user?.phone}</p>
            </div>

            <div className="bg-white mt-2 px-5 py-4 space-y-0">
              <button className="w-full py-4 text-left text-[16px] text-red-500 border-b border-gray-100">
                Block {user?.name?.split(' ')[0] || 'contact'}
              </button>
              <button className="w-full py-4 text-left text-[16px] text-red-500">
                Report {user?.name?.split(' ')[0] || 'contact'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
