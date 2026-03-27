import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import { usePresenceStore } from '@/stores/presenceStore'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { formatTimestamp } from '@/lib/utils'

export default function ChatListPage() {
  const navigate = useNavigate()
  const userId = useAuthStore(s => s.user?.id)
  const { chats, setChats } = useChatStore()
  const presence = usePresenceStore(s => s.presence)
  const [search, setSearch] = useState('')

  // Fetch chats
  const { isLoading, error, refetch } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/chats')
      setChats(data)
      return data
    },
    refetchInterval: 30000,
  })

  // Filter chats by search
  const filtered = useMemo(() => {
    if (!search.trim()) return chats
    const q = search.toLowerCase()
    return chats.filter(chat => {
      const other = chat.members?.find((m: any) => m.user?.id !== userId)
      return other?.user?.name?.toLowerCase().includes(q) ||
        chat.lastMessage?.content?.toLowerCase().includes(q)
    })
  }, [chats, search, userId])

  // Get the "other" user for a DM
  const getOtherUser = (chat: any) => {
    const member = chat.members?.find((m: any) => m.user?.id !== userId)
    return member?.user || { name: 'Unknown', avatarUrl: null, id: '' }
  }

  // ─── Loading Skeleton ──────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col" style={{ background: 'var(--color-background)' }}>
        <Header search={search} onSearch={setSearch} />
        <div className="flex-1 overflow-y-auto px-4 pb-20 md:pb-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-4 animate-pulse">
              <div className="w-12 h-12 rounded-full" style={{ background: 'var(--color-surface)' }} />
              <div className="flex-1 min-w-0">
                <div className="h-3.5 w-32 rounded mb-2" style={{ background: 'var(--color-surface)' }} />
                <div className="h-3 w-48 rounded" style={{ background: 'var(--color-surface)' }} />
              </div>
              <div className="h-3 w-10 rounded" style={{ background: 'var(--color-surface)' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Error State ───────────────────────────────────────
  if (error) {
    return (
      <div className="flex-1 flex flex-col" style={{ background: 'var(--color-background)' }}>
        <Header search={search} onSearch={setSearch} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="var(--color-error)" strokeWidth="1.5" />
              <path d="M12 8V12M12 16H12.01" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Failed to load chats</p>
          <button onClick={() => refetch()}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white"
            style={{ background: 'var(--color-primary)' }}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ─── Empty State ───────────────────────────────────────
  if (filtered.length === 0 && !search) {
    return (
      <div className="flex-1 flex flex-col" style={{ background: 'var(--color-background)' }}>
        <Header search={search} onSearch={setSearch} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92176 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11499 17.053 3.99476 18.5291 5.47086C20.0052 6.94696 20.885 8.91568 21 11V11.5Z"
                stroke="var(--color-primary)" strokeWidth="1.5" fill="var(--color-primary-light)" />
            </svg>
          </div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>No conversations yet</h3>
          <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>Start chatting with businesses to see your conversations here</p>
        </div>
      </div>
    )
  }

  // ─── Chat List ─────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--color-background)' }}>
      <Header search={search} onSearch={setSearch} />

      <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
        {filtered.map(chat => {
          const other = getOtherUser(chat)
          const isOnline = presence[other.id]?.isOnline ?? other.isOnline
          const lastMsg = chat.lastMessage
          const unread = chat.unreadCount || 0
          const initials = other.name
            ? other.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
            : '?'

          return (
            <button
              key={chat.id}
              onClick={() => navigate(`/chats/${chat.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left touch-target"
              style={{ borderBottom: '1px solid var(--glass-border)' }}
            >
              {/* Avatar + online dot */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    background: other.avatarUrl ? 'transparent' : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))',
                  }}>
                  {other.avatarUrl ? (
                    <img src={other.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-white">{initials}</span>
                  )}
                </div>
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2"
                    style={{ background: 'var(--color-success)', borderColor: 'var(--color-background)' }} />
                )}
              </div>

              {/* Name + last message */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-sm truncate ${unread > 0 ? 'font-bold' : 'font-semibold'}`}
                    style={{ color: 'var(--color-text-primary)' }}>
                    {other.name || other.phone}
                  </span>
                  <span className="text-[10px] shrink-0"
                    style={{ color: unread > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                    {lastMsg ? formatTimestamp(lastMsg.createdAt) : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-xs truncate flex-1 ${unread > 0 ? 'font-medium' : ''}`}
                    style={{ color: unread > 0 ? 'var(--color-text-body)' : 'var(--color-text-muted)' }}>
                    {lastMsg?.isDeleted
                      ? '🚫 This message was deleted'
                      : lastMsg?.type === 'TEXT'
                        ? lastMsg.content
                        : lastMsg?.type === 'IMAGE'
                          ? '📷 Photo'
                          : lastMsg?.type === 'PRODUCT_CARD'
                            ? '🛍️ Product'
                            : lastMsg?.type === 'SHARED_CART'
                              ? '🛒 Shared Cart'
                              : lastMsg?.type === 'ORDER_UPDATE'
                                ? '📦 Order Update'
                                : 'Start a conversation'
                    }
                  </p>
                  {unread > 0 && (
                    <span className="min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1.5 animate-badge-bounce"
                      style={{ background: 'var(--color-primary)' }}>
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}

        {/* No search results */}
        {filtered.length === 0 && search && (
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No chats matching "{search}"</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Header Component ────────────────────────────────────
function Header({ search, onSearch }: { search: string; onSearch: (v: string) => void }) {
  const [showSearch, setShowSearch] = useState(false)

  return (
    <header className="px-4 pt-4 pb-3 safe-area-top" style={{ background: 'var(--color-background)' }}>
      {showSearch ? (
        <div className="flex items-center gap-2 animate-fade-up">
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            autoFocus
            className="flex-1 h-10 px-4 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--glass-border)',
              color: 'var(--color-text-primary)',
              caretColor: 'var(--color-primary)',
            }}
          />
          <button onClick={() => { onSearch(''); setShowSearch(false) }}
            className="h-10 px-3 rounded-xl text-xs font-medium touch-target"
            style={{ color: 'var(--color-primary)' }}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Chats</h1>
          <button onClick={() => setShowSearch(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center touch-target"
            style={{ color: 'var(--color-text-muted)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <circle cx="11" cy="11" r="8" stroke="currentColor" />
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </header>
  )
}
