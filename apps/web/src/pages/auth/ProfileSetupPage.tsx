import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const { updateProfile } = useAuthStore();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = ev => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      // Upload avatar if selected
      if (avatarFile) {
        const form = new FormData();
        form.append('avatar', avatarFile);
        const { data: avatarData } = await api.post('/users/avatar', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updateProfile({ avatarUrl: avatarData.avatarUrl });
      }
      // Update profile
      const { data } = await api.patch('/auth/profile', { name: name.trim() });
      updateProfile(data);
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-sm glass-panel rounded-2xl p-8"
      >
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
            Set up your profile
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Add a photo and your name
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar picker */}
          <div className="flex justify-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative w-24 h-24 rounded-full overflow-hidden transition-transform hover:scale-105"
                style={{ background: 'var(--bg-input)' }}
              >
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <Camera className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Add photo</span>
                  </div>
                )}
              </button>
              <div
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center pointer-events-none"
                style={{ background: 'var(--accent-primary)', border: '3px solid var(--bg-primary)' }}
              >
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Name input */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={60}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all"
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                borderColor: 'var(--glass-border)',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--glass-border)')}
              autoFocus
            />
            <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-tertiary)' }}>
              {name.length}/60
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-white"
            style={{ background: name.trim() ? 'var(--accent-gradient)' : 'var(--bg-input)' }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Check className="w-4 h-4" /> Save & Continue</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
