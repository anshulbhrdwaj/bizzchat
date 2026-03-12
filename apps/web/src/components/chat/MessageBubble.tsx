import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, Reply, Copy, Trash2, Star, Pin, MoreHorizontal } from 'lucide-react';
import type { Message } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { formatMessageTime, hashStringToColor, getAvatarInitials } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { useState, useRef } from 'react';
import { getSocket } from '../../lib/socket';
import ReactionPicker from './ReactionPicker';
import MediaViewer from './MediaViewer';
import { api } from '../../lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  message: Message;
  isOwn: boolean;
  prevMessage?: Message;
  showSenderName?: boolean;
  onReply?: (message: Message) => void;
}

const CONTEXT_ACTIONS = [
  { icon: Reply, label: 'Reply', action: 'reply' },
  { icon: Copy, label: 'Copy', action: 'copy' },
  { icon: Star, label: 'Star', action: 'star' },
  { icon: Pin, label: 'Pin', action: 'pin' },
  { icon: Trash2, label: 'Delete', action: 'delete', danger: true },
];

export default function MessageBubble({ message, isOwn, prevMessage, showSenderName, onReply }: Props) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const prevSame =
    prevMessage?.senderId === message.senderId &&
    new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 5 * 60 * 1000;

  const senderColor = hashStringToColor(message.sender?.name || 'U');

  // Long press for mobile context menu
  const handleTouchStart = () => {
    longPressRef.current = setTimeout(() => {
      setShowContextMenu(true);
    }, 500);
  };
  const handleTouchEnd = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  };

  // Double-tap for reaction picker
  let lastTap = 0;
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < 350) {
      setShowReactions(true);
      return;
    }
    lastTap = now;
  };

  const handleContextAction = async (action: string) => {
    setShowContextMenu(false);
    switch (action) {
      case 'reply':
        onReply?.(message);
        break;
      case 'copy':
        if (message.content) navigator.clipboard.writeText(message.content);
        break;
      case 'delete':
        await api.delete(`/messages/${message.id}`).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ['messages', message.chatId] });
        break;
      default:
        break;
    }
  };

  if (message.isDeleted) {
    return (
      <div className={cn('flex mb-0.5', isOwn ? 'justify-end' : 'justify-start')}>
        <div className="px-3 py-2 rounded-2xl max-w-xs" style={{ background: 'var(--bg-tertiary)' }}>
          <span className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>
            🚫 Message deleted
          </span>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    const statuses = message.statuses || [];
    const allRead = statuses.length > 0 && statuses.every(s => s.status === 'READ');
    const allDelivered = statuses.length > 0 && statuses.every(s => s.status === 'DELIVERED' || s.status === 'READ');
    if (allRead) return <CheckCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />;
    if (allDelivered) return <CheckCheck className="w-3.5 h-3.5" style={{ color: 'var(--text-timestamp)' }} />;
    return <Check className="w-3.5 h-3.5" style={{ color: 'var(--text-timestamp)' }} />;
  };

  const br = isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px';

  // Build media items for viewer
  const mediaItems = message.mediaUrl ? [{
    url: message.mediaUrl,
    type: (['IMAGE'].includes(message.type) ? 'image'
      : ['VIDEO', 'VIDEO_NOTE'].includes(message.type) ? 'video'
      : ['AUDIO', 'VOICE'].includes(message.type) ? 'audio'
      : 'document') as 'image' | 'video' | 'audio' | 'document',
    fileName: message.fileName,
  }] : [];

  return (
    <>
      {/* Context Menu Overlay */}
      <AnimatePresence>
        {showContextMenu && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              onClick={() => setShowContextMenu(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ background: 'rgba(0,0,0,0.4)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
              className="fixed z-50 rounded-2xl overflow-hidden shadow-2xl min-w-[160px]"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                top: '50%',
                left: isOwn ? undefined : '50%',
                right: isOwn ? '1rem' : undefined,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {CONTEXT_ACTIONS.map(({ icon: Icon, label, action, danger }) => (
                <button
                  key={action}
                  onClick={() => handleContextAction(action)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left"
                  style={{ color: danger ? 'var(--accent-danger)' : 'var(--text-primary)' }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Media Viewer */}
      <AnimatePresence>
        {mediaViewerOpen && mediaItems.length > 0 && (
          <MediaViewer items={mediaItems} onClose={() => setMediaViewerOpen(false)} />
        )}
      </AnimatePresence>

      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        className={cn('flex mb-0.5 group relative', isOwn ? 'justify-end' : 'justify-start')}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
        onContextMenu={e => { e.preventDefault(); setShowContextMenu(true); }}
      >
        <div className={cn('max-w-[85%] sm:max-w-[65%] flex flex-col', isOwn ? 'items-end' : 'items-start')}>
          {!prevSame && showSenderName && !isOwn && (
            <span className="text-xs font-medium mb-1 px-2" style={{ color: senderColor }}>
              {message.sender?.name}
            </span>
          )}

          {/* Reply-to preview */}
          {message.replyTo && (
            <div
              className="mb-1 px-3 py-1.5 rounded-xl text-xs border-l-2 overflow-hidden"
              style={{
                background: isOwn ? 'rgba(0,0,0,0.15)' : 'var(--bg-tertiary)',
                borderLeftColor: senderColor,
                maxWidth: '100%',
              }}
            >
              <p className="font-semibold truncate" style={{ color: senderColor }}>
                {(message.replyTo as any).sender?.name}
              </p>
              <p className="truncate" style={{ color: 'var(--text-secondary)' }}>
                {(message.replyTo as any).content || '📎 Media'}
              </p>
            </div>
          )}

          {/* Bubble */}
          <div
            className="relative"
            style={{
              background: isOwn ? 'var(--bg-message-out)' : 'var(--bg-message-in)',
              borderRadius: br,
              padding: '8px 12px',
            }}
          >
            {/* Image */}
            {message.type === 'IMAGE' && message.mediaUrl && (
              <img
                src={message.mediaUrl}
                alt="Image"
                className="max-w-full rounded-xl mb-1.5 max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={e => { e.stopPropagation(); setMediaViewerOpen(true); }}
              />
            )}

            {/* Video */}
            {(message.type === 'VIDEO' || message.type === 'VIDEO_NOTE') && message.mediaUrl && (
              <div
                className="relative mb-1.5 cursor-pointer rounded-xl overflow-hidden"
                onClick={e => { e.stopPropagation(); setMediaViewerOpen(true); }}
              >
                <video src={message.mediaUrl} className="max-w-full max-h-48 rounded-xl object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                    <span className="text-white text-2xl">▶</span>
                  </div>
                </div>
              </div>
            )}

            {/* Voice / Audio */}
            {(message.type === 'VOICE' || message.type === 'AUDIO') && message.mediaUrl && (
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={e => { e.stopPropagation(); setMediaViewerOpen(true); }}
              >
                <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <span className="text-white text-sm">▶</span>
                </button>
                <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }}>
                  <div className="h-full w-0 rounded-full" style={{ background: 'var(--accent-primary)' }} />
                </div>
                {message.mediaDuration && (
                  <span className="text-xs" style={{ color: 'var(--text-timestamp)' }}>
                    {Math.floor(message.mediaDuration / 60)}:{String(message.mediaDuration % 60).padStart(2, '0')}
                  </span>
                )}
              </div>
            )}

            {/* Document */}
            {message.type === 'DOCUMENT' && message.mediaUrl && (
              <a
                href={message.mediaUrl}
                download={message.fileName}
                className="flex items-center gap-2 mb-1.5"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.1)' }}>
                  📄
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {message.fileName || 'Document'}
                  </p>
                  {message.mediaSize && (
                    <p className="text-[11px]" style={{ color: 'var(--text-timestamp)' }}>
                      {(message.mediaSize / 1024).toFixed(0)} KB
                    </p>
                  )}
                </div>
              </a>
            )}

            {/* Text content */}
            {message.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--text-primary)' }}>
                {message.content}
              </p>
            )}

            {/* Footer */}
            <div className={cn('flex items-center gap-1 mt-0.5', isOwn ? 'justify-end' : 'justify-start')}>
              {message.isEdited && (
                <span className="text-[10px]" style={{ color: 'var(--text-timestamp)' }}>edited</span>
              )}
              <span className="text-[11px]" style={{ color: 'var(--text-timestamp)' }}>
                {formatMessageTime(message.createdAt)}
              </span>
              {isOwn && (
                <motion.span
                  key={message.statuses?.[0]?.status}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ ease: [0.34, 1.56, 0.64, 1] }}
                >
                  {getStatusIcon()}
                </motion.span>
              )}
            </div>
          </div>

          {/* Reactions bar */}
          {message.reactions && message.reactions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex gap-1 mt-0.5 flex-wrap"
            >
              {Object.entries(
                message.reactions.reduce((acc: Record<string, { count: number; mine: boolean }>, r) => {
                  if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false };
                  acc[r.emoji].count += 1;
                  if (r.userId === user?.id) acc[r.emoji].mine = true;
                  return acc;
                }, {})
              ).map(([emoji, { count, mine }]) => (
                <motion.button
                  key={emoji}
                  whileTap={{ scale: 0.85 }}
                  onClick={e => {
                    e.stopPropagation();
                    getSocket().emit('add_reaction', { messageId: message.id, emoji, chatId: message.chatId });
                  }}
                  className="px-1.5 py-0.5 rounded-full text-xs flex items-center gap-0.5 transition-all"
                  style={{
                    background: mine ? 'rgba(62,155,247,0.2)' : 'var(--bg-tertiary)',
                    border: mine ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                  }}
                >
                  <span>{emoji}</span>
                  {count > 1 && <span style={{ color: 'var(--text-secondary)' }}>{count}</span>}
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Hover actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.1 }}
              className={cn('flex items-end gap-0.5 mb-1 self-end', isOwn ? 'order-first mr-1' : 'ml-1')}
            >
              {/* Quick reaction */}
              <div className="relative">
                <button
                  onClick={e => { e.stopPropagation(); setShowReactions(v => !v); }}
                  className="p-1.5 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  title="React"
                >
                  😊
                </button>
                <AnimatePresence>
                  {showReactions && (
                    <div
                      className="absolute bottom-full mb-1"
                      style={{ [isOwn ? 'right' : 'left']: 0 }}
                    >
                      <ReactionPicker
                        messageId={message.id}
                        chatId={message.chatId}
                        isOwn={isOwn}
                        onClose={() => setShowReactions(false)}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reply */}
              <button
                onClick={e => { e.stopPropagation(); onReply?.(message); }}
                className="p-1.5 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                title="Reply"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>

              {/* More */}
              <button
                onClick={e => { e.stopPropagation(); setShowContextMenu(true); }}
                className="p-1.5 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                title="More"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
