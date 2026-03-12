import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { useCallStore } from './stores/callStore';
import { connectSocket, getSocket } from './lib/socket';

// Pages
import PhonePage from './pages/auth/PhonePage';
import OtpPage from './pages/auth/OtpPage';
import ProfileSetupPage from './pages/auth/ProfileSetupPage';
import MainLayout from './pages/MainLayout';
import ChatPage from './pages/ChatPage';
import ContactsPage from './pages/ContactsPage';
import CallsPage from './pages/CallsPage';
import SettingsPage from './pages/SettingsPage';
import BusinessPage from './pages/BusinessPage';
import CallOverlay from './components/chat/CallOverlay';
import { AnimatePresence } from 'framer-motion';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/auth/phone" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { setTheme, theme, setIsMobile } = useUIStore();
  const { setIncomingCall } = useCallStore();

  useEffect(() => { setTheme(theme); }, []);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connectSocket(accessToken);
    }
  }, [isAuthenticated, accessToken]);

  // Wire call socket events globally
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();

    socket.on('call_incoming', (data: { callId: string; callerId: string; callerName?: string; callerAvatar?: string; type: 'VOICE' | 'VIDEO' }) => {
      setIncomingCall({
        callId: data.callId,
        callerId: data.callerId,
        callerName: data.callerName || 'Unknown',
        callerAvatar: data.callerAvatar,
        type: data.type,
      });
    });

    socket.on('call_ended', () => {
      useCallStore.getState().endCall();
    });

    return () => {
      socket.off('call_incoming');
      socket.off('call_ended');
    };
  }, [isAuthenticated, setIncomingCall]);

  // Mobile detection
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [setIsMobile]);

  return (
    <BrowserRouter>
      <div className="mesh-bg" />

      {/* Global Call Overlay — always rendered on top */}
      <AnimatePresence>
        <CallOverlay />
      </AnimatePresence>

      <Routes>
        {/* Auth routes */}
        <Route path="/auth/phone" element={<PublicRoute><PhonePage /></PublicRoute>} />
        <Route path="/auth/otp" element={<PublicRoute><OtpPage /></PublicRoute>} />
        <Route path="/auth/profile" element={<ProfileSetupPage />} />

        {/* Main app */}
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={
            <div className="flex-1 flex flex-col items-center justify-center gap-3"
              style={{ color: 'var(--text-tertiary)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--bg-tertiary)' }}>
                <span className="text-3xl">💬</span>
              </div>
              <p className="text-sm">Select a chat to start messaging</p>
            </div>
          } />
          <Route path="chat/:chatId" element={<ChatPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="calls" element={<CallsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="business/*" element={<BusinessPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
