import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-2 mb-1"
    >
      <div
        className="flex items-center gap-1 px-3 py-2 rounded-2xl"
        style={{ background: 'var(--bg-message-in)' }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="typing-dot w-2 h-2 rounded-full animate-bounce-dot"
            style={{
              background: 'var(--text-secondary)',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
