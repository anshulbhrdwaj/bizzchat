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
      // Upload avatar if selected
      let avatarUrl = user?.avatarUrl
      if (avatar) {
        const formData = new FormData()
        formData.append('file', avatar)
        formData.append('type', 'avatar')
        try {
          const { data } = await apiClient.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          avatarUrl = data.url
        } catch {
          // Avatar upload failed, continue without
        }
      }

      // Update user profile
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
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10" style={{
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(91, 63, 217, 0.25) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(123, 95, 232, 0.2) 0%, transparent 50%),
          var(--color-background)
        `
      }} />

      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Set up your profile
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Let people know who you are
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Avatar upload */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden transition-all touch-target"
                style={{
                  background: avatarPreview
                    ? 'transparent'
                    : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))',
                  border: '3px solid var(--color-primary-light)',
                  boxShadow: '0 4px 20px rgba(91, 63, 217, 0.2)',
                }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white">{initials}</span>
                )}
              </button>

              {/* Camera badge */}
              <div
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'var(--color-primary)',
                  border: '3px solid var(--color-background)',
                  boxShadow: '0 2px 8px rgba(91, 63, 217, 0.3)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M23 19C23 20.1046 22.1046 21 21 21H3C1.89543 21 1 20.1046 1 19V8C1 6.89543 1.89543 6 3 6H7L9 3H15L17 6H21C22.1046 6 23 6.89543 23 8V19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2"/>
                </svg>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Name input */}
          <div className="glass-card p-5 mb-6">
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Your name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={e => {
                setName(e.target.value)
                if (error) setError('')
              }}
              autoFocus
              maxLength={50}
              className="w-full h-12 px-4 rounded-xl text-sm font-medium outline-none transition-all"
              style={{
                background: 'var(--color-surface)',
                border: '1.5px solid var(--glass-border)',
                color: 'var(--color-text-primary)',
                caretColor: 'var(--color-primary)',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--glass-border)')}
            />
            <p className="text-right text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
              {name.length}/50
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-center mb-4 animate-fade-up" style={{ color: 'var(--color-error)' }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full h-14 rounded-xl font-semibold text-sm transition-all touch-target"
            style={{
              background: name.trim()
                ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))'
                : 'var(--color-surface)',
              color: name.trim() ? '#fff' : 'var(--color-text-muted)',
              opacity: loading ? 0.7 : 1,
              boxShadow: name.trim() ? '0 4px 20px rgba(91, 63, 217, 0.3)' : 'none',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Setting up...
              </span>
            ) : (
              'Continue'
            )}
          </button>

          {/* Skip */}
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="w-full mt-3 py-3 text-xs font-medium transition-colors touch-target"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  )
}
