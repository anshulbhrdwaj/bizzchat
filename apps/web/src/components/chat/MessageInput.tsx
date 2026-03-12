import { useState, useRef, useCallback, useEffect } from 'react';
import { Smile, Paperclip, Send, Mic, X, Image, FileText, Reply } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { getSocket } from '../../lib/socket';
import { api } from '../../lib/api';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '../../types';
import { useQueryClient } from '@tanstack/react-query';
import { hashStringToColor } from '../../lib/utils';

interface Props {
  chatId: string;
  onSend: (content: string, replyToId?: string) => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
}

export default function MessageInput({ chatId, onSend, replyTo, onCancelReply }: Props) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { draftMessages, setDraft } = useChatStore();
  const { theme } = useUIStore();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  // Restore draft
  useEffect(() => {
    const draft = draftMessages[chatId] || '';
    setText(draft);
  }, [chatId]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    setDraft(chatId, val);

    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    }

    const socket = getSocket();
    socket.emit('typing_start', chatId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket.emit('typing_stop', chatId), 2500);
  }, [chatId, setDraft]);

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    onSend(text.trim(), replyTo?.id);
    setText('');
    setDraft(chatId, '');
    onCancelReply?.();
    const socket = getSocket();
    socket.emit('typing_stop', chatId);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [text, onSend, chatId, setDraft, replyTo, onCancelReply]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmoji = (data: EmojiClickData) => {
    setText(prev => prev + data.emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      await api.post(`/media/upload?chatId=${chatId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
      setShowAttach(false);
    }
  };

  const replyColor = replyTo ? hashStringToColor(replyTo.sender?.name || 'U') : 'var(--accent-primary)';

  return (
    <div
      className="relative border-t"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--glass-border)',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
      }}
    >
      {/* Reply preview strip */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center gap-3 px-4 py-2.5 border-b"
              style={{ borderColor: 'var(--glass-border)', borderLeft: `3px solid ${replyColor}` }}
            >
              <Reply className="w-4 h-4 flex-shrink-0" style={{ color: replyColor }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: replyColor }}>
                  {replyTo.sender?.name}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  {replyTo.content || '📎 Media'}
                </p>
              </div>
              <button
                onClick={onCancelReply}
                className="flex-shrink-0 p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pt-3">
        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-4 mb-2 z-50"
            >
              <EmojiPicker
                onEmojiClick={handleEmoji}
                theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                height={360}
                width={320}
                searchPlaceholder="Search emoji..."
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachment menu */}
        <AnimatePresence>
          {showAttach && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: 16 }}
              className="absolute bottom-full left-4 mb-2 z-50 p-3 flex gap-3"
            >
              <button
                onClick={() => imageRef.current?.click()}
                className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(62,155,247,0.2)' }}>
                  <Image className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Photo</span>
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(79,202,110,0.2)' }}>
                  <FileText className="w-5 h-5" style={{ color: 'var(--accent-success)' }} />
                </div>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>File</span>
              </button>
              <button onClick={() => setShowAttach(false)} className="absolute top-1 right-1" style={{ color: 'var(--text-tertiary)' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file inputs */}
        <input
          ref={imageRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />

        {/* Input row */}
        <div className="flex items-end gap-2">
          <button
            onClick={() => { setShowEmoji(!showEmoji); setShowAttach(false); }}
            className="flex-shrink-0 p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            onClick={() => { setShowAttach(!showAttach); setShowEmoji(false); }}
            className="flex-shrink-0 p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isUploading ? 'Uploading...' : 'Message...'}
            disabled={isUploading}
            className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm outline-none transition-all"
            style={{
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              lineHeight: '1.5',
              maxHeight: '200px',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--glass-border)')}
          />

          <AnimatePresence mode="wait">
            {text.trim() ? (
              <motion.button
                key="send"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
                onClick={handleSend}
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg"
                style={{ background: 'var(--accent-gradient)' }}
              >
                <Send className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                key="mic"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Mic className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
