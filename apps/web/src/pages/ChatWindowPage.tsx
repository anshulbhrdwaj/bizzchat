import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import { usePresenceStore } from '@/stores/presenceStore'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { formatDateSeparator, getInitials, formatLastSeen } from '@/lib/utils'
import MessageBubble from '@/components/chat/MessageBubble'
import ChatInputBar from '@/components/chat/ChatInputBar'
import TypingIndicator from '@/components/chat/TypingIndicator'
import ProfilePanel from '@/components/chat/ProfilePanel'

export default function ChatWindowPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const userId = useAuthStore(s => s.user?.id)
  const presence = usePresenceStore(s => s.presence)
  const typingUsers = useChatStore(s => s.typingUsers)
  const storeMessages = useChatStore(s => s.messages[chatId || ''] || [])

  const cachedChats = useChatStore(s => s.chats)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [pendingUnread, setPendingUnread] = useState(0)
  const [replyTo, setReplyTo] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [didInitialScroll, setDidInitialScroll] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Join chat room via socket
  useEffect(() => {
    if (!chatId) return
    const socket = getSocket()
    socket?.emit('join:chat', chatId)
    socket?.emit('chat:read', { chatId })
  }, [chatId])

  // Fetch chat details + messages
  const { data, isLoading } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const [chatRes, msgRes] = await Promise.all([
        apiClient.get(`/chats/${chatId}`),
        apiClient.get(`/chats/${chatId}/messages`),
      ])
      const chat = chatRes.data
      const msgsArray = msgRes.data?.data || []
      setNextCursor(msgRes.data?.nextCursor || null)

      // Backend returns newest first, reverse to oldest-first for display
      const reversedMsgs = [...msgsArray].reverse()
      if (chatId) {
        useChatStore.getState().setMessages(chatId, reversedMsgs)
        if (reversedMsgs.length > 0) {
          useChatStore.getState().updateChatPreview(chatId, reversedMsgs[reversedMsgs.length - 1], 0)
        }
      }

      return { chat, messages: reversedMsgs }
    },
    enabled: !!chatId,
  })

  // Derived other user (syncs immediately if in cache)
  const otherUserFromQuery = data?.chat?.members?.find((m: any) => m.user?.id !== userId)?.user
  const initialOtherUser = cachedChats.find(c => c.id === chatId)?.members?.find((m: any) => m.user?.id !== userId)?.user
  const otherUser = otherUserFromQuery || initialOtherUser || null

  // Immediately scroll to bottom on initial load (when messages first appear)
  useEffect(() => {
    if (!isLoading && storeMessages.length > 0 && !didInitialScroll) {
      // Use instant scroll on first load
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior })
      setDidInitialScroll(true)
    }
  }, [isLoading, storeMessages.length, didInitialScroll])

  // Listen for new messages
  useEffect(() => {
    const socket = getSocket()
    const handleNewMsg = (msg: any) => {
      if (msg.chatId === chatId && msg.senderId !== userId) {
        socket?.emit('message:read', { chatId, messageId: msg.id })
        if (showScrollBtn) {
          setPendingUnread(prev => prev + 1)
        }
      }
    }
    socket?.on('message:new', handleNewMsg)
    return () => { socket?.off('message:new', handleNewMsg) }
  }, [chatId, userId, showScrollBtn])

  // Auto-scroll to bottom when new messages arrive (if near bottom)
  useEffect(() => {
    if (!showScrollBtn && didInitialScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [storeMessages.length, showScrollBtn, didInitialScroll])

  // Scroll tracking for FAB and Pagination
  const handleScroll = useCallback(async () => {
    const el = scrollContainerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight

    const shouldShow = distFromBottom > 150
    setShowScrollBtn(shouldShow)
    if (!shouldShow && pendingUnread > 0) {
      setPendingUnread(0)
    }

    // Load more messages if scrolled to top
    if (el.scrollTop < 60 && nextCursor && !isFetchingMore && chatId) {
      setIsFetchingMore(true)
      const prevHeight = el.scrollHeight

      try {
        const res = await apiClient.get(`/chats/${chatId}/messages?cursor=${nextCursor}`)
        const olderMsgs = res.data?.data || []
        if (olderMsgs.length > 0) {
          const reversedOlder = [...olderMsgs].reverse()
          useChatStore.getState().appendMessages(chatId, reversedOlder)
        }
        setNextCursor(res.data?.nextCursor || null)

        // Restore scroll position after prepend
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop =
              scrollContainerRef.current.scrollHeight - prevHeight
          }
        })
      } catch (err) {
        console.error('Failed to load older msgs', err)
      } finally {
        setIsFetchingMore(false)
      }
    }
  }, [nextCursor, isFetchingMore, chatId, pendingUnread])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollBtn(false)
    setPendingUnread(0)
  }

  // Send message (text)
  const handleSend = (content: string) => {
    if (!chatId || !userId) return
    const tempId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const optimistic = {
      id: tempId,
      tempId,
      chatId,
      senderId: userId,
      content,
      type: 'TEXT',
      createdAt: new Date().toISOString(),
      replyTo: replyTo
        ? { content: replyTo.content, sender: { name: replyTo.senderName } }
        : null,
    }
    useChatStore.getState().addOptimisticMessage(chatId, optimistic)
    setReplyTo(null)
    // Scroll to bottom after send
    setTimeout(scrollToBottom, 50)

    const socket = getSocket()
    socket?.emit('message:send', {
      chatId,
      content,
      type: 'TEXT',
      replyToId: replyTo?.id,
      metadata: { tempId },
    })

    setTimeout(() => {
      const state = useChatStore.getState()
      const currentMsg = state.messages[chatId]?.find((m: any) => m.tempId === tempId)
      if ((currentMsg as any)?.status === 'SENDING') {
        state.markMessageFailed(chatId, tempId)
      }
    }, 5000)
  }

  const handleTypingStart = () => getSocket()?.emit('typing:start', { chatId })
  const handleTypingStop = () => getSocket()?.emit('typing:stop', { chatId })

  // Group messages by date and group consecutive same-sender (3-min rule)
  const messagesWithSeparators = storeMessages.reduce<{ type: 'date' | 'msg'; data: any }[]>((acc, msg, i) => {
    const msgDate = new Date(msg.createdAt).toDateString()
    const prevMsg = i > 0 ? storeMessages[i - 1] : null
    const prevDate = prevMsg ? new Date(prevMsg.createdAt).toDateString() : null

    if (msgDate !== prevDate) {
      acc.push({ type: 'date', data: msg.createdAt })
    }

    let isFirstInGroup = true
    if (prevMsg) {
      const timeDiffMs = new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()
      if (
        prevMsg.senderId === msg.senderId &&
        timeDiffMs <= 3 * 60 * 1000 &&
        msgDate === prevDate
      ) {
        isFirstInGroup = false
      }
    }

    acc.push({ type: 'msg', data: { ...msg, isFirstInGroup } })
    return acc
  }, [])

  let isOnline = false
  let lastSeenTime: string | null = null
  const someoneTyping = chatId && typingUsers[chatId]?.some(uid => uid !== userId)
  if (otherUser) {
    if (presence[otherUser.id]) {
      isOnline = presence[otherUser.id].isOnline
      lastSeenTime = presence[otherUser.id].lastSeen || otherUser.lastSeen
    } else {
      isOnline = otherUser.isOnline
      lastSeenTime = otherUser.lastSeen
    }
    
    if (isOnline && lastSeenTime) {
      if (Date.now() - new Date(lastSeenTime).getTime() > 120000) {
        isOnline = false
      }
    }
  }
  const lastSeen = lastSeenTime ? formatLastSeen(lastSeenTime) : null

  // ─── Loading ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-chat-bg)' }}>
        {/* Loading header */}
        <header className="h-14 px-2 flex items-center gap-2 shrink-0 bg-[#075E54] text-white">
          <div className="w-10 h-10 rounded-full animate-pulse bg-white/20" />
          <div className="flex-1">
            <div className="h-3.5 w-28 rounded animate-pulse mb-1.5 bg-white/20" />
            <div className="h-2.5 w-16 rounded animate-pulse bg-white/10" />
          </div>
        </header>
        {/* Loading bubbles */}
        <div className="flex-1 overflow-hidden px-2 py-4 space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? '' : 'justify-end'}`}>
              <div className="h-10 rounded-xl animate-pulse" style={{
                width: `${38 + (i * 17) % 30}%`,
                background: i % 2 === 0 ? 'white' : '#D9FDD3',
              }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Main Chat Window ──────────────────────────────────
  return (
    <div className="relative flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-chat-bg)' }}>
      {/* ── Header ── */}
      <header className="flex items-center gap-2 px-2 shrink-0 bg-[#075E54] text-white"
        style={{ height: '56px', paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Back button (mobile only) */}
        <button
          onClick={() => navigate('/chats')}
          className="w-9 h-9 flex items-center justify-center md:hidden shrink-0 rounded-full active:bg-white/10 transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Avatar + Name/Status — tappable to open profile */}
        <button
          onClick={() => setShowProfile(true)}
          className="flex-1 min-w-0 flex items-center gap-3 h-full text-left"
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white/20">
              {otherUser?.avatarUrl ? (
                <img src={otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">{getInitials(otherUser?.name)}</span>
              )}
            </div>
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#25D366] border-2 border-[#075E54]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-semibold truncate leading-tight">{otherUser?.name || 'Unknown'}</p>
            <p className="text-[12px] opacity-80 leading-tight">
              {isOnline ? 'online' : lastSeen ? `last seen ${lastSeen}` : 'offline'}
            </p>
          </div>
        </button>

        {/* Header action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button className="w-9 h-9 flex items-center justify-center rounded-full active:bg-white/10 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.92V19.92C22.0011 20.4813 21.7583 21.0175 21.3296 21.3926C20.9009 21.7678 20.3355 21.9513 19.7699 21.8998C16.5289 21.5564 13.4193 20.4289 10.7 18.6199C8.17 17.0003 6.01 14.8403 4.39 12.3099C2.57 9.58123 1.44267 6.45773 1.1 3.19986C1.04872 2.63584 1.23055 2.07176 1.60353 1.64309C1.97651 1.21441 2.50802 0.97025 3.07 0.969861H6.07C7.0664 0.959861 7.9139 1.67137 8.07 2.65986C8.22272 3.61971 8.48572 4.55927 8.85 5.45986C9.11 6.07986 8.94 6.78986 8.43 7.25986L7.09 8.59986C8.60524 11.2403 10.7597 13.3947 13.4 14.9099L14.74 13.5699C15.21 13.0599 15.92 12.8899 16.54 13.1499C17.4406 13.5142 18.3801 13.7772 19.34 13.9299C20.3399 14.0879 21.0598 14.9499 21.04 15.9599L22 16.92Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full active:bg-white/10 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Load more indicator ── */}
      {isFetchingMore && (
        <div className="flex justify-center py-2 shrink-0">
          <div className="bg-white/80 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
            <div className="w-3 h-3 border-2 border-[#128C7E] border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] text-[#667781]">Loading older messages...</span>
          </div>
        </div>
      )}

      {/* ── Message List (scrollable) ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ paddingTop: '8px', paddingBottom: '4px' }}
      >
        {/* No messages state */}
        {storeMessages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-8 py-12">
            <div className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center shadow-sm">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92176 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11499 17.053 3.99476 18.5291 5.47086C20.0052 6.94696 20.885 8.91568 21 11V11.5Z" stroke="#128C7E" strokeWidth="1.8" fill="none"/>
              </svg>
            </div>
            <p className="text-[14px] text-[#667781] text-center">
              Say hello! Start the conversation.
            </p>
          </div>
        )}

        {messagesWithSeparators.map((item, i) => {
          if (item.type === 'date') {
            return (
              <div key={`date-${i}`} className="flex justify-center py-3">
                <span className="px-3 py-1 rounded-lg text-[12px] font-medium bg-white/90 text-[#667781] shadow-sm">
                  {formatDateSeparator(item.data)}
                </span>
              </div>
            )
          }
          const msg = item.data
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === userId}
              senderName={msg.senderId === userId ? 'You' : otherUser?.name}
              isFirstInGroup={msg.isFirstInGroup}
              onSwipeReply={() => setReplyTo({
                id: msg.id,
                content: msg.type === 'TEXT' ? msg.content : msg.type,
                senderName: msg.senderId === userId ? 'You' : (otherUser?.name || 'User'),
              })}
            />
          )
        })}

        {/* Typing indicator */}
        {someoneTyping && <TypingIndicator />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} style={{ height: '1px' }} />
      </div>

      {/* ── Scroll to Bottom FAB ── */}
      {showScrollBtn && (
        <div className="absolute right-4 z-20" style={{ bottom: 'calc(70px + env(safe-area-inset-bottom))' }}>
          <button
            onClick={scrollToBottom}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-lg transition-all active:scale-95 hover:shadow-md"
          >
            {pendingUnread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 bg-[#25D366] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {pendingUnread > 99 ? '99+' : pendingUnread}
              </span>
            )}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3V15M9 15L4 10M9 15L14 10" stroke="#667781" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Input Bar ── */}
      <ChatInputBar
        onSend={handleSend}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        replyTo={
          replyTo
            ? {
                senderName: replyTo.senderName,
                content: replyTo.content || 'Message',
              }
            : null
        }
        onCancelReply={() => setReplyTo(null)}
        disabled={isLoading}
      />

      {/* ── Profile Sidebar ── */}
      {showProfile && otherUser && (
        <ProfilePanel user={otherUser} onClose={() => setShowProfile(false)} />
      )}
    </div>
  )
}
