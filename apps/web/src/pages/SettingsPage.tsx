import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { getInitials } from '@/lib/utils'
import apiClient from '@/lib/api'
import { 
  User, 
  Store, 
  Moon, 
  Bell, 
  ShieldCheck, 
  FileText, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  Settings as SettingsIcon,
  HelpCircle,
  ExternalLink
} from 'lucide-react'

interface SettingsItemProps {
  icon: React.ReactNode
  label: string
  subtitle?: string
  action?: () => void
  disabled?: boolean
  toggle?: boolean
  toggled?: boolean
  onToggle?: () => void
  destructive?: boolean
}

function SettingsItem({ icon, label, subtitle, action, disabled, toggle, toggled, onToggle, destructive }: SettingsItemProps) {
  return (
    <button
      onClick={toggle ? onToggle : action}
      disabled={disabled}
      className={`w-full flex items-center gap-4 px-4 py-4 text-left transition-all active:bg-gray-100 disabled:opacity-50 ${destructive ? 'text-red-500' : 'text-gray-900'}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${destructive ? 'bg-red-50' : 'bg-gray-50'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[16px] font-medium ${destructive ? 'text-red-500' : 'text-gray-900'}`}>{label}</p>
        {subtitle && <p className="text-[13px] text-gray-500 truncate">{subtitle}</p>}
      </div>
      {toggle ? (
        <div 
          onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
          className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${toggled ? 'bg-[#128C7E]' : 'bg-gray-200'}`}
        >
          <div 
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
            style={{ transform: toggled ? 'translateX(24px)' : 'translateX(4px)' }} 
          />
        </div>
      ) : !disabled && (
        <ChevronRight className="w-5 h-5 text-gray-300" />
      )}
    </button>
  )
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

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FA] overflow-hidden">
      {/* Header */}
      <header className="px-5 pt-safe-top pb-4 bg-white border-b border-gray-100 flex items-center gap-3 shrink-0 bg-wa-teal-dark">
        <button onClick={() => navigate("/chats")} className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-100" />
        </button>
        <h1 className="text-[20px] font-bold text-gray-50">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-10">
        {/* Profile Card */}
        <div className="mx-4 mt-6 bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#128C7E]/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden bg-[#128C7E] shadow-inner relative z-10">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">{getInitials(user?.name)}</span>
            )}
          </div>
          
          <div className="flex-1 min-w-0 relative z-10">
            <h2 className="text-[20px] font-bold text-gray-900 truncate">
              {user?.name || 'Your Name'}
            </h2>
            <p className="text-[14px] font-medium text-gray-500 mt-0.5">
              {user?.phone}
            </p>
            <button 
              onClick={() => navigate('/settings/profile')}
              className="mt-2 text-[13px] font-bold text-[#128C7E] flex items-center gap-1 active:opacity-70 transition-opacity"
            >
              Edit Profile <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Business Section */}
        <div className="mx-4 mt-8">
          <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3 ml-2">Business Settings</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <SettingsItem 
              icon={<Store className="w-5 h-5 text-[#128C7E]" />}
              label="Business Profile"
              subtitle="Manage store details, tax & delivery"
              action={() => navigate('/business/setup')}
            />
          </div>
        </div>

        {/* Preferences Section */}
        <div className="mx-4 mt-6">
          <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3 ml-2">Preferences</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
            <SettingsItem 
              icon={<Moon className="w-5 h-5 text-indigo-500" />}
              label="Dark Mode"
              subtitle="Switch to dark theme"
              toggle
              toggled={darkMode}
              onToggle={() => setDarkMode(!darkMode)}
            />
            <SettingsItem 
              icon={<Bell className="w-5 h-5 text-amber-500" />}
              label="Notifications"
              subtitle="Push alerts for new messages"
              toggle
              toggled={notifications}
              onToggle={() => setNotifications(!notifications)}
            />
          </div>
        </div>

        {/* Support Section */}
        <div className="mx-4 mt-6">
          <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3 ml-2">About & Support</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
            <SettingsItem 
              icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
              label="Privacy Policy"
              action={() => navigate('/settings/privacy')}
            />
            <SettingsItem 
              icon={<FileText className="w-5 h-5 text-gray-400" />}
              label="Terms of Service"
              action={() => navigate('/settings/terms')}
            />
            <SettingsItem 
              icon={<HelpCircle className="w-5 h-5 text-blue-500" />}
              label="Help Center"
              subtitle="Contact support or browse FAQs"
              disabled
            />
          </div>
        </div>

        {/* Account Actions */}
        <div className="mx-4 mt-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <SettingsItem 
              icon={<LogOut className="w-5 h-5 text-red-500" />}
              label="Log Out"
              subtitle="Disconnect your account"
              destructive
              action={() => setShowLogoutConfirm(true)}
            />
          </div>
        </div>

        <div className="mt-12 text-center px-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#128C7E] flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-[18px] font-black italic tracking-tight text-gray-300">BIZZCHAT</span>
          </div>
          <p className="text-[12px] font-medium text-gray-400">Version 1.0.0 (Build 2026.04.02)</p>
          <p className="text-[11px] text-gray-300 mt-1 uppercase tracking-widest font-bold">Made with 💚 by Doank</p>
        </div>
      </div>

      {/* Logout confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl relative z-10 animate-in zoom-in-95 fade-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center mb-6 mx-auto">
              <LogOut className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-[22px] font-bold text-gray-900 text-center mb-2">Ready to leave?</h3>
            <p className="text-[15px] text-gray-500 text-center mb-8 leading-relaxed">
              Logging out will remove your active session. You'll need to verify your phone number to sign back in.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleLogout}
                className="w-full py-4 rounded-2xl text-[16px] font-bold text-white bg-red-500 active:scale-95 transition-all shadow-lg shadow-red-500/25"
              >
                Yes, Log Out
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-4 rounded-2xl text-[16px] font-bold text-gray-500 bg-gray-50 active:bg-gray-100 transition-all"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
