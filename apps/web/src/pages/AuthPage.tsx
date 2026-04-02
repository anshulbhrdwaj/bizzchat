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
    <div className="min-h-dvh flex flex-col bg-white">
      {/* Teal gradient top section */}
      <div className="bg-[#075E54] pt-safe-top pb-10 px-6 flex flex-col items-center">
        <div className="mt-16 mb-6 w-20 h-20 rounded-[28px] flex items-center justify-center bg-white/15 backdrop-blur-sm shadow-lg">
          <span className="text-4xl font-black text-white">B</span>
        </div>
        <h1 className="text-[28px] font-black text-white tracking-tight">BizChat</h1>
        <p className="text-[15px] text-white/70 mt-1.5">Commerce-first messaging</p>
      </div>

      {/* White card content */}
      <div className="flex-1 bg-[#F0F2F5] px-4 -mt-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mt-0">
          <div className="text-center mb-6">
            <h2 className="text-[20px] font-bold text-gray-900 mb-1">
              Enter your phone number
            </h2>
            <p className="text-[14px] text-gray-400">
              We'll send you a verification code
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Phone Input */}
            <div className="flex items-center mb-4 h-14 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-[#128C7E] transition-colors overflow-hidden">
              {/* Country code button */}
              <div className="relative h-full flex items-center">
                <button
                  type="button"
                  onClick={() => setShowCountry(!showCountry)}
                  className="h-full px-3 flex items-center gap-1.5 text-gray-900 active:bg-gray-100 transition-colors"
                >
                  <span className="text-xl">{country.flag}</span>
                  <span className="text-[15px] font-semibold">{country.code}</span>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="ml-0.5 text-gray-400">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>

                {/* Country dropdown */}
                {showCountry && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50">
                    {COUNTRY_CODES.map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => { setCountry(c); setShowCountry(false); inputRef.current?.focus() }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-gray-900 active:bg-gray-50 transition-colors"
                      >
                        <span className="text-xl">{c.flag}</span>
                        <span className="text-[14px] font-medium flex-1">{c.name}</span>
                        <span className="text-[13px] text-gray-400">{c.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-6 mx-1 bg-gray-200" />

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
              <p className="text-[13px] text-red-500 mb-3 text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || phone.length < 10}
              className={`w-full h-14 rounded-2xl font-bold text-[16px] transition-all shadow-lg ${
                phone.length >= 10
                  ? 'bg-[#128C7E] text-white active:bg-[#075E54] shadow-[#128C7E]/25'
                  : 'bg-gray-100 text-gray-400 shadow-none'
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
        <p className="mt-6 text-[12px] text-center text-gray-400 max-w-xs mx-auto leading-relaxed">
          By continuing, you agree to our{' '}
          <span className="text-[#128C7E] font-semibold">Terms of Service</span>
          {' '}and{' '}
          <span className="text-[#128C7E] font-semibold">Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}
