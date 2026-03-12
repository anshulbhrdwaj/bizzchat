import { Phone, Video, PhoneIncoming, PhoneMissed, PhoneOutgoing, PhoneOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useCallStore } from '../stores/callStore';
import { getAvatarInitials, hashStringToColor } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface CallEntry {
  id: string;
  type: 'VOICE' | 'VIDEO' | 'GROUP_VOICE' | 'GROUP_VIDEO';
  status: 'RINGING' | 'ONGOING' | 'ENDED' | 'MISSED' | 'DECLINED';
  startedAt: string;
  endedAt?: string;
  duration?: number;
  isOutgoing: boolean;
  participants: { userId: string; user: { id: string; name: string; avatarUrl?: string } }[];
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function CallsPage() {
  const { user } = useAuthStore();
  const { initiateCall } = useCallStore();

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ['calls-history'],
    queryFn: async () => {
      const { data } = await api.get('/calls/history');
      return data as CallEntry[];
    },
  });

  const getOtherUser = (call: CallEntry) =>
    call.participants.find(p => p.userId !== user?.id)?.user;

  const getCallIcon = (call: CallEntry) => {
    if (call.status === 'MISSED') return <PhoneMissed className="w-4 h-4" style={{ color: 'var(--accent-danger)' }} />;
    if (call.isOutgoing) return <PhoneOutgoing className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />;
    return <PhoneIncoming className="w-4 h-4" style={{ color: 'var(--accent-success)' }} />;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 pb-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--glass-border)', paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>Calls</h2>
        </div>
      </div>

      {/* Call list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="w-12 h-12 rounded-full" style={{ background: 'var(--bg-input)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded w-32" style={{ background: 'var(--bg-input)' }} />
                  <div className="h-2 rounded w-20" style={{ background: 'var(--bg-input)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4" style={{ minHeight: 300 }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
              <PhoneOff className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No calls yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Your call history will appear here</p>
            </div>
          </div>
        ) : (
          <div className="py-2">
            {calls.map((call, i) => {
              const other = getOtherUser(call);
              const name = other?.name || 'Group call';
              const avatarUrl = other?.avatarUrl;
              return (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors group"
                >
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold overflow-hidden"
                    style={{ background: avatarUrl ? 'transparent' : hashStringToColor(name) }}
                  >
                    {avatarUrl
                      ? <img src={avatarUrl} className="w-full h-full object-cover" />
                      : getAvatarInitials(name)
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {getCallIcon(call)}
                      <span className="text-xs" style={{ color: call.status === 'MISSED' ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                        {call.status === 'MISSED' ? 'Missed' : call.isOutgoing ? 'Outgoing' : 'Incoming'}
                        {call.duration ? ` · ${formatDuration(call.duration)}` : ''}
                        {' · '}{formatDistanceToNow(new Date(call.startedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Call back buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => other && initiateCall(other.id, 'VOICE')}
                      className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
                      style={{ color: 'var(--accent-primary)' }}
                      title="Voice call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    {(call.type === 'VIDEO' || call.type === 'GROUP_VIDEO') && (
                      <button
                        onClick={() => other && initiateCall(other.id, 'VIDEO')}
                        className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
                        style={{ color: 'var(--accent-primary)' }}
                        title="Video call"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
