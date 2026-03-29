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

  const initials = name.trim()
    ? name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-[20px] font-medium text-gray-900 mb-1">Profile info</h1>
          <p className="text-[14px] text-gray-500">Please provide your name and an optional profile photo</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Avatar */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden bg-gray-200">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#8696A0" strokeWidth="1.5">
                    <path d="M20 21V19C20 16.24 15.5 15 12 15C8.5 15 4 16.24 4 19V21" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <div className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer bg-[#128C7E] border-3 border-white"
                onClick={() => fileInputRef.current?.click()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M23 19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V8C1 6.9 1.9 6 3 6H7L9 3H15L17 6H21C22.1 6 23 6.9 23 8V19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2"/>
                </svg>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
          </div>

          {/* Name input */}
          <div className="mb-6">
            <input type="text" placeholder="Type your name here" value={name}
              onChange={e => { setName(e.target.value); if (error) setError('') }}
              autoFocus maxLength={50}
              className="w-full py-3 text-[17px] text-gray-900 border-b-2 border-[#128C7E] outline-none placeholder:text-gray-400" />
            <div className="flex justify-between mt-1.5">
              {error && <p className="text-[13px] text-red-500">{error}</p>}
              <p className="text-[13px] text-gray-400 ml-auto">{name.length}/50</p>
            </div>
          </div>

          <button type="submit" disabled={loading || !name.trim()}
            className={`w-full py-3.5 rounded-full text-[16px] font-medium transition-colors ${
              name.trim() ? 'bg-[#128C7E] text-white active:bg-[#075E54]' : 'bg-gray-200 text-gray-400'
            } ${loading ? 'opacity-70' : ''}`}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Setting up...
              </span>
            ) : 'Next'}
          </button>

          <button type="button" onClick={() => navigate('/', { replace: true })}
            className="w-full mt-3 py-3 text-[14px] text-gray-500">
            Skip for now
          </button>
        </form>
      </div>
    </div>
  )
}
