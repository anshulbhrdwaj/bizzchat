import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '@/lib/api'

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
]

export default function AuthPage() {
  const navigate = useNavigate()
  const [country, setCountry] = useState(COUNTRY_CODES[0])
  const [phone, setPhone] = useState('')
  const [showCountry, setShowCountry] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.length < 10) {
      setError('Enter a valid phone number')
      return
    }
    setError('')
    setLoading(true)
    try {
      const fullPhone = `${country.code}${phone}`
      await apiClient.post('/auth/send-otp', { phone: fullPhone })
      navigate('/auth/otp', { state: { phone: fullPhone } })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Purple mesh background */}
      <div className="absolute inset-0 -z-10" style={{
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(91, 63, 217, 0.25) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(123, 95, 232, 0.2) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(8, 145, 178, 0.1) 0%, transparent 60%),
          var(--color-background)
        `
      }} />

      {/* Floating decorative circles */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-20 animate-pulse"
        style={{ background: 'var(--color-primary)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-32 right-8 w-24 h-24 rounded-full opacity-15 animate-pulse"
        style={{ background: 'var(--color-primary-mid)', filter: 'blur(30px)', animationDelay: '1s' }} />

      {/* Logo & Title */}
      <div className="mb-10 text-center animate-fade-up">
        <div className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))' }}>
          <span className="text-4xl text-white font-bold">B</span>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          BizChat
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Commerce-first messaging
        </p>
      </div>

      {/* Phone Entry Card */}
      <div className="glass-card w-full max-w-sm p-7 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Enter your phone number
        </h2>
        <p className="text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
          We'll send you a verification code
        </p>

        <form onSubmit={handleSubmit}>
          {/* Phone input with country selector */}
          <div className="flex gap-2 mb-4">
            {/* Country code button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCountry(!showCountry)}
                className="h-14 px-3 rounded-xl flex items-center gap-2 transition-all touch-target"
                style={{
                  background: 'var(--color-surface)',
                  border: '1.5px solid var(--glass-border)',
                  color: 'var(--color-text-primary)',
                  minWidth: '90px',
                }}
              >
                <span className="text-xl">{country.flag}</span>
                <span className="text-sm font-medium">{country.code}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="ml-1 opacity-50">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>

              {/* Country dropdown */}
              {showCountry && (
                <div className="absolute top-full left-0 mt-2 w-52 glass-card p-2 z-50 animate-scale-in"
                  style={{ boxShadow: '0 8px 30px rgba(91, 63, 217, 0.15)' }}>
                  {COUNTRY_CODES.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => { setCountry(c); setShowCountry(false); inputRef.current?.focus() }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-[var(--color-primary-light)]"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      <span className="text-xl">{c.flag}</span>
                      <span className="text-sm font-medium flex-1">{c.name}</span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{c.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Phone number input */}
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              placeholder="Phone number"
              value={phone}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '')
                if (val.length <= 10) setPhone(val)
                if (error) setError('')
              }}
              autoFocus
              className="flex-1 h-14 px-4 rounded-xl text-lg font-medium outline-none transition-all"
              style={{
                background: 'var(--color-surface)',
                border: '1.5px solid var(--glass-border)',
                color: 'var(--color-text-primary)',
                caretColor: 'var(--color-primary)',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--glass-border)')}
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-xs mb-3 animate-fade-up" style={{ color: 'var(--color-error)' }}>
              {error}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || phone.length < 10}
            className="w-full h-14 rounded-xl font-semibold text-white text-sm transition-all touch-target"
            style={{
              background: phone.length >= 10
                ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))'
                : 'var(--color-surface)',
              color: phone.length >= 10 ? '#fff' : 'var(--color-text-muted)',
              opacity: loading ? 0.7 : 1,
              boxShadow: phone.length >= 10 ? '0 4px 20px rgba(91, 63, 217, 0.3)' : 'none',
              transform: loading ? 'scale(0.98)' : 'scale(1)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              'Get OTP'
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-center max-w-xs animate-fade-up" style={{ color: 'var(--color-text-muted)', animationDelay: '200ms' }}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  )
}
