import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useCallback, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, Video, MoreVertical, Info } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { useUIStore } from '../stores/uiStore';
import { useCallStore } from '../stores/callStore';
import { getSocket } from '../lib/socket';
import { getAvatarInitials, hashStringToColor } from '../lib/utils';
import type { Message, Chat } from '../types';
import MessageBubble from '../components/chat/MessageBubble';
import MessageInput from '../components/chat/MessageInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import UserInfoPanel from '../components/chat/UserInfoPanel';

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { typingUsers, addMessage } = useChatStore();
  const { isMobile } = useUIStore();
  const { initiateCall } = useCallStore();
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch chat info
  const { data: chat } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const { data } = await api.get(`/chats/${chatId}`);
      return data as Chat;
    },
    enabled: !!chatId,
  });

  // Fetch messages (infinite)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['messages', chatId],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const url = `/messages/${chatId}${pageParam ? `?cursor=${pageParam}` : ''}`;
      const { data } = await api.get(url);
      return data as { messages: Message[]; nextCursor: string | null };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor || undefined,
    enabled: !!chatId,
  });

  const messages = data?.pages.flatMap(p => p.messages) || [];
  const typing = typingUsers[chatId!] || [];
  const otherUser = chat?.type === 'DIRECT' ? chat?.otherUser : null;
  const groupInfo = chat?.type === 'GROUP' ? chat?.group : null;
  const displayName = groupInfo?.name || otherUser?.name || '...';
  const avatarUrl = groupInfo?.avatarUrl || otherUser?.avatarUrl;
  const isOnline = otherUser?.isOnline;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Socket: join chat + real-time updates
  useEffect(() => {
    if (!chatId) return;
    const socket = getSocket();
    socket.emit('join_chat', chatId);

    socket.on('new_message', (msg: Message) => {
      if (msg.chatId !== chatId) return;
      queryClient.setQueryData(['messages', chatId], (old: any) => {
        if (!old) return old;
        const pages = [...old.pages];
        pages[pages.length - 1] = {
          ...pages[pages.length - 1],
          messages: [...pages[pages.length - 1].messages, msg],
        };
        return { ...old, pages };
      });
      socket.emit('message_read', [msg.id]);
    });

    socket.on('message_status_updated', ({ messageIds, status }: { messageIds: string[]; status: string; chatId: string }) => {
      queryClient.setQueryData(['messages', chatId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: page.messages.map((m: Message) =>
              messageIds.includes(m.id)
                ? { ...m, statuses: [{ messageId: m.id, userId: '', status, id: '' }] }
                : m
            ),
          })),
        };
      });
    });

    socket.on('reaction_updated', ({ messageId, reactions }: { messageId: string; reactions: any[] }) => {
      queryClient.setQueryData(['messages', chatId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: page.messages.map((m: Message) =>
              m.id === messageId ? { ...m, reactions } : m
            ),
          })),
        };
      });
    });

    socket.on('message_updated', (updatedMsg: Message) => {
      if (updatedMsg.chatId !== chatId) return;
      queryClient.setQueryData(['messages', chatId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: page.messages.map((m: Message) =>
              m.id === updatedMsg.id ? updatedMsg : m
            ),
          })),
        };
      });
    });

    return () => {
      socket.emit('leave_chat', chatId);
      socket.off('new_message');
      socket.off('message_status_updated');
      socket.off('reaction_updated');
      socket.off('message_updated');
    };
  }, [chatId, queryClient]);

  // Send message
  const sendMessage = useMutation({
    mutationFn: async ({ content, replyToId }: { content: string; replyToId?: string }) => {
      const socket = getSocket();
      socket.emit('send_message', {
        chatId,
        type: 'TEXT',
        content,
        replyToId,
        tempId: `temp-${Date.now()}`,
      });
    },
  });

  const handleSend = useCallback((content: string, replyToId?: string) => {
    if (!content.trim()) return;
    sendMessage.mutate({ content, replyToId });
    setReplyTo(null);
  }, [sendMessage]);

  const handleCall = (type: 'VOICE' | 'VIDEO') => {
    if (otherUser) initiateCall(otherUser.id, type);
  };

  return (
    <div className="flex h-full w-full relative overflow-hidden">
      <div className="flex flex-col h-full flex-1 min-w-0">
        {/* Chat Header */}
        <div
          className="flex items-center gap-3 px-4 pb-3 border-b flex-shrink-0"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--glass-border)',
            paddingTop: 'calc(12px + env(safe-area-inset-top))',
          }}
        >
          {isMobile && (
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Avatar */}
          <div
            onClick={() => {
              if (chat?.type === 'DIRECT' && otherUser) setShowInfo(true);
            }}
            className="relative flex-shrink-0 cursor-pointer hover:opacity-90"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold overflow-hidden"
              style={{ background: avatarUrl ? 'transparent' : hashStringToColor(displayName) }}
            >
              {avatarUrl
                ? <img src={avatarUrl} className="w-full h-full object-cover" />
                : getAvatarInitials(displayName)
              }
            </div>
            {isOnline && (
              <div
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 z-10"
                style={{ background: 'var(--accent-success)', borderColor: 'var(--bg-secondary)' }}
              />
            )}
          </div>

          <div 
            onClick={() => {
              if (chat?.type === 'DIRECT' && otherUser) setShowInfo(true);
            }}
            className="flex-1 min-w-0 cursor-pointer"
          >
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {displayName}
            </p>
            <p className="text-xs" style={{ color: isOnline ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
              {typing.length > 0
                ? 'typing…'
                : isOnline
                ? 'online'
                : chat?.type === 'GROUP'
                ? `${chat.participants?.length || 0} members`
                : otherUser?.lastSeen
                ? `last seen recently`
                : 'offline'}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {chat?.type === 'DIRECT' && (
              <>
                <button
                  onClick={() => handleCall('VOICE')}
                  className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Voice call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCall('VIDEO')}
                  className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Video call"
                >
                  <Video className="w-4 h-4" />
                </button>
              </>
            )}
            <button 
              onClick={() => {
                if (chat?.type === 'DIRECT' && otherUser) setShowInfo(!showInfo);
              }} 
              className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors" 
              style={{ color: showInfo ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
              disabled={chat?.type === 'GROUP'} 
              title="Chat Info"
            >
              <Info className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
          style={{ background: 'var(--bg-primary)' }}
        >
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full text-xs py-2 text-center transition-colors"
              style={{ color: 'var(--accent-primary)' }}
            >
              {isFetchingNextPage ? 'Loading…' : 'Load older messages'}
            </button>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === user?.id}
                prevMessage={messages[i - 1]}
                showSenderName={chat?.type === 'GROUP'}
                onReply={(m) => setReplyTo(m)}
              />
            ))}
          </AnimatePresence>

          {typing.length > 0 && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex-shrink-0">
          <MessageInput
            chatId={chatId!}
            onSend={handleSend}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        </div>
      </div>
      
      {/* Desktop Info Panel */}
      <AnimatePresence>
        {showInfo && otherUser && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full hidden md:flex flex-col border-l flex-shrink-0 bg-[var(--bg-secondary)]"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <UserInfoPanel userId={otherUser.id} onClose={() => setShowInfo(false)} className="flex-1 w-full" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile Info Overlay */}
      <AnimatePresence>
        {showInfo && otherUser && isMobile && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 flex justify-end"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowInfo(false); }}
          >
            <UserInfoPanel userId={otherUser.id} onClose={() => setShowInfo(false)} className="w-full max-w-sm h-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
