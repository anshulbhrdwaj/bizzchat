import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import apiClient from '@/lib/api'

export default function OTPPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const phone = (location.state as any)?.phone || ''
  const { setAuth } = useAuthStore()

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [countdown, setCountdown] = useState(300) // 5 min
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Redirect if no phone
  useEffect(() => {
    if (!phone) navigate('/auth', { replace: true })
  }, [phone, navigate])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const timer = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Auto-submit when all 6 digits filled
  const verifyOtp = useCallback(async (code: string) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await apiClient.post('/auth/verify-otp', { phone, code })
      setAuth(data.user, data.accessToken)
      // Store refresh token
      localStorage.setItem('bizchat-refresh', data.refreshToken)
      if (data.isNewUser || !data.user.name) {
        navigate('/auth/profile', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP')
      setShake(true)
      setTimeout(() => setShake(false), 600)
      setOtp(Array(6).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }, [phone, navigate, setAuth])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (error) setError('')

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit
    const fullCode = newOtp.join('')
    if (fullCode.length === 6) {
      verifyOtp(fullCode)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Paste support
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) {
      setOtp(paste.split(''))
      verifyOtp(paste)
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    try {
      await apiClient.post('/auth/send-otp', { phone })
      setCountdown(300)
      setCanResend(false)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend')
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Purple mesh background */}
      <div className="absolute inset-0 -z-10" style={{
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(91, 63, 217, 0.25) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(123, 95, 232, 0.2) 0%, transparent 50%),
          var(--color-background)
        `
      }} />

      {/* Back button */}
      <button
        onClick={() => navigate('/auth')}
        className="absolute top-6 left-6 w-11 h-11 rounded-xl flex items-center justify-center touch-target transition-colors"
        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M13 4L7 10L13 16" stroke="var(--color-text-primary)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Content */}
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--color-primary-light)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Verification Code
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Enter the 6-digit code sent to
          </p>
          <p className="text-sm font-semibold mt-1" style={{ color: 'var(--color-primary)' }}>
            {phone}
          </p>
        </div>

        {/* OTP Boxes */}
        <div
          className={`flex gap-3 justify-center mb-6 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
          onPaste={handlePaste}
        >
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              autoFocus={i === 0}
              disabled={loading}
              className="w-12 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all"
              style={{
                background: digit ? 'var(--color-primary-light)' : 'var(--color-surface)',
                border: `2px solid ${digit ? 'var(--color-primary)' : error ? 'var(--color-error)' : 'var(--glass-border)'}`,
                color: 'var(--color-text-primary)',
                caretColor: 'var(--color-primary)',
              }}
              onFocus={e => {
                if (!digit) e.target.style.borderColor = 'var(--color-primary)'
              }}
              onBlur={e => {
                if (!digit) e.target.style.borderColor = error ? 'var(--color-error)' : 'var(--glass-border)'
              }}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-center mb-4 animate-fade-up" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center mb-4">
            <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Countdown & Resend */}
        <div className="text-center">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-sm font-semibold transition-colors touch-target"
              style={{ color: 'var(--color-primary)' }}
            >
              Resend Code
            </button>
          ) : (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Resend in <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatTime(countdown)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Shake animation keyframe */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}
