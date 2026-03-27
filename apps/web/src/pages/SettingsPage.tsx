import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { getInitials } from '@/lib/utils'

interface SettingsItem {
  icon: string
  label: string
  subtitle: string
  action?: () => void
  disabled?: boolean
  toggle?: boolean
  toggled?: boolean
  onToggle?: () => void
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'))
  const [notifications, setNotifications] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('bizchat-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  const sections: { title: string; items: SettingsItem[] }[] = [
    {
      title: 'Account',
      items: [
        {
          icon: '👤',
          label: 'Edit Profile',
          subtitle: user?.name || 'Set your name',
          action: () => {},
        },
        {
          icon: '📱',
          label: 'Phone Number',
          subtitle: user?.phone || '+91 ····',
          action: () => {},
          disabled: true,
        },
      ],
    },
    {
      title: 'Business',
      items: [
        {
          icon: '🏪',
          label: 'Business Profile',
          subtitle: 'Set up your business',
          action: () => navigate('/business/setup'),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: '🌙',
          label: 'Dark Mode',
          subtitle: darkMode ? 'On' : 'Off',
          toggle: true,
          toggled: darkMode,
          onToggle: () => setDarkMode(!darkMode),
        },
        {
          icon: '🔔',
          label: 'Notifications',
          subtitle: notifications ? 'Enabled' : 'Disabled',
          toggle: true,
          toggled: notifications,
          onToggle: () => setNotifications(!notifications),
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: '📄',
          label: 'Privacy Policy',
          subtitle: '',
          action: () => {},
        },
        {
          icon: '📋',
          label: 'Terms of Service',
          subtitle: '',
          action: () => {},
        },
        {
          icon: 'ℹ️',
          label: 'App Version',
          subtitle: '1.0.0',
          disabled: true,
        },
      ],
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto pb-20 md:pb-4" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="px-4 pt-4 pb-6">
        <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Settings</h1>

        {/* User card */}
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))' }}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-white">{getInitials(user?.name)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{user?.name || 'User'}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{user?.phone}</p>
          </div>
          <button className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11 2L14 5L6 13H3V10L11 2Z" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
        </div>
      </header>

      {/* Sections */}
      <div className="px-4 space-y-6">
        {sections.map(section => (
          <div key={section.title}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-text-muted)' }}>
              {section.title}
            </p>
            <div className="glass-card overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={item.toggle ? item.onToggle : item.action}
                  disabled={item.disabled}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
                  style={{
                    borderBottom: i < section.items.length - 1 ? '1px solid var(--glass-border)' : 'none',
                    opacity: item.disabled ? 0.6 : 1,
                  }}
                >
                  <span className="text-lg w-8 text-center shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.label}</p>
                    {item.subtitle && <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{item.subtitle}</p>}
                  </div>
                  {item.toggle ? (
                    <div className="w-11 h-6 rounded-full relative transition-all shrink-0"
                      style={{ background: item.toggled ? 'var(--color-primary)' : 'var(--color-surface)', border: '1px solid var(--glass-border)' }}>
                      <div className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform"
                        style={{ width: 18, height: 18, transform: item.toggled ? 'translateX(22px)' : 'translateX(2px)' }} />
                    </div>
                  ) : !item.disabled && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
          style={{ border: '1.5px solid var(--color-error)', color: 'var(--color-error)' }}>
          Log Out
        </button>

        {/* App credit */}
        <p className="text-center text-[10px] pb-4" style={{ color: 'var(--color-text-muted)' }}>
          BizChat · Made with 💜 by Doank
        </p>
      </div>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="glass-card p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Log Out?</h3>
            <p className="text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>Are you sure you want to log out? You'll need to verify your phone number again.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl text-xs font-semibold"
                style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>Cancel</button>
              <button onClick={handleLogout}
                className="flex-1 py-3 rounded-xl text-xs font-semibold text-white"
                style={{ background: 'var(--color-error)' }}>Log Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
