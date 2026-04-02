import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import apiClient from '@/lib/api'

export default function ProfileSetupPage() {
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
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return }
    setAvatar(file)
    setAvatarPreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
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
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      {/* Teal gradient top section */}
      <div className="bg-[#075E54] pt-safe-top pb-10 px-6 flex flex-col items-center">
        {/* Avatar picker */}
        <div className="mt-12 mb-5 relative">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-28 h-28 rounded-[32px] flex items-center justify-center overflow-hidden bg-white/15 backdrop-blur-sm shadow-lg border-2 border-white/20"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2">
                <path d="M20 21V19C20 16.24 15.5 15 12 15C8.5 15 4 16.24 4 19V21" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <div
            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer bg-white shadow-md"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M23 19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V8C1 6.9 1.9 6 3 6H7L9 3H15L17 6H21C22.1 6 23 6.9 23 8V19Z" stroke="#128C7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="4" stroke="#128C7E" strokeWidth="2"/>
            </svg>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>
        <h1 className="text-[24px] font-black text-white tracking-tight">Profile Info</h1>
        <p className="text-[14px] text-white/70 mt-1.5 text-center">Add your name and an optional photo</p>
      </div>

      {/* White card content */}
      <div className="flex-1 bg-[#F0F2F5] px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mt-0">
          <form onSubmit={handleSubmit}>
            {/* Name input */}
            <div className="mb-6">
              <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                Your Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type your name here"
                  value={name}
                  onChange={e => { setName(e.target.value); if (error) setError('') }}
                  autoFocus
                  maxLength={50}
                  className="w-full h-14 px-4 bg-gray-50 rounded-2xl border border-gray-200 focus:border-[#128C7E] outline-none text-[17px] font-medium text-gray-900 placeholder:text-gray-400 transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 font-medium">
                  {name.length}/50
                </span>
              </div>
              {error && <p className="text-[13px] text-red-500 mt-2 ml-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className={`w-full h-14 rounded-2xl text-[16px] font-bold transition-all shadow-lg ${
                name.trim() ? 'bg-[#128C7E] text-white active:bg-[#075E54] shadow-[#128C7E]/25' : 'bg-gray-100 text-gray-400 shadow-none'
              } ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up...
                </span>
              ) : 'Continue'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="w-full mt-3 py-3 text-[14px] font-medium text-gray-400 text-center"
            >
              Skip for now
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
