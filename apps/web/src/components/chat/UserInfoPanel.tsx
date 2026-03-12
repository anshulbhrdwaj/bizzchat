import { X, Phone, Video, Briefcase, MapPin, Globe, Mail, Package } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { getAvatarInitials, hashStringToColor } from '../../lib/utils';
import type { User, BusinessProfile } from '../../types';
import { useCallStore } from '../../stores/callStore';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../stores/chatStore';
import { MessageSquare, UserPlus } from 'lucide-react';

interface UserInfoPanelProps {
  userId: string;
  onClose: () => void;
  className?: string;
}

export default function UserInfoPanel({ userId, onClose, className = '' }: UserInfoPanelProps) {
  const { initiateCall } = useCallStore();
  const navigate = useNavigate();
  const { addOrUpdateChat, setActiveChat } = useChatStore();
  const queryClient = useQueryClient();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data } = await api.get(`/users/${userId}`);
      return data as User;
    },
    refetchOnMount: true,
  });

  const { data: businessProfile, isLoading: loadingBusiness } = useQuery({
    queryKey: ['business-profile-public', userId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/business/user/${userId}/public`);
        return data as BusinessProfile;
      } catch (err) {
        return null;
      }
    },
    enabled: !!user?.isVerifiedBusiness,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data } = await api.get('/users/contacts/list');
      return data as User[];
    },
  });

  const isContact = contacts.some((c: User) => c.id === userId);

  const addContactMutation = useMutation({
    mutationFn: async () => api.post('/users/contacts', { contactId: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const startChat = async () => {
    const { data } = await api.post('/chats/direct', { userId });
    addOrUpdateChat(data);
    setActiveChat(data.id);
    navigate(`/chat/${data.id}`);
    onClose();
  };

  if (loadingUser) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)' }}>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading info...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`flex flex-col overflow-hidden ${className}`} style={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)' }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 sticky top-0 z-10" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', paddingTop: 'calc(12px + env(safe-area-inset-top))' }}>
        <button onClick={onClose} className="p-1.5 -ml-1.5 rounded-full hover:bg-[var(--bg-hover)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>Contact info</h3>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ background: 'var(--bg-primary)' }}>
        {/* Main Cover & Identifying Info */}
        <div className="flex flex-col items-center pt-6 pb-5 px-6 mb-2 text-center" style={{ background: 'var(--bg-secondary)' }}>
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4 overflow-hidden shadow-md"
            style={{ background: user.avatarUrl ? 'transparent' : hashStringToColor(user.name) }}
          >
            {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : getAvatarInitials(user.name)}
          </div>
          
          <h2 className="text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>
            {businessProfile?.businessName || user.name}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {businessProfile?.category || user.phone}
          </p>

          {/* Action Row */}
          <div className="flex justify-center gap-2 mt-6 w-full px-2">
            <button onClick={startChat} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-[var(--accent-primary)] text-white shadow-sm hover:opacity-90">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>Message</span>
            </button>
            <button onClick={() => initiateCall(user.id, 'VOICE')} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Audio</span>
            </button>
            <button onClick={() => initiateCall(user.id, 'VIDEO')} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                <Video className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Video</span>
            </button>
            {!isContact && (
              <button 
                onClick={() => addContactMutation.mutate()} 
                disabled={addContactMutation.isPending}
                className="flex flex-1 flex-col items-center gap-1.5 group"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                  <UserPlus className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {addContactMutation.isPending ? 'Adding' : 'Add'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Business Description */}
        {businessProfile?.description && (
          <div className="p-4 mb-2" style={{ background: 'var(--bg-secondary)' }}>
            <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {businessProfile.description}
            </p>
          </div>
        )}

        {/* User About (Fallback if no business description, or shown alongside) */}
        {!businessProfile?.description && user.about && (
          <div className="p-4 mb-2" style={{ background: 'var(--bg-secondary)' }}>
            <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>{user.about}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>About</p>
          </div>
        )}

        {/* Business Catalog & Info Blocks */}
        {user.isVerifiedBusiness && businessProfile && (
          <>
            {/* Catalog Snippet */}
            {businessProfile.products && businessProfile.products.length > 0 && (
              <div className="p-4 mb-2" style={{ background: 'var(--bg-secondary)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                    <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>Catalog</h4>
                  </div>
                  <button className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>See all</button>
                </div>
                
                <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 -mx-4 px-4">
                  {businessProfile.products.slice(0, 6).map(product => (
                    <div key={product.id} className="w-32 flex-shrink-0 cursor-pointer group">
                      <div className="w-full h-32 rounded-xl mb-2 overflow-hidden bg-[var(--bg-input)] border border-[var(--glass-border)] relative">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl opacity-50">🛍️</div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                          {product.price != null && <p className="text-xs font-semibold text-white">{product.currency} {product.price.toFixed(2)}</p>}
                        </div>
                      </div>
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Business Details (Address, Email, Web) */}
            <div className="mb-2" style={{ background: 'var(--bg-secondary)' }}>
              {businessProfile.address && (
                <div className="flex items-start gap-4 p-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-secondary)' }} />
                  <div>
                    <p className="text-[15px]" style={{ color: 'var(--text-primary)' }}>{businessProfile.address}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Business address</p>
                  </div>
                </div>
              )}
              {businessProfile.email && (
                <div className="flex items-start gap-4 p-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                  <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-secondary)' }} />
                  <div>
                    <a href={`mailto:${businessProfile.email}`} className="text-[15px] hover:underline" style={{ color: 'var(--text-primary)' }}>{businessProfile.email}</a>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Email</p>
                  </div>
                </div>
              )}
              {businessProfile.website && (
                <div className="flex items-start gap-4 p-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                  <Globe className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-secondary)' }} />
                  <div>
                    <a href={businessProfile.website} target="_blank" rel="noreferrer" className="text-[15px] hover:underline" style={{ color: 'var(--accent-primary)' }}>
                      {businessProfile.website.replace(/^https?:\/\//, '')}
                    </a>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Website</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
