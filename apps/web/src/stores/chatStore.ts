import { create } from 'zustand';
import type { Chat, Message } from '../types';

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  typingUsers: Record<string, string[]>;
  draftMessages: Record<string, string>;
  unreadCounts: Record<string, number>;

  setChats: (chats: Chat[]) => void;
  addOrUpdateChat: (chat: Chat) => void;
  setActiveChat: (id: string | null) => void;

  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, data: Partial<Message>) => void;
  removeMessage: (chatId: string, messageId: string) => void;
  updateLastMessage: (chatId: string, message: Message) => void;

  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;
  setDraft: (chatId: string, text: string) => void;
  updateUnread: (chatId: string, count: number) => void;
  clearUnread: (chatId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChatId: null,
  typingUsers: {},
  draftMessages: {},
  unreadCounts: {},

  setChats: (chats) => set({ chats }),

  addOrUpdateChat: (chat) =>
    set(state => {
      const exists = state.chats.find(c => c.id === chat.id);
      if (exists) {
        return { chats: state.chats.map(c => c.id === chat.id ? chat : c) };
      }
      return { chats: [chat, ...state.chats] };
    }),

  setActiveChat: (id) => set({ activeChatId: id }),

  addMessage: (chatId, message) =>
    set(state => {
      const chats = state.chats.map(chat => {
        if (chat.id !== chatId) return chat;
        return { ...chat, lastMessage: message, updatedAt: message.createdAt };
      });
      // Sort by updatedAt
      chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return { chats };
    }),

  updateMessage: (chatId, messageId, data) =>
    set(state => {
      const chats = state.chats.map(chat => {
        if (chat.id !== chatId) return chat;
        if (chat.lastMessage?.id === messageId) {
          return { ...chat, lastMessage: { ...chat.lastMessage, ...data } };
        }
        return chat;
      });
      return { chats };
    }),

  removeMessage: (chatId, messageId) =>
    set(state => {
      void chatId; void messageId; // handled at message query level
      return { chats: state.chats };
    }),

  updateLastMessage: (chatId, message) =>
    set(state => ({
      chats: state.chats.map(c => c.id === chatId ? { ...c, lastMessage: message } : c),
    })),

  setTyping: (chatId, userId, isTyping) =>
    set(state => {
      const current = state.typingUsers[chatId] || [];
      const updated = isTyping
        ? [...new Set([...current, userId])]
        : current.filter(id => id !== userId);
      return { typingUsers: { ...state.typingUsers, [chatId]: updated } };
    }),

  setDraft: (chatId, text) =>
    set(state => ({ draftMessages: { ...state.draftMessages, [chatId]: text } })),

  updateUnread: (chatId, count) =>
    set(state => ({ unreadCounts: { ...state.unreadCounts, [chatId]: count } })),

  clearUnread: (chatId) =>
    set(state => ({ unreadCounts: { ...state.unreadCounts, [chatId]: 0 } })),
}));
