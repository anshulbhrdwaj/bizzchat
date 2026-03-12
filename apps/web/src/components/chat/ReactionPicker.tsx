import { motion, AnimatePresence } from 'framer-motion';
import { Smile } from 'lucide-react';
import { useState } from 'react';
import { getSocket } from '../../lib/socket';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface Props {
  messageId: string;
  chatId: string;
  isOwn: boolean;
  onClose: () => void;
}

export default function ReactionPicker({ messageId, chatId, isOwn, onClose }: Props) {
  const [expanded, setExpanded] = useState(false);

  const sendReaction = (emoji: string) => {
    const socket = getSocket();
    socket.emit('add_reaction', { messageId, emoji, chatId });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: 8 }}
      transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
      className="flex items-center gap-1 px-2 py-1.5 rounded-full z-50 shadow-lg"
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
      }}
    >
      {QUICK_REACTIONS.map((emoji, i) => (
        <motion.button
          key={emoji}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03, ease: [0.34, 1.56, 0.64, 1] }}
          onClick={() => sendReaction(emoji)}
          className="text-lg hover:scale-125 transition-transform leading-none p-0.5 rounded-full"
          title={emoji}
        >
          {emoji}
        </motion.button>
      ))}
      <button
        onClick={() => setExpanded(!expanded)}
        className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
        title="More reactions"
      >
        <Smile className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
