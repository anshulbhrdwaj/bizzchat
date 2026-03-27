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
    replyTo?: { content?: string; sender?: { name: string } } | null
    reactions?: { emoji: string; userId: string }[]
  }
  isOwn: boolean
  senderName?: string
}

export default function MessageBubble({ message, isOwn, senderName }: MessageBubbleProps) {
  const displayName = !isOwn && senderName ? senderName : null

  // Deleted message
  if (message.isDeleted) {
    return (
      <div className={`flex px-4 py-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="px-4 py-2.5 rounded-2xl max-w-[80%] md:max-w-[65%] animate-scale-in"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--glass-border)',
          }}>
          <p className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
            🚫 This message was deleted
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex px-4 py-0.5 ${isOwn ? 'justify-end' : 'justify-start'} animate-scale-in`}
      style={{ animationDuration: '150ms' }}>
      <div
        className={`relative px-3.5 py-2 max-w-[80%] md:max-w-[65%] ${
          isOwn
            ? 'rounded-2xl rounded-br-md'
            : 'rounded-2xl rounded-bl-md'
        }`}
        style={{
          background: isOwn
            ? 'var(--bubble-outgoing-bg, rgba(91, 63, 217, 0.15))'
            : 'var(--glass-bg)',
          border: `1px solid ${isOwn ? 'rgba(91, 63, 217, 0.2)' : 'var(--glass-border)'}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Sender name for incoming messages */}
        {displayName && (
          <p className="text-[10px] font-semibold mb-0.5" style={{ color: 'var(--color-primary)' }}>
            {displayName}
          </p>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className="mb-1.5 px-2.5 py-1.5 rounded-lg text-xs border-l-2"
            style={{
              background: isOwn ? 'rgba(255,255,255,0.1)' : 'var(--color-surface)',
              borderLeftColor: 'var(--color-primary)',
            }}>
            <p className="font-semibold text-[10px] mb-0.5" style={{ color: 'var(--color-primary)' }}>
              {message.replyTo.sender?.name || 'Unknown'}
            </p>
            <p className="truncate" style={{ color: 'var(--color-text-muted)' }}>
              {message.replyTo.content || 'Message'}
            </p>
          </div>
        )}

        {/* Content */}
        {message.type === 'TEXT' && (
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap"
            style={{ color: 'var(--color-text-primary)' }}>
            {message.content}
          </p>
        )}

        {message.type === 'IMAGE' && (
          <div className="rounded-lg overflow-hidden mb-1">
            <img src={message.content || ''} alt="Shared image" className="max-w-full rounded-lg" />
          </div>
        )}

        {/* Product card placeholder */}
        {message.type === 'PRODUCT_CARD' && (
          <div className="glass-card p-3 rounded-xl mb-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
                <span className="text-lg">🛍️</span>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Product Card</p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Tap to view</p>
              </div>
            </div>
          </div>
        )}

        {/* Shared cart placeholder */}
        {message.type === 'SHARED_CART' && (
          <div className="rounded-xl overflow-hidden mb-1"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))' }}>
            <div className="p-3 flex items-center gap-2">
              <span className="text-lg">🛒</span>
              <div>
                <p className="text-xs font-semibold text-white">Shared Cart</p>
                <p className="text-[10px] text-white/70">Tap to view items</p>
              </div>
            </div>
          </div>
        )}

        {/* Order update placeholder */}
        {message.type === 'ORDER_UPDATE' && (
          <div className="glass-card p-3 rounded-xl mb-1" style={{ borderLeft: '3px solid var(--color-primary)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>📦 Order Update</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Tap to view details</p>
          </div>
        )}

        {/* Timestamp + read receipts */}
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : ''}`}>
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            {formatMessageTime(message.createdAt)}
          </span>
          {isOwn && (
            <span className="text-[10px]" style={{
              color: message.readAt
                ? 'var(--color-teal, #0d9488)'
                : 'var(--color-text-muted)',
            }}>
              {message.readAt ? '✓✓' : message.deliveredAt ? '✓✓' : '✓'}
            </span>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
            {Object.entries(
              message.reactions.reduce<Record<string, number>>((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1
                return acc
              }, {})
            ).map(([emoji, count]) => (
              <span key={emoji} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)' }}>
                {emoji} {count > 1 && <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{count}</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
