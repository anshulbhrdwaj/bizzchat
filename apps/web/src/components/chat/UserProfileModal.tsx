import { motion } from 'framer-motion';
import UserInfoPanel from './UserInfoPanel';

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60]"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        className="glass-panel w-full max-w-md mx-4 rounded-2xl overflow-hidden h-[85vh] md:h-[600px] flex flex-col"
      >
        <UserInfoPanel 
          userId={userId} 
          onClose={onClose} 
          className="w-full h-full border-none" 
        />
      </motion.div>
    </div>
  );
}
