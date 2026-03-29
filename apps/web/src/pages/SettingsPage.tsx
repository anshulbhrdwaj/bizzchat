import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { getInitials } from '@/lib/utils'
import apiClient from '@/lib/api'

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

  const handleLogout = async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore errors on logout
    }
    logout()
    navigate('/auth')
  }

  const sections: { title: string; items: SettingsItem[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Edit Profile', subtitle: user?.name || 'Set your name', action: () => {} },
        { icon: '📱', label: 'Phone Number', subtitle: user?.phone || '+91 ····', disabled: true },
      ],
    },
    {
      title: 'Business',
      items: [
        { icon: '🏪', label: 'Business Profile', subtitle: 'Set up your business', action: () => navigate('/business/setup') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: '🌙', label: 'Dark Mode', subtitle: darkMode ? 'On' : 'Off', toggle: true, toggled: darkMode, onToggle: () => setDarkMode(!darkMode) },
        { icon: '🔔', label: 'Notifications', subtitle: notifications ? 'Enabled' : 'Disabled', toggle: true, toggled: notifications, onToggle: () => setNotifications(!notifications) },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: '📄', label: 'Privacy Policy', subtitle: '', action: () => {} },
        { icon: '📋', label: 'Terms of Service', subtitle: '', action: () => {} },
        { icon: 'ℹ️', label: 'App Version', subtitle: '1.0.0', disabled: true },
      ],
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto pb-20 md:pb-4 bg-gray-50">
      {/* Header */}
      <header className="px-4 py-3 bg-[#075E54] text-white safe-area-top shrink-0 shadow-sm">
        <h1 className="text-[17px] font-medium">Settings</h1>
      </header>

      {/* User card */}
      <div className="bg-white mt-0 p-4 flex items-center gap-4 border-b border-gray-200">
        <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden bg-[#128C7E]">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-white">{getInitials(user?.name)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
          <p className="text-[14px] text-gray-500">{user?.phone}</p>
        </div>
      </div>

      {/* Sections */}
      <div className="mt-4 space-y-4">
        {sections.map(section => (
          <div key={section.title}>
            <p className="text-[13px] font-medium text-gray-500 px-4 pb-2">
              {section.title}
            </p>
            <div className="bg-white border-y border-gray-200">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={item.toggle ? item.onToggle : item.action}
                  disabled={item.disabled}
                  className="w-full flex items-center gap-4 px-4 py-3.5 text-left active:bg-gray-50 transition-colors disabled:opacity-50"
                  style={{ borderBottom: i < section.items.length - 1 ? '1px solid #F3F4F6' : 'none' }}
                >
                  <span className="text-xl w-8 text-center shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] text-gray-900">{item.label}</p>
                    {item.subtitle && <p className="text-[14px] text-gray-500">{item.subtitle}</p>}
                  </div>
                  {item.toggle ? (
                    <div className={`w-12 h-7 rounded-full relative transition-colors shrink-0 ${item.toggled ? 'bg-[#128C7E]' : 'bg-gray-300'}`}>
                      <div className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform"
                        style={{ transform: item.toggled ? 'translateX(22px)' : 'translateX(2px)' }} />
                    </div>
                  ) : !item.disabled && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <div className="px-4 pt-4 pb-8">
          <button onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3 rounded text-[16px] font-medium text-red-500 border border-red-200 active:bg-red-50 transition-colors">
            Log Out
          </button>
          <p className="text-center text-[12px] text-gray-400 mt-4">
            BizChat · Made with 💚 by Doank
          </p>
        </div>
      </div>

      {/* Logout confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-[17px] font-medium text-gray-900 mb-2">Log out?</h3>
            <p className="text-[14px] text-gray-500 mb-6">Are you sure you want to log out? You'll need to verify your phone number again.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded text-[15px] font-medium text-gray-700 bg-gray-100 active:bg-gray-200">Cancel</button>
              <button onClick={handleLogout}
                className="flex-1 py-3 rounded text-[15px] font-medium text-white bg-red-500 active:bg-red-600">Log Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
