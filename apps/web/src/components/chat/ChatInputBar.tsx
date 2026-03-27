import { useState, useRef, useEffect, useCallback } from 'react'

interface ChatInputBarProps {
  onSend: (content: string) => void
  onTypingStart?: () => void
  onTypingStop?: () => void
  replyTo?: { senderName: string; content: string } | null
  onCancelReply?: () => void
  disabled?: boolean
}

export default function ChatInputBar({
  onSend,
  onTypingStart,
  onTypingStop,
  replyTo,
  onCancelReply,
  disabled,
}: ChatInputBarProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const isTypingRef = useRef(false)

  // Auto-resize textarea (1-6 lines)
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 144)}px` // 6 lines ≈ 144px
  }, [text])

  // Typing events
  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true
      onTypingStart?.()
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      onTypingStop?.()
    }, 2000)
  }, [onTypingStart, onTypingStop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (isTypingRef.current) onTypingStop?.()
    }
  }, [onTypingStop])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    if (isTypingRef.current) {
      isTypingRef.current = false
      onTypingStop?.()
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    // Refocus
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Desktop: Enter to send (Shift+Enter for newline)
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
      e.preventDefault()
      handleSend()
    }
  }

  const hasText = text.trim().length > 0

  return (
    <div className="px-3 pb-3 pt-1 safe-area-bottom" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
      {/* Reply context bar */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 mb-2 rounded-xl animate-fade-up"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)' }}>
          <div className="flex-1 min-w-0 border-l-2 pl-2" style={{ borderLeftColor: 'var(--color-primary)' }}>
            <p className="text-[10px] font-semibold" style={{ color: 'var(--color-primary)' }}>{replyTo.senderName}</p>
            <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{replyTo.content}</p>
          </div>
          <button onClick={onCancelReply} className="w-6 h-6 rounded-full flex items-center justify-center touch-target"
            style={{ color: 'var(--color-text-muted)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Input pill */}
      <div className="flex items-end gap-2 rounded-3xl px-3 py-2 transition-all"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(12px)',
        }}>
        {/* Smiley icon */}
        <button className="w-9 h-9 shrink-0 flex items-center justify-center touch-target"
          style={{ color: 'var(--color-text-muted)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" stroke="currentColor" />
            <path d="M8 14S9.5 16 12 16S16 14 16 14" stroke="currentColor" strokeLinecap="round" />
            <circle cx="9" cy="9.5" r="1" fill="currentColor" />
            <circle cx="15" cy="9.5" r="1" fill="currentColor" />
          </svg>
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => {
            setText(e.target.value)
            handleTyping()
          }}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent outline-none resize-none text-sm leading-snug py-2"
          style={{
            color: 'var(--color-text-primary)',
            caretColor: 'var(--color-primary)',
            maxHeight: '144px',
          }}
        />

        {/* Attachment button (when empty) */}
        {!hasText && (
          <button className="w-9 h-9 shrink-0 flex items-center justify-center touch-target"
            style={{ color: 'var(--color-text-muted)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
              <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 21.9983 8.005 21.9983C6.41277 21.9983 4.88583 21.3658 3.76 20.24C2.63417 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63417 12.8758 3.76 11.75L12.95 2.56C13.7006 1.80944 14.7185 1.38778 15.78 1.38778C16.8415 1.38778 17.8594 1.80944 18.61 2.56C19.3606 3.31056 19.7822 4.32854 19.7822 5.39C19.7822 6.45146 19.3606 7.46944 18.61 8.22L9.41 17.41C9.03472 17.7853 8.52573 17.9961 7.995 17.9961C7.46427 17.9961 6.95528 17.7853 6.58 17.41C6.20472 17.0347 5.99389 16.5257 5.99389 15.995C5.99389 15.4643 6.20472 14.9553 6.58 14.58L15.07 6.1"
                stroke="currentColor" strokeLinecap="round" />
            </svg>
          </button>
        )}

        {/* Send button (when typing) */}
        {hasText && (
          <button
            onClick={handleSend}
            disabled={disabled}
            className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all animate-scale-in touch-target"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))',
              boxShadow: '0 2px 8px rgba(91, 63, 217, 0.3)',
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.15)" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
