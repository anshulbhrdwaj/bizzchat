/** TypingIndicator — 3 dots, 8px, staggered animation per CLAUDE.md section 9 */
export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-md inline-flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: 'var(--color-primary)',
              animation: `typing-pulse 1.4s ease-in-out infinite`,
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes typing-pulse {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
