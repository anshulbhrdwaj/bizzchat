import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import apiClient from "@/lib/api";

export default function OTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = (location.state as any)?.phone || "";
  const { setAuth } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!phone) navigate("/auth", { replace: true });
  }, [phone, navigate]);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const verifyOtp = useCallback(
    async (code: string) => {
      setLoading(true);
      setError("");
      try {
        const { data } = await apiClient.post("/auth/verify-otp", { phone, code });
        setAuth(data.user, data.accessToken, data.refreshToken);
        if (data.isNewUser || !data.user.name) {
          navigate("/auth/profile", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Invalid OTP");
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setOtp(Array(6).fill(""));
        inputRefs.current[0]?.focus();
      } finally {
        setLoading(false);
      }
    },
    [phone, navigate, setAuth],
  );

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (error) setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    const fullCode = newOtp.join("");
    if (fullCode.length === 6) verifyOtp(fullCode);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      verifyOtp(paste);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await apiClient.post("/auth/send-otp", { phone });
      setCountdown(300);
      setCanResend(false);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to resend");
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      {/* Teal gradient top section */}
      <div className="bg-[#075E54] pt-safe-top pb-10 px-6 flex flex-col items-center relative">
        {/* Back button */}
        <button
          onClick={() => navigate("/auth")}
          className="absolute top-6 left-4 w-10 h-10 rounded-full flex items-center justify-center text-white/80 active:bg-white/10 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 12H4M4 12L10 6M4 12L10 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="mt-14 mb-5 w-16 h-16 rounded-[22px] flex items-center justify-center bg-white/15 backdrop-blur-sm shadow-lg">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-[24px] font-black text-white tracking-tight">Verification Code</h1>
        <p className="text-[14px] text-white/70 mt-1.5 text-center">
          Enter the 6-digit code sent to
        </p>
        <p className="text-[15px] font-bold text-white mt-1">{phone}</p>
      </div>

      {/* White card content */}
      <div className="flex-1 bg-[#F0F2F5] px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mt-0">
          {/* OTP Boxes */}
          <div
            className={`flex gap-2.5 justify-center mb-5 ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
            onPaste={handlePaste}
          >
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
                disabled={loading}
                className={`w-12 h-14 text-center text-[22px] font-bold rounded-2xl outline-none transition-all border-2
                  ${digit ? "border-[#128C7E] bg-[#128C7E]/5" : error ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}
                  focus:border-[#128C7E] focus:bg-[#128C7E]/5
                  text-gray-900 disabled:opacity-60`}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-[13px] text-red-500 text-center mb-4">{error}</p>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center mb-4">
              <span className="w-6 h-6 border-2 border-[#128C7E]/20 border-t-[#128C7E] rounded-full animate-spin" />
            </div>
          )}

          {/* Countdown & Resend */}
          <div className="text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                className="w-full py-4 rounded-2xl bg-[#128C7E]/10 text-[#128C7E] text-[15px] font-bold active:bg-[#128C7E]/20 transition-colors"
              >
                Resend Code
              </button>
            ) : (
              <p className="text-[14px] text-gray-400">
                Resend in{" "}
                <span className="font-bold text-gray-700">
                  {formatTime(countdown)}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

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
  );
}
