import { useState } from 'react';
import {
  Bell, Lock, Eye, Palette, Database, Globe, Keyboard, User, ChevronRight, Moon, Sun, Monitor
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import ProfileSettings from '../components/settings/ProfileSettings';
import PlaceholderSettings from '../components/settings/PlaceholderSettings';

const SETTINGS_SECTIONS = [
  { icon: User, label: 'Profile', sublabel: 'Name, photo, about' },
  { icon: Bell, label: 'Notifications', sublabel: 'Messages, groups, calls' },
  { icon: Lock, label: 'Privacy & Security', sublabel: 'Last seen, read receipts, blocked' },
  { icon: Palette, label: 'Appearance', sublabel: 'Theme, wallpaper, font size' },
  { icon: Database, label: 'Storage', sublabel: 'Manage storage & data' },
  { icon: Globe, label: 'Language', sublabel: 'App language' },
  { icon: Keyboard, label: 'Shortcuts', sublabel: 'Keyboard shortcuts' },
];

type ThemeOption = 'dark' | 'light' | 'system';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  if (activeSection === 'Profile') {
    return <ProfileSettings onBack={() => setActiveSection(null)} />;
  }

  if (activeSection && activeSection !== 'Profile') {
    return <PlaceholderSettings title={activeSection} onBack={() => setActiveSection(null)} />;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[var(--bg-primary)]">
      <div 
        className="px-4 pb-4 border-b" 
        style={{ 
          borderColor: 'var(--glass-border)',
          paddingTop: 'calc(16px + env(safe-area-inset-top))' 
        }}
      >
        <h2 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>Settings</h2>
      </div>

      {/* Profile card */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-white font-bold"
            style={{ background: 'var(--accent-primary)' }}
          >
            {user?.avatarUrl
              ? <img src={user.avatarUrl} className="w-full h-full object-cover" />
              : user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.about || 'Hey there! I am using BizChat.'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{user?.phone}</p>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
        </div>
      </div>

      {/* Theme switcher */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>THEME</p>
        <div className="flex gap-2">
          {([
            { value: 'dark', label: 'Dark', Icon: Moon },
            { value: 'light', label: 'Light', Icon: Sun },
            { value: 'system', label: 'System', Icon: Monitor },
          ] as { value: ThemeOption; label: string; Icon: typeof Moon }[]).map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all"
              style={{
                background: theme === value ? 'var(--bg-selected)' : 'var(--bg-input)',
                borderColor: theme === value ? 'var(--accent-primary)' : 'var(--glass-border)',
                color: theme === value ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Settings list */}
      <div className="flex-1">
        {SETTINGS_SECTIONS.map(({ icon: Icon, label, sublabel }) => (
          <button
            key={label}
            onClick={() => setActiveSection(label)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--bg-hover)] transition-colors text-left border-b"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
              <Icon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sublabel}</p>
            </div>
            <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          </button>
        ))}
      </div>

      <div className="px-4 py-6 text-center">
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>BizChat Business v1.0.0</p>
      </div>
    </div>
  );
}
