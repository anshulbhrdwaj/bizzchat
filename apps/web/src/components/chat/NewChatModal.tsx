import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useChatStore } from '../../stores/chatStore';
import { getAvatarInitials, hashStringToColor } from '../../lib/utils';
import type { User, Chat } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import UserProfileModal from './UserProfileModal';

interface Props { onClose: () => void; }

export default function NewChatModal({ onClose }: Props) {
  const navigate = useNavigate();
  const { addOrUpdateChat, setActiveChat } = useChatStore();
  const [query, setQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: users = [], isFetching } = useQuery({
    queryKey: ['user-search', query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      return data as User[];
    },
    enabled: query.length >= 2,
  });

  const startChat = useCallback(async (user: User) => {
    const { data } = await api.post('/chats/direct', { userId: user.id });
    addOrUpdateChat(data as Chat);
    setActiveChat(data.id);
    navigate(`/chat/${data.id}`);
    onClose();
  }, [navigate, onClose, addOrUpdateChat, setActiveChat]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        className="glass-panel rounded-2xl p-5 w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>New Chat</h3>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input
            autoFocus
            type="text"
            placeholder="Search by name, username, or phone..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />
        </div>

        <div className="space-y-1 max-h-72 overflow-y-auto">
          {query.length < 2 ? (
            <p className="text-xs text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
              Type at least 2 characters to search
            </p>
          ) : isFetching ? (
            <p className="text-xs text-center py-4" style={{ color: 'var(--text-tertiary)' }}>Searching...</p>
          ) : users.length === 0 ? (
            <p className="text-xs text-center py-4 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              No users found.<br/>
              <span style={{ color: 'var(--accent-primary)', opacity: 0.8 }}>
                Hint: Open an Incognito window to sign up as a second user!
              </span>
            </p>
          ) : (
            users.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors text-left"
              >
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold overflow-hidden"
                  style={{ background: u.avatarUrl ? 'transparent' : hashStringToColor(u.name) }}
                >
                  {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : getAvatarInitials(u.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    {u.username ? `@${u.username}` : u.phone}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>
      
      <AnimatePresence>
        {selectedUserId && (
          <UserProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
