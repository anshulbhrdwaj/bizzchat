import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import { usePresenceStore } from '@/stores/presenceStore'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { formatDateSeparator, getInitials } from '@/lib/utils'
import MessageBubble from '@/components/chat/MessageBubble'
import ChatInputBar from '@/components/chat/ChatInputBar'
import TypingIndicator from '@/components/chat/TypingIndicator'

export default function ChatWindowPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const userId = useAuthStore(s => s.user?.id)
  const presence = usePresenceStore(s => s.presence)
  const typingUsers = useChatStore(s => s.typingUsers)

  const [messages, setMessages] = useState<any[]>([])
  const [otherUser, setOtherUser] = useState<any>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [replyTo, setReplyTo] = useState<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Join chat room via socket
  useEffect(() => {
    if (!chatId) return
    const socket = getSocket()
    socket?.emit('join:chat', chatId)
    return () => { socket?.emit('leave:chat', chatId) }
  }, [chatId])

  // Fetch chat details + messages
  const { isLoading } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const [chatRes, msgRes] = await Promise.all([
        apiClient.get(`/chats/${chatId}`),
        apiClient.get(`/chats/${chatId}/messages`),
      ])
      const chat = chatRes.data
      const other = chat.members?.find((m: any) => m.user?.id !== userId)?.user
      setOtherUser(other || { name: 'Unknown', id: '' })
      setMessages(msgRes.data)
      return { chat, messages: msgRes.data }
    },
    enabled: !!chatId,
  })

  // Listen for new messages
  useEffect(() => {
    const socket = getSocket()
    const handleNewMsg = (msg: any) => {
      if (msg.chatId === chatId) {
        setMessages(prev => [...prev, msg])
        // Mark as read
        socket?.emit('message:read', { chatId, messageId: msg.id })
      }
    }
    socket?.on('message:new', handleNewMsg)
    return () => { socket?.off('message:new', handleNewMsg) }
  }, [chatId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!showScrollBtn) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, showScrollBtn])

  // Scroll tracking for FAB
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(distFromBottom > 200)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollBtn(false)
  }

  // Send message
  const handleSend = (content: string) => {
    const socket = getSocket()
    socket?.emit('message:send', {
      chatId,
      content,
      type: 'TEXT',
      replyToId: replyTo?.id,
    })
    // Optimistic update
    const optimistic = {
      id: `temp-${Date.now()}`,
      chatId,
      senderId: userId,
      content,
      type: 'TEXT',
      createdAt: new Date().toISOString(),
      replyTo: replyTo ? { content: replyTo.content, sender: { name: replyTo.senderName } } : null,
    }
    setMessages(prev => [...prev, optimistic])
    setReplyTo(null)
  }

  const handleTypingStart = () => {
    getSocket()?.emit('typing:start', { chatId })
  }
  const handleTypingStop = () => {
    getSocket()?.emit('typing:stop', { chatId })
  }

  // Group messages by date
  const messagesWithSeparators = messages.reduce<{ type: 'date' | 'msg'; data: any }[]>((acc, msg, i) => {
    const msgDate = new Date(msg.createdAt).toDateString()
    const prevDate = i > 0 ? new Date(messages[i - 1].createdAt).toDateString() : null
    if (msgDate !== prevDate) {
      acc.push({ type: 'date', data: msg.createdAt })
    }
    acc.push({ type: 'msg', data: msg })
    return acc
  }, [])

  // Is someone typing in this chat?
  const someoneTyping = chatId && typingUsers[chatId]?.some(uid => uid !== userId)

  // Online status
  const isOnline = otherUser ? (presence[otherUser.id]?.isOnline ?? otherUser.isOnline) : false
  const lastSeen = otherUser?.lastSeen
    ? new Date(otherUser.lastSeen).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : null

  // ─── Loading ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col" style={{ background: 'var(--color-background)' }}>
        <div className="h-16 px-4 flex items-center gap-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: 'var(--color-surface)' }} />
          <div className="flex-1">
            <div className="h-3.5 w-28 rounded animate-pulse mb-1.5" style={{ background: 'var(--color-surface)' }} />
            <div className="h-2.5 w-16 rounded animate-pulse" style={{ background: 'var(--color-surface)' }} />
          </div>
        </div>
        <div className="flex-1 px-4 py-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? '' : 'justify-end'}`}>
              <div className="h-10 rounded-2xl animate-pulse" style={{
                width: `${40 + Math.random() * 30}%`,
                background: i % 2 === 0 ? 'var(--color-surface)' : 'rgba(91, 63, 217, 0.08)',
              }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Main Chat Window ──────────────────────────────────
  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="h-16 px-3 flex items-center gap-3 border-b safe-area-top shrink-0"
        style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)', backdropFilter: 'blur(12px)' }}>
        {/* Back button (mobile) */}
        <button onClick={() => navigate('/chats')}
          className="w-9 h-9 rounded-xl flex items-center justify-center touch-target md:hidden"
          style={{ color: 'var(--color-text-primary)' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: otherUser?.avatarUrl ? 'transparent' : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))',
            }}>
            {otherUser?.avatarUrl ? (
              <img src={otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-white">{getInitials(otherUser?.name)}</span>
            )}
          </div>
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style={{ background: 'var(--color-success)', borderColor: 'var(--color-background)' }} />
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
            {otherUser?.name || 'Unknown'}
          </p>
          <p className="text-[10px]" style={{ color: isOnline ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
            {isOnline ? 'Online' : lastSeen ? `Last seen ${lastSeen}` : 'Offline'}
          </p>
        </div>

        {/* Overflow menu */}
        <button className="w-9 h-9 rounded-xl flex items-center justify-center touch-target"
          style={{ color: 'var(--color-text-muted)' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="4" r="1.5" fill="currentColor" />
            <circle cx="10" cy="10" r="1.5" fill="currentColor" />
            <circle cx="10" cy="16" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </header>

      {/* Message List */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4 relative"
      >
        {messagesWithSeparators.map((item, i) => {
          if (item.type === 'date') {
            return (
              <div key={`date-${i}`} className="flex justify-center py-3">
                <span className="px-4 py-1 rounded-full text-[11px] font-medium"
                  style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
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
            />
          )
        })}

        {/* Typing indicator */}
        {someoneTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom FAB */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg animate-scale-in z-10"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 3V15M9 15L4 10M9 15L14 10" stroke="var(--color-text-primary)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Input Bar */}
      <ChatInputBar
        onSend={handleSend}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  )
}
