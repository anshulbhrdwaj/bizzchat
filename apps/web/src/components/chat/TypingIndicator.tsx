/** TypingIndicator — WhatsApp-style 3 bouncing dots in a white bubble */
export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-1">
      <div className="bg-white px-4 py-3 rounded-[7.5px] rounded-tl-none inline-flex items-center gap-1.5 shadow-sm">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-[7px] h-[7px] rounded-full bg-[#8696A0]"
            style={{
              animation: `wa-typing 1.4s ease-in-out infinite`,
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes wa-typing {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
