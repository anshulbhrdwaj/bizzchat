import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatMessageTime } from '@/lib/utils'

interface MessageBubbleProps {
  message: {
    id: string
    senderId: string
    content?: string | null
    type: string
    isDeleted?: boolean
    deletedFor?: string | null
    deliveredAt?: string | null
    readAt?: string | null
    createdAt: string
    status?: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
    replyTo?: { content?: string; sender?: { name: string } } | null
    reactions?: { emoji: string; userId: string }[]
    metadata?: Record<string, any>
  }
  isOwn: boolean
  senderName?: string
  isFirstInGroup?: boolean
  onSwipeReply?: () => void
}

export default function MessageBubble({ message, isOwn, senderName, isFirstInGroup, onSwipeReply }: MessageBubbleProps) {
  const navigate = useNavigate()
  const displayName = !isOwn && senderName ? senderName : null
  const showTail = isFirstInGroup !== false
  const containerMargin = showTail ? 'mt-2' : 'mt-[2px]'

  // Swipe to reply
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const hasSwiping = useRef(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    hasSwiping.current = false
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    }
    // Long press after 500ms
    longPressTimerRef.current = setTimeout(() => {
      if (!hasSwiping.current) {
        setShowContextMenu(true)
      }
    }, 500)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const dx = e.touches[0].clientX - touchStartRef.current.x
    const dy = e.touches[0].clientY - touchStartRef.current.y

    if (Math.abs(dy) > Math.abs(dx)) {
      clearTimeout(longPressTimerRef.current)
      setSwipeOffset(0)
      return
    }

    // Clear long press on swipe
    clearTimeout(longPressTimerRef.current)
    hasSwiping.current = Math.abs(dx) > 8

    // Swipe right for own, swipe right for incoming too (standard WhatsApp)
    if (dx > 0 && dx < 80) {
      setSwipeOffset(dx)
    }
  }

  const handleTouchEnd = () => {
    clearTimeout(longPressTimerRef.current)
    if (swipeOffset > 40 && onSwipeReply) {
      onSwipeReply()
    }
    setSwipeOffset(0)
    touchStartRef.current = null
  }

  // Desktop: double-click to reply
  const handleDoubleClick = useCallback(() => {
    onSwipeReply?.()
  }, [onSwipeReply])

  const renderStatusIcon = () => {
    if (message.status === 'FAILED') {
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="ml-0.5">
          <circle cx="8" cy="8" r="8" fill="#EF4444"/>
          <path d="M8 4V9M8 12V12.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    }
    if (message.status === 'SENDING') {
      return (
        <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" className="text-gray-400 ml-0.5 animate-spin" style={{ animationDuration: '2s' }}>
          <path d="M8 0a8 8 0 1 0 8 8 8.009 8.009 0 0 0-8-8Zm0 14.5a6.5 6.5 0 1 1 6.5-6.5 6.507 6.507 0 0 1-6.5 6.5Z" opacity="0.3"/>
          <path d="M8 0v3.5A4.5 4.5 0 0 1 12.5 8H16A8 8 0 0 0 8 0Z"/>
        </svg>
      )
    }
    if (message.readAt) {
      return (
        <svg width="16" height="11" viewBox="0 0 16 11" className="ml-0.5">
          <path d="M11.071 0.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.085a.46.46 0 0 0-.327-.14.458.458 0 0 0-.33.135.505.505 0 0 0-.14.363.497.497 0 0 0 .15.355l2.407 2.478a.464.464 0 0 0 .32.132.455.455 0 0 0 .341-.156l6.615-8.142a.463.463 0 0 0-.15-.652z" fill="#53BDEB"/>
          <path d="M15.071 0.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.085a.46.46 0 0 0-.327-.14.458.458 0 0 0-.33.135.505.505 0 0 0-.14.363.497.497 0 0 0 .15.355l2.407 2.478a.464.464 0 0 0 .32.132.455.455 0 0 0 .341-.156l6.615-8.142a.463.463 0 0 0-.15-.652z" fill="#53BDEB"/>
        </svg>
      )
    }
    if (message.deliveredAt) {
      return (
        <svg width="16" height="11" viewBox="0 0 16 11" className="ml-0.5">
          <path d="M11.071 0.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.085a.46.46 0 0 0-.327-.14.458.458 0 0 0-.33.135.505.505 0 0 0-.14.363.497.497 0 0 0 .15.355l2.407 2.478a.464.464 0 0 0 .32.132.455.455 0 0 0 .341-.156l6.615-8.142a.463.463 0 0 0-.15-.652z" fill="#8696A0"/>
          <path d="M15.071 0.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.085a.46.46 0 0 0-.327-.14.458.458 0 0 0-.33.135.505.505 0 0 0-.14.363.497.497 0 0 0 .15.355l2.407 2.478a.464.464 0 0 0 .32.132.455.455 0 0 0 .341-.156l6.615-8.142a.463.463 0 0 0-.15-.652z" fill="#8696A0"/>
        </svg>
      )
    }
    // Sent (single tick)
    return (
      <svg width="16" height="11" viewBox="0 0 16 11" className="ml-0.5">
        <path d="M11.071 0.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.085a.46.46 0 0 0-.327-.14.458.458 0 0 0-.33.135.505.505 0 0 0-.14.363.497.497 0 0 0 .15.355l2.407 2.478a.464.464 0 0 0 .32.132.455.455 0 0 0 .341-.156l6.615-8.142a.463.463 0 0 0-.15-.652z" fill="#8696A0"/>
      </svg>
    )
  }

  // Deleted message
  if (message.isDeleted) {
    return (
      <div className={`flex px-2 py-[1px] ${isOwn ? 'justify-end' : 'justify-start'} ${containerMargin}`}>
        <div className={`px-3 py-2 max-w-[85%] md:max-w-[65%] rounded-[7.5px] shadow-sm ${
          isOwn ? 'bg-[#D9FDD3] rounded-tr-none' : 'bg-white rounded-tl-none'
        }`}>
          <p className="text-[14px] italic text-gray-400">🚫 This message was deleted</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Context Menu Overlay */}
      {showContextMenu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in"
          onClick={() => setShowContextMenu(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden w-[220px] animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { onSwipeReply?.(); setShowContextMenu(false) }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-[15px] text-[#111B21] hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 14L4 9L9 4" stroke="#128C7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 9H15C17.7614 9 20 11.2386 20 14V20" stroke="#128C7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Reply
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(message.content || '')
                setShowContextMenu(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-[15px] text-[#111B21] hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="#8696A0" strokeWidth="1.8"/>
                <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="#8696A0" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Copy
            </button>
            <button
              onClick={() => setShowContextMenu(false)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-[15px] text-red-500 hover:bg-gray-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 6H21M19 6L18.1111 19.1685C18.0462 20.1947 17.204 21 16.1759 21H7.82412C6.79598 21 5.95384 20.1947 5.88886 19.1685L5 6M10 11V16M14 11V16M15 6V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}

      <div
        className={`relative flex w-full px-2 py-[1px] ${isOwn ? 'justify-end' : 'justify-start'} ${containerMargin}`}
      >
        {/* Swipe Reply Icon */}
        {swipeOffset > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-8 w-8 bg-gray-200/80 rounded-full flex items-center justify-center"
            style={{
              opacity: Math.min(swipeOffset / 40, 1),
              left: '8px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M10 9L5 14L10 19" stroke="#128C7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 14H14C17.3137 14 20 11.3137 20 8V5" stroke="#128C7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative max-w-[85%] md:max-w-[65%] shadow-sm transition-transform duration-75 select-text ${
            isOwn
              ? `bg-[#D9FDD3] ${showTail ? 'rounded-[7.5px] rounded-tr-none' : 'rounded-[7.5px]'}`
              : `bg-white ${showTail ? 'rounded-[7.5px] rounded-tl-none' : 'rounded-[7.5px]'}`
          }`}
          style={{ transform: `translateX(${swipeOffset}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
        >
          {/* Sender name (incoming groups) */}
          {showTail && displayName && (
            <p className="text-[12.5px] font-semibold text-[#128C7E] pt-1.5 px-2.5">
              {displayName}
            </p>
          )}

          {/* Reply preview */}
          {message.replyTo && (
            <div className={`mx-1.5 mt-1.5 px-2.5 py-2 rounded-lg text-[13px] border-l-[3px] border-[#128C7E] ${
              isOwn ? 'bg-[#C8F0C0]' : 'bg-[#F0F2F5]'
            }`}>
              <p className="text-[12px] font-semibold text-[#128C7E] truncate">
                {message.replyTo.sender?.name || 'Unknown'}
              </p>
              <p className="text-[13px] text-gray-500 truncate leading-snug">
                {message.replyTo.content || 'Message'}
              </p>
            </div>
          )}

          {/* ── TEXT ── */}
          {message.type === 'TEXT' && (
            <div className="px-2.5 pt-1 pb-[5px]">
              <span className="text-[14.2px] leading-[20px] break-words whitespace-pre-wrap text-[#111B21]">
                {message.content}
              </span>
              {/* Timestamp inline (float right trick) */}
              <span className="inline-flex items-center gap-0.5 float-right ml-3 mt-1 translate-y-[1px]">
                <span className="text-[11px] text-[#667781] whitespace-nowrap">
                  {formatMessageTime(message.createdAt)}
                </span>
                {isOwn && renderStatusIcon()}
              </span>
            </div>
          )}

          {/* ── IMAGE ── */}
          {message.type === 'IMAGE' && (
            <div>
              <div className="rounded-[7px] overflow-hidden">
                <img
                  src={message.content || ''}
                  alt="Shared image"
                  className="max-w-full block"
                  style={{ maxHeight: '300px', objectFit: 'cover', width: '100%' }}
                />
              </div>
              <div className={`flex items-center gap-1 px-2 pb-1.5 pt-1 ${isOwn ? 'justify-end' : ''}`}>
                <span className="text-[11px] text-[#667781]">{formatMessageTime(message.createdAt)}</span>
                {isOwn && renderStatusIcon()}
              </div>
            </div>
          )}

          {/* ── DOCUMENT ── */}
          {message.type === 'DOCUMENT' && (
            <div className="px-2.5 py-2">
              <div className={`flex items-center gap-2.5 p-2 rounded-lg ${isOwn ? 'bg-[#C8F0C0]' : 'bg-[#F0F2F5]'}`}>
                <div className="w-10 h-10 rounded-lg bg-[#128C7E]/10 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#128C7E" strokeWidth="1.8"/>
                    <polyline points="14 2 14 8 20 8" stroke="#128C7E" strokeWidth="1.8"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#111B21] truncate">Document</p>
                  <p className="text-[11px] text-[#667781]">Tap to open</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                <span className="text-[11px] text-[#667781]">{formatMessageTime(message.createdAt)}</span>
                {isOwn && renderStatusIcon()}
              </div>
            </div>
          )}

          {/* ── PRODUCT CARD ── */}
          {message.type === 'PRODUCT_CARD' && (
            <div 
              className="px-2.5 py-2 cursor-pointer"
              onClick={() => {
                if (message.metadata?.businessId && message.metadata?.productId) {
                  navigate(`/catalog/${message.metadata.businessId}/product/${message.metadata.productId}`)
                }
              }}
            >
              <div className={`flex items-center gap-2 p-2 rounded-lg ${isOwn ? 'bg-[#C8F0C0]' : 'bg-[#F0F2F5]'}`}>
                <div className="w-10 h-10 rounded bg-[#128C7E]/10 flex items-center justify-center shrink-0">
                  <span className="text-xl">🛍️</span>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#111B21]">Product Card</p>
                  <p className="text-[12px] text-[#667781]">Tap to view</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                <span className="text-[11px] text-[#667781]">{formatMessageTime(message.createdAt)}</span>
                {isOwn && renderStatusIcon()}
              </div>
            </div>
          )}

          {/* ── SHARED CART ── */}
          {message.type === 'SHARED_CART' && (
            <div 
              className="px-2.5 py-2 cursor-pointer"
              onClick={() => {
                if (message.metadata?.sharedCartId) {
                  navigate(`/shared-cart/${message.metadata.sharedCartId}`)
                }
              }}
            >
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#128C7E]">
                <span className="text-xl">🛒</span>
                <div>
                  <p className="text-[13px] font-semibold text-white">Shared Cart</p>
                  <p className="text-[12px] text-white/70">Tap to view items</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                <span className="text-[11px] text-[#667781]">{formatMessageTime(message.createdAt)}</span>
                {isOwn && renderStatusIcon()}
              </div>
            </div>
          )}

          {/* ── ORDER UPDATE ── */}
          {message.type === 'ORDER_UPDATE' && (
            <div 
              className="px-2.5 py-2 cursor-pointer"
              onClick={() => {
                if (message.metadata?.orderId) {
                  navigate(`/orders/${message.metadata.orderId}`)
                }
              }}
            >
              <div className={`p-2.5 rounded-lg border-l-[3px] border-[#128C7E] ${isOwn ? 'bg-[#C8F0C0]' : 'bg-[#F0F2F5]'}`}>
                <p className="text-[13px] font-semibold text-[#111B21]">📦 Order Update</p>
                <p className="text-[12px] text-[#667781] mt-0.5">Tap to view details</p>
              </div>
              <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                <span className="text-[11px] text-[#667781]">{formatMessageTime(message.createdAt)}</span>
                {isOwn && renderStatusIcon()}
              </div>
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`flex flex-wrap gap-1 px-2 pb-1 ${isOwn ? 'justify-end' : ''}`}>
              {Object.entries(
                message.reactions.reduce<Record<string, number>>((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1
                  return acc
                }, {})
              ).map(([emoji, count]) => (
                <span key={emoji} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[12px] bg-white shadow-sm border border-gray-100">
                  {emoji} {count > 1 && <span className="text-[10px] text-[#667781]">{count}</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
