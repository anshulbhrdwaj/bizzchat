import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import {
  MessageSquare, Phone, Users, Settings, Briefcase, LogOut, Moon, Sun
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useChatStore } from '../stores/chatStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import type { Chat, Message } from '../types';
import ChatListSidebar from '../components/chat/ChatListSidebar';
import { getAvatarInitials, hashStringToColor } from '../lib/utils';

const NAV_ITEMS = [
  { icon: MessageSquare, path: '/', label: 'Chats', id: 'chats' },
  { icon: Users, path: '/contacts', label: 'Contacts', id: 'contacts' },
  { icon: Phone, path: '/calls', label: 'Calls', id: 'calls' },
  { icon: Briefcase, path: '/business', label: 'Business', id: 'business' },
  { icon: Settings, path: '/settings', label: 'Settings', id: 'settings' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, isMobile } = useUIStore();
  const { setChats, addMessage, setTyping, addOrUpdateChat } = useChatStore();

  const pathname = location.pathname;

  // Load chats
  const { data: chats } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const { data } = await api.get('/chats');
      return data as Chat[];
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (chats) setChats(chats);
  }, [chats, setChats]);

  // Socket events
  useEffect(() => {
    const socket = getSocket();

    socket.on('new_message', (message: Message) => {
      addMessage(message.chatId, message);
    });

    socket.on('user_typing', ({ chatId, userId }: { chatId: string; userId: string }) => {
      setTyping(chatId, userId, true);
    });

    socket.on('user_stop_typing', ({ chatId, userId }: { chatId: string; userId: string }) => {
      setTyping(chatId, userId, false);
    });

    socket.on('chat_updated', (chat: Chat) => {
      addOrUpdateChat(chat);
    });

    // Heartbeat
    const heartbeat = setInterval(() => socket.emit('heartbeat'), 25000);

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('chat_updated');
      clearInterval(heartbeat);
    };
  }, [addMessage, setTyping, addOrUpdateChat]);

  // Compute active nav reactively from location
  const activeNav = pathname.startsWith('/chat') || pathname === '/' ? 'chats'
    : pathname.startsWith('/contact') ? 'contacts'
    : pathname.startsWith('/call') ? 'calls'
    : pathname.startsWith('/business') ? 'business'
    : pathname.startsWith('/settings') ? 'settings'
    : 'chats';

  // On mobile: show sidebar only at root "/" (chats list)
  // All other pages (incl. chat/:id, contacts, calls, etc.) show full-screen Outlet
  const showSidebar = !isMobile || pathname === '/';
  const showOutlet = !isMobile || pathname !== '/';

  return (
    <div
      className={isMobile ? 'flex flex-col h-[100dvh]' : 'flex h-full'}
      style={{ overflow: 'hidden', position: 'relative', zIndex: 10 }}
    >
      {/* Desktop Navigation Rail */}
      {!isMobile && (
        <nav
          className="flex-shrink-0 flex flex-col items-center py-4 gap-1 border-r"
          style={{
            width: 'var(--nav-rail-width)',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--glass-border)',
          }}
        >
          {/* Logo */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <span className="text-white font-bold text-sm font-display">N</span>
          </div>

          {/* Nav items */}
          <div className="flex flex-col items-center gap-1 flex-1 w-full px-2">
            {NAV_ITEMS.map(({ icon: Icon, path, label, id }) => (
              <button
                key={id}
                onClick={() => navigate(path)}
                title={label}
                aria-label={label}
                className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 mx-auto"
                style={{
                  background: activeNav === id ? 'var(--bg-selected)' : 'transparent',
                  color: activeNav === id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>

          {/* Bottom — theme + avatar + logout */}
          <div className="flex flex-col items-center gap-3 mt-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
              style={{ color: 'var(--text-secondary)' }}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={logout}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
              style={{ color: 'var(--text-tertiary)' }}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Avatar */}
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold relative transition-transform hover:scale-105 mt-2"
              style={{ background: user?.avatarUrl ? 'transparent' : hashStringToColor(user?.name || 'U') }}
              title="Profile"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getAvatarInitials(user?.name || 'U')
              )}
              <div
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                style={{ background: 'var(--accent-success)', borderColor: 'var(--bg-secondary)' }}
              />
            </button>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Chat List Sidebar — desktop always, mobile only at root "/" */}
        {showSidebar && (
          <div
            className="flex-shrink-0 border-r flex flex-col h-full"
            style={{
              width: isMobile ? '100%' : 'var(--sidebar-width)',
              background: 'var(--bg-secondary)',
              borderColor: 'var(--glass-border)',
            }}
          >
            <ChatListSidebar />
          </div>
        )}

        {/* Outlet — desktop always, mobile for all routes except root "/" */}
        {showOutlet && (
          <div className="flex-1 flex flex-col min-w-0 h-full" style={{ background: 'var(--bg-primary)' }}>
            <Outlet />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation — only visible on root + non-chat pages */}
      {isMobile && !pathname.startsWith('/chat/') && (
        <nav
          className="flex-shrink-0 flex items-center justify-around px-2 pt-2 border-t w-full"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--glass-border)',
            paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
          }}
        >
          {NAV_ITEMS.map(({ icon: Icon, path, label, id }) => (
            <button
              key={id}
              onClick={() => navigate(path)}
              aria-label={label}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1"
              style={{ color: activeNav === id ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
            >
              <div
                className="w-12 h-8 rounded-full flex items-center justify-center transition-all"
                style={{ background: activeNav === id ? 'var(--bg-selected)' : 'transparent' }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
