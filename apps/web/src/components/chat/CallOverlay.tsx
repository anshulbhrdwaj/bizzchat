import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, Minimize2, X } from 'lucide-react';
import { useCallStore } from '../../stores/callStore';
import { useAuthStore } from '../../stores/authStore';
import { useRef, useEffect, useState } from 'react';
import { hashStringToColor, getAvatarInitials } from '../../lib/utils';

export default function CallOverlay() {
  const {
    callStatus, incomingCall, localStream, remoteStreams,
    isMuted, isVideoOff, acceptCall, declineCall, endCall,
    toggleMute, toggleVideo,
  } = useCallStore();
  const { user } = useAuthStore();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    const remote = Object.values(remoteStreams)[0];
    if (remoteVideoRef.current && remote) {
      remoteVideoRef.current.srcObject = remote;
    }
  }, [remoteStreams]);

  if (callStatus === 'idle') return null;

  // ── Incoming Call ──────────────────────────────────────────
  if (callStatus === 'ringing' && incomingCall) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -80 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] w-[340px] rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}
        >
          {/* Animated gradient background */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(circle at 50% 0%, var(--accent-primary) 0%, transparent 70%)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <div className="relative p-6 flex flex-col items-center gap-4">
            {/* Avatar */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-xl"
              style={{
                background: incomingCall.callerAvatar
                  ? 'transparent'
                  : hashStringToColor(incomingCall.callerName),
                boxShadow: '0 0 0 4px var(--accent-primary), 0 0 30px rgba(62,155,247,0.4)',
              }}
            >
              {incomingCall.callerAvatar
                ? <img src={incomingCall.callerAvatar} className="w-full h-full object-cover" />
                : getAvatarInitials(incomingCall.callerName)}
            </motion.div>

            <div className="text-center">
              <p className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                {incomingCall.callerName}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Incoming {incomingCall.type.toLowerCase()} call…
              </p>
            </div>

            {/* Accept / Decline */}
            <div className="flex items-center gap-8 mt-2">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={declineCall}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ background: 'var(--accent-danger)' }}
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Decline</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={acceptCall}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ background: 'var(--accent-success)' }}
                >
                  <Phone className="w-6 h-6" />
                </button>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Accept</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Active Call ────────────────────────────────────────────
  if (callStatus === 'ongoing') {
    if (minimized) {
      return (
        <motion.div
          drag
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-24 right-4 z-[999] w-24 h-24 rounded-2xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
          style={{ border: '2px solid var(--accent-primary)' }}
        >
          {Object.values(remoteStreams)[0] ? (
            <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted={false} />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
              <Phone className="w-8 h-8 text-white" />
            </div>
          )}
          <button
            onClick={() => setMinimized(false)}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
          >
            <span className="text-white text-xs font-medium">Expand</span>
          </button>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[998] flex flex-col"
        style={{ background: '#0a0f14' }}
      >
        {/* Remote video / placeholder */}
        <div className="flex-1 relative overflow-hidden">
          {Object.values(remoteStreams)[0] ? (
            <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-bold"
                  style={{ background: hashStringToColor(incomingCall?.callerName || 'U') }}
                >
                  {getAvatarInitials(incomingCall?.callerName || 'User')}
                </div>
                <p className="text-white text-lg font-semibold">{incomingCall?.callerName || 'Call'}</p>
                <CallTimer />
              </div>
            </div>
          )}

          {/* Local PiP */}
          {localStream && (
            <motion.div
              drag
              dragMomentum={false}
              className="absolute top-4 right-4 w-28 h-40 rounded-2xl overflow-hidden shadow-xl cursor-grab active:cursor-grabbing"
              style={{ border: '2px solid rgba(255,255,255,0.2)' }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <video
                ref={localVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <VideoOff className="w-6 h-6 text-white" />
                </div>
              )}
            </motion.div>
          )}

          {/* Top controls */}
          <div className="absolute top-4 left-4 flex gap-2">
            <button
              onClick={() => setMinimized(true)}
              className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom control bar */}
        <div
          className="flex-shrink-0 flex items-center justify-center gap-4 px-6 py-8 pt-4"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
        >
          <ControlBtn
            icon={isMuted ? MicOff : Mic}
            label={isMuted ? 'Unmute' : 'Mute'}
            onClick={toggleMute}
            active={isMuted}
          />
          <ControlBtn
            icon={isVideoOff ? VideoOff : Video}
            label={isVideoOff ? 'Video off' : 'Video'}
            onClick={toggleVideo}
            active={isVideoOff}
          />
          <ControlBtn icon={Volume2} label="Speaker" onClick={() => {}} />
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{ background: 'var(--accent-danger)' }}
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
}

function ControlBtn({
  icon: Icon, label, onClick, active = false,
}: {
  icon: React.ElementType; label: string; onClick: () => void; active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
        style={{
          background: active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.15)',
        }}
      >
        <Icon className="w-5 h-5" />
      </button>
      <span className="text-[10px] text-white/70">{label}</span>
    </div>
  );
}

function CallTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return <p className="text-white/60 text-sm font-mono">{m}:{s}</p>;
}
