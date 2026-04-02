import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import apiClient from '@/lib/api'
import { Camera, ChevronLeft, Check, Loader2, User as UserIcon } from 'lucide-react'

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const { user, updateUser, isAuthenticated } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isAuthenticated) navigate('/auth', { replace: true })
  }, [isAuthenticated, navigate])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }
    setAvatar(file)
    setAvatarPreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      let avatarUrl = user?.avatarUrl
      if (avatar) {
        const formData = new FormData()
        formData.append('avatar', avatar)
        try {
          const { data } = await apiClient.post('/users/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          avatarUrl = data.url
        } catch (e: any) {
          console.error("Avatar upload failed:", e.response?.data?.error || e.message)
        }
      }
      await apiClient.put('/users/me', { name: name.trim(), avatarUrl })
      updateUser({ name: name.trim(), avatarUrl })
      navigate('/settings')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-3 safe-area-top shadow-sm border-b border-gray-100 shrink-0 bg-wa-teal-dark">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-100" />
        </button>
        <h1 className="text-[18px] font-bold text-gray-50 flex-1">Edit Profile</h1>
        <button 
          onClick={handleSubmit} 
          disabled={loading || !name.trim() || (name.trim() === user?.name && !avatar)}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
            loading || !name.trim() || (name.trim() === user?.name && !avatar) 
              ? 'text-gray-300' 
              : 'text-white active:scale-95 shadow-sm'
          }`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 ring-4 ring-[#128C7E]/10 transition-all group-hover:ring-[#128C7E]/20">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <UserIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-[#128C7E] text-white flex items-center justify-center border-4 border-white shadow-lg active:scale-90 transition-transform"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                className="hidden" 
              />
            </div>
            <p className="mt-4 text-[13px] font-medium text-gray-500">Tap the camera to change photo</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label className="block text-[12px] font-bold text-[#128C7E] uppercase tracking-wider mb-1.5 ml-1">
                Display Name
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={name}
                  onChange={e => { setName(e.target.value); if (error) setError('') }}
                  placeholder="Enter your name"
                  maxLength={50}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent border-b-gray-200 focus:bg-white focus:border-b-[#128C7E] rounded-t-xl transition-all outline-none text-[16px] text-gray-900"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 font-medium">
                  {name.length}/50
                </span>
              </div>
              <p className="mt-2 text-[12px] text-gray-400 px-1 leading-relaxed">
                This name will be visible to your contacts and businesses on BizChat.
              </p>
              {error && <p className="mt-2 text-[12px] text-red-500 px-1 animate-pulse">{error}</p>}
            </div>

            <div>
              <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                Phone Number
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 opacity-60 grayscale">
                <span className="text-[17px] text-gray-500">📱</span>
                <span className="text-[16px] text-gray-500 font-medium">{user?.phone}</span>
                <Check className="w-5 h-5 text-green-500 ml-auto" />
              </div>
              <p className="mt-2 text-[11px] text-gray-400 px-1 italic">
                Verified Phone Number cannot be changed.
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* Footer Info */}
      <div className="p-6 text-center shrink-0 border-t border-gray-50">
        <p className="text-[12px] text-gray-400 italic">
          BizChat uses end-to-end encryption for your profile updates.
        </p>
      </div>
    </div>
  )
}
