/// <reference types="vite/client" />
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function OtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const phone = (location.state as any)?.phone || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (next.every(d => d) && next.join('').length === 6) {
      handleVerify(next.join(''));
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      handleVerify(text);
    }
  };

  const handleVerify = async (code: string) => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', { phone, code });
      setAuth(data.user, data.accessToken, data.refreshToken);
      if (data.user.isNewUser || data.user.name === data.user.phone) {
        navigate('/auth/profile', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP. Try again.');
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;
    await api.post('/auth/send-otp', { phone });
    setCountdown(60);
    setOtp(['', '', '', '', '', '']);
    refs.current[0]?.focus();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-sm glass-panel rounded-2xl p-8"
      >
        <button
          onClick={() => navigate('/auth/phone')}
          className="flex items-center gap-1 text-sm mb-6 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <span className="text-3xl">📱</span>
          </div>
          <h2 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
            Verify your number
          </h2>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            Enter the 6-digit code sent to<br />
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{phone}</span>
          </p>
          {import.meta.env.DEV && (
            <p className="text-xs mt-1 rounded-lg px-3 py-1 inline-block" style={{ background: 'var(--accent-warning)20', color: 'var(--accent-warning)' }}>
              Dev mode: OTP is <strong>123456</strong>
            </p>
          )}
        </div>

        <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold rounded-xl border outline-none transition-all"
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                borderColor: digit ? 'var(--accent-primary)' : 'var(--glass-border)',
              }}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-center mb-4" style={{ color: 'var(--accent-danger)' }}>{error}</p>
        )}

        {loading && (
          <div className="flex justify-center mb-4">
            <div className="w-6 h-6 border-2 border-t-[var(--accent-primary)] border-[var(--glass-border)] rounded-full animate-spin" />
          </div>
        )}

        <button
          onClick={resendOtp}
          disabled={countdown > 0}
          className="w-full flex items-center justify-center gap-2 text-sm py-2 transition-colors"
          style={{ color: countdown > 0 ? 'var(--text-tertiary)' : 'var(--accent-primary)' }}
        >
          <RefreshCw className="w-4 h-4" />
          {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
        </button>
      </motion.div>
    </div>
  );
}
