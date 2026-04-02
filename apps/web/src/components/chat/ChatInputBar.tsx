import { useState, useRef, useEffect, useCallback } from 'react'
import EmojiPicker from './EmojiPicker'
import AttachmentMenu from './AttachmentMenu'

interface ChatInputBarProps {
  onSend: (content: string, type?: string) => void
  onSendFile?: (file: File, type: 'image' | 'document') => void
  onTypingStart?: () => void
  onTypingStop?: () => void
  replyTo?: { senderName: string; content: string } | null
  onCancelReply?: () => void
  disabled?: boolean
}

export default function ChatInputBar({
  onSend,
  onSendFile,
  onTypingStart,
  onTypingStop,
  replyTo,
  onCancelReply,
  disabled,
}: ChatInputBarProps) {
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showAttachment, setShowAttachment] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const isTypingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [text])

  // Focus textarea when reply is set
  useEffect(() => {
    if (replyTo) textareaRef.current?.focus()
  }, [replyTo])

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

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (isTypingRef.current) onTypingStop?.()
    }
  }, [onTypingStop])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed, 'TEXT')
    setText('')
    setShowEmoji(false)
    if (isTypingRef.current) {
      isTypingRef.current = false
      onTypingStop?.()
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    const el = textareaRef.current
    if (el) {
      const start = el.selectionStart ?? text.length
      const end = el.selectionEnd ?? text.length
      const newText = text.slice(0, start) + emoji + text.slice(end)
      setText(newText)
      // Restore cursor after emoji
      setTimeout(() => {
        el.setSelectionRange(start + emoji.length, start + emoji.length)
        el.focus()
      }, 0)
    } else {
      setText(prev => prev + emoji)
    }
  }

  const hasText = text.trim().length > 0

  return (
    <div
      ref={containerRef}
      className="relative shrink-0"
      style={{ background: '#F0F2F5', paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}
    >
      {/* Reply Bar */}
      {replyTo && (
        <div className="flex items-center gap-2 mx-2 mt-1.5 px-3 py-2 bg-white rounded-xl border-l-4 border-[#128C7E] shadow-sm">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[#128C7E]">{replyTo.senderName}</p>
            <p className="text-[13px] text-gray-500 truncate">{replyTo.content}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="w-7 h-7 flex items-center justify-center text-gray-400 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Main Input Row */}
      <div className="flex items-end gap-2 px-2 py-1.5">
        {/* Input Pill */}
        <div className="relative flex-1 flex items-end bg-white rounded-[26px] shadow-sm">
          {/* Emoji Button */}
          <button
            onClick={() => { setShowEmoji(s => !s); setShowAttachment(false) }}
            className="w-10 h-[48px] shrink-0 flex items-center justify-center text-[#8696A0] transition-colors hover:text-[#128C7E]"
          >
            {showEmoji ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" stroke="currentColor" />
                <path d="M8 14S9.5 16 12 16S16 14 16 14" stroke="currentColor" strokeLinecap="round" />
                <circle cx="9" cy="9.5" r="1" fill="currentColor" />
                <circle cx="15" cy="9.5" r="1" fill="currentColor" />
              </svg>
            )}
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => { setText(e.target.value); handleTyping() }}
            onKeyDown={handleKeyDown}
            onFocus={() => { setShowEmoji(false); setShowAttachment(false) }}
            placeholder="Message"
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-[16px] leading-[22px] text-[#111B21] placeholder:text-[#8696A0] py-[13px] min-h-[48px]"
            style={{ maxHeight: '128px' }}
          />

          {/* Attachment Button (hidden when text) */}
          {/* {!hasText && (
            <button
              onClick={() => { setShowAttachment(s => !s); setShowEmoji(false) }}
              className="w-10 h-[48px] shrink-0 flex items-center justify-center text-[#8696A0] transition-colors hover:text-[#128C7E]"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
                <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 21.9983 8.005 21.9983C6.41277 21.9983 4.88583 21.3658 3.76 20.24C2.63417 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63417 12.8758 3.76 11.75L12.95 2.56C13.7006 1.80944 14.7185 1.38778 15.78 1.38778C16.8415 1.38778 17.8594 1.80944 18.61 2.56C19.3606 3.31056 19.7822 4.32854 19.7822 5.39C19.7822 6.45146 19.3606 7.46944 18.61 8.22L9.41 17.41C9.03472 17.7853 8.52573 17.9961 7.995 17.9961C7.46427 17.9961 6.95528 17.7853 6.58 17.41C6.20472 17.0347 5.99389 16.5257 5.99389 15.995C5.99389 15.4643 6.20472 14.9553 6.58 14.58L15.07 6.1" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </button>
          )} */}

          {/* Emoji Picker Portal */}
          {showEmoji && (
            <EmojiPicker
              onSelect={handleEmojiSelect}
              onClose={() => setShowEmoji(false)}
            />
          )}

          {/* Attachment Menu Portal */}
          {/* {showAttachment && (
            <AttachmentMenu
              onClose={() => setShowAttachment(false)}
              onImageSelect={(file) => onSendFile?.(file, 'image')}
              onDocumentSelect={(file) => onSendFile?.(file, 'document')}
            />
          )} */}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || !hasText}
          className={`w-[50px] h-[50px] shrink-0 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 ${
            hasText && !disabled ? 'bg-[#128C7E]' : 'bg-gray-300'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
