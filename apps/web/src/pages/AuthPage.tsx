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
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
      {/* Logo & Title */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center bg-[#128C7E]">
          <span className="text-4xl text-white font-bold">B</span>
        </div>
        <h1 className="text-2xl font-medium text-gray-900 mb-1">
          BizChat
        </h1>
        <p className="text-[15px] text-gray-500">
          Commerce-first messaging
        </p>
      </div>

      {/* Phone Entry */}
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h2 className="text-[17px] font-medium text-gray-900 mb-1">
            Enter your phone number
          </h2>
          <p className="text-[14px] text-gray-500">
            We'll send you a verification code
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Phone Input */}
          <div className="flex items-center mb-6 h-14 border-b-2 border-[#128C7E]">
            {/* Country code button */}
            <div className="relative h-full flex items-center">
              <button
                type="button"
                onClick={() => setShowCountry(!showCountry)}
                className="h-12 px-3 flex items-center gap-1.5 text-gray-900 active:bg-gray-50 rounded transition-colors"
              >
                <span className="text-xl">{country.flag}</span>
                <span className="text-[15px] font-medium">{country.code}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="ml-0.5 text-gray-400">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>

              {/* Country dropdown */}
              {showCountry && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-50">
                  {COUNTRY_CODES.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => { setCountry(c); setShowCountry(false); inputRef.current?.focus() }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-gray-900 active:bg-gray-50 transition-colors"
                    >
                      <span className="text-xl">{c.flag}</span>
                      <span className="text-[14px] font-medium flex-1">{c.name}</span>
                      <span className="text-[13px] text-gray-500">{c.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-6 mx-1 bg-gray-300" />

            {/* Phone number input */}
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              placeholder="Phone number"
              value={phone}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '')
                if (val.length <= 15) setPhone(val)
                if (error) setError('')
              }}
              autoFocus
              className="flex-1 h-full px-2 bg-transparent text-[17px] font-medium outline-none text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[13px] text-red-500 mb-3">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || phone.length < 10}
            className={`w-full h-14 rounded-full font-medium text-[16px] transition-all ${
              phone.length >= 10
                ? 'bg-[#128C7E] text-white active:bg-[#075E54]'
                : 'bg-gray-200 text-gray-400'
            } ${loading ? 'opacity-70' : ''}`}
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
      <p className="mt-8 text-[13px] text-center text-gray-500 max-w-xs">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  )
}
