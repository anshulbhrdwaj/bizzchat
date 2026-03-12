import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { getAvatarInitials, hashStringToColor, formatChatTimestamp } from '../../lib/utils';
import { cn } from '../../lib/utils';
import type { Chat } from '../../types';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NewChatModal from './NewChatModal';

export default function ChatListSidebar() {
  const navigate = useNavigate();
  const { chats, activeChatId, setActiveChat, typingUsers } = useChatStore();
  const { user } = useAuthStore();
  const { searchQuery, setSearchQuery } = useUIStore();
  const [showNewChat, setShowNewChat] = useState(false);

  const filtered = useMemo(() => {
    if (!searchQuery) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(c => {
      const name = c.type === 'GROUP' ? c.group?.name : c.otherUser?.name;
      return name?.toLowerCase().includes(q);
    });
  }, [chats, searchQuery]);

  const handleChatClick = (chat: Chat) => {
    setActiveChat(chat.id);
    navigate(`/chat/${chat.id}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div 
        className="px-4 pb-2"
        style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>Chats</h2>
          <div className="flex gap-1">
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowNewChat(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
              style={{ color: 'var(--accent-primary)' }}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none border-0"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {searchQuery ? 'No chats found' : 'No chats yet. Start a new one!'}
              </p>
            </div>
          ) : (
            filtered.map((chat, i) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                currentUserId={user?.id || ''}
                isTyping={(typingUsers[chat.id] || []).length > 0}
                onClick={() => handleChatClick(chat)}
                index={i}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </div>
  );
}

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  currentUserId: string;
  isTyping: boolean;
  onClick: () => void;
  index: number;
}

function ChatListItem({ chat, isActive, currentUserId, isTyping, onClick, index }: ChatListItemProps) {
  const displayName = chat.type === 'GROUP' ? chat.group?.name : chat.otherUser?.name;
  const avatarUrl = chat.type === 'GROUP' ? chat.group?.avatarUrl : chat.otherUser?.avatarUrl;
  const isOnline = chat.type === 'DIRECT' && chat.otherUser?.isOnline;
  const initials = getAvatarInitials(displayName || '?');
  const color = hashStringToColor(displayName || '');
  const lastMsg = chat.lastMessage;
  const unread = chat.unreadCount;
  const timestamp = chat.updatedAt ? formatChatTimestamp(chat.updatedAt) : '';

  const lastMsgPreview = isTyping
    ? '✍️ typing...'
    : lastMsg?.isDeleted
    ? '🚫 Message deleted'
    : lastMsg?.type !== 'TEXT' && lastMsg?.type
    ? `📎 ${lastMsg.type.charAt(0) + lastMsg.type.slice(1).toLowerCase()}`
    : lastMsg?.content || '';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
        isActive ? 'bg-[var(--bg-selected)]' : 'hover:bg-[var(--bg-hover)]'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className="w-13 h-13 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-semibold"
          style={{
            width: 52, height: 52,
            background: avatarUrl ? 'transparent' : color,
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        {isOnline && (
          <div
            className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2"
            style={{ background: 'var(--accent-success)', borderColor: 'var(--bg-secondary)' }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {displayName}
          </span>
          <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--text-timestamp)' }}>
            {timestamp}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span
            className="text-xs truncate"
            style={{
              color: isTyping ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontStyle: isTyping ? 'italic' : 'normal',
            }}
          >
            {lastMsg?.senderId === currentUserId && !isTyping && '✓ '}
            {lastMsgPreview}
          </span>
          {unread > 0 && (
            <div
              className="ml-2 flex-shrink-0 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs font-semibold px-1.5 text-white"
              style={{ background: 'var(--accent-primary)' }}
            >
              {unread > 99 ? '99+' : unread}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
