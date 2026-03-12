import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { X, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onClose: () => void;
}

export default function AddContactModal({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const addMutation = useMutation({
    mutationFn: async () => {
      // 1. Search user by EXACT phone number
      const { data: users } = await api.get(`/users/search?q=${encodeURIComponent(phone)}`);
      // Since phone numbers might have spaces or exact formatting issues, let's normalize them before comparison
      const normalize = (str?: string) => str ? str.replace(/\s+/g, '') : '';
      const user = users.find((u: any) => normalize(u.phone) === normalize(phone));
      if (!user) {
        throw new Error('User with this phone number not found');
      }
      // 2. Add to contacts
      return api.post('/users/contacts', { contactId: user.id, nickname });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to add contact');
    }
  });

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        className="glass-panel rounded-2xl p-5 w-full max-w-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Add Contact</h3>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-xl mb-4 bg-red-500/10 text-red-500 text-xs border border-red-500/20">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Phone Number
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              <input
                autoFocus
                placeholder="+1234567890"
                value={phone}
                onChange={e => { setPhone(e.target.value); setError(''); }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
              />
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Must be exact phone number (e.g. +1234567890)
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Nickname (Optional)
            </label>
            <input
              placeholder="e.g. John Doe"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>

          <button
            onClick={() => addMutation.mutate()}
            disabled={phone.length < 5 || addMutation.isPending}
            className="w-full py-2.5 flex items-center justify-center rounded-xl text-white text-sm font-semibold transition-opacity mt-2"
            style={{ 
              background: 'var(--accent-gradient)',
              opacity: (phone.length < 5 || addMutation.isPending) ? 0.6 : 1
            }}
          >
            {addMutation.isPending ? 'Adding...' : 'Add Contact'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
