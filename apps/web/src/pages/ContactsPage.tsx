import { Users, Search, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getAvatarInitials, hashStringToColor } from '../lib/utils';
import type { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import AddContactModal from '../components/chat/AddContactModal';
import UserProfileModal from '../components/chat/UserProfileModal';

export default function ContactsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data } = await api.get('/users/contacts/list');
      return data as User[];
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.username?.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  }, [contacts, search]);

  const startChat = async (userId: string) => {
    const { data } = await api.post('/chats/direct', { userId });
    navigate(`/chat/${data.id}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div 
        className="px-4 pb-2 border-b" 
        style={{ 
          borderColor: 'var(--glass-border)',
          paddingTop: 'calc(16px + env(safe-area-inset-top))' 
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>Contacts</h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors" 
            style={{ color: 'var(--accent-primary)' }}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32" style={{ color: 'var(--text-tertiary)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Search className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No contacts found</p>
          </div>
        ) : filtered.map(contact => (
          <div
            key={contact.id}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left"
          >
            <div 
              onClick={(e) => { e.stopPropagation(); setSelectedUserId(contact.id); }}
              className="relative flex-shrink-0 cursor-pointer hover:opacity-90"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-semibold overflow-hidden"
                style={{ background: contact.avatarUrl ? 'transparent' : hashStringToColor(contact.name) }}
              >
                {contact.avatarUrl ? <img src={contact.avatarUrl} className="w-full h-full object-cover" /> : getAvatarInitials(contact.name)}
              </div>
              {contact.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 z-10"
                  style={{ background: 'var(--accent-success)', borderColor: 'var(--bg-primary)' }} />
              )}
            </div>
            <button onClick={() => startChat(contact.id)} className="flex-1 min-w-0 text-left py-2">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{contact.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                {contact.username ? `@${contact.username}` : contact.about || contact.phone}
              </p>
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedUserId && (
          <UserProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && <AddContactModal onClose={() => setShowAddModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
