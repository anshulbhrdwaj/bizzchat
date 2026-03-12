import { useState } from 'react';
import { ArrowLeft, Camera, User, Info, Save } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';

interface ProfileSettingsProps {
  onBack: () => void;
}

export default function ProfileSettings({ onBack }: ProfileSettingsProps) {
  const { user, updateProfile } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      setIsSaving(true);
      // Mock API call to update profile. Real endpoint depends on backend.
      // E.g., const { data } = await api.patch('/users/profile', { name, about, avatarUrl });
      // updateProfile(data);
      
      // Since it's a basic requirement to save locally if backend is not ready:
      try {
        await api.patch('/users/profile', { name, about, avatarUrl });
      } catch (err) {
        console.warn('Backend update failed, updating local state', err);
      }
      
      updateProfile({ name, about, avatarUrl });
      onBack();
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Header */}
      <div 
        className="px-4 pb-4 border-b flex items-center gap-4" 
        style={{ 
          borderColor: 'var(--glass-border)',
          paddingTop: 'calc(16px + env(safe-area-inset-top))' 
        }}
      >
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h2 className="text-lg font-bold font-display flex-1" style={{ color: 'var(--text-primary)' }}>Profile</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group cursor-pointer">
            <div
              className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center text-4xl text-white font-bold border-4"
              style={{ background: 'var(--accent-primary)', borderColor: 'var(--bg-primary)' }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                name[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="text-white w-8 h-8" />
            </div>
          </div>
          <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
            Click avatar to change (coming soon)
          </p>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              <User className="w-4 h-4" /> Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              style={{
                background: 'var(--bg-input)',
                borderColor: 'var(--glass-border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Your name"
            />
            <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
              This is not your username or pin. This name will be visible to your contacts.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              <Info className="w-4 h-4" /> About
            </label>
            <input
              type="text"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              style={{
                background: 'var(--bg-input)',
                borderColor: 'var(--glass-border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Hey there! I am using BizChat."
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Phone
            </label>
            <div className="px-4 py-3 rounded-xl" style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)' }}>
              {user?.phone}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <button
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="w-full py-3.5 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'var(--accent-primary)' }}
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
