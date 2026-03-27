import { create } from 'zustand'
import type { Chat, Message } from '@bizchat/shared'

interface ChatStore {
  chats: Chat[]
  activeChat: Chat | null
  messages: Record<string, Message[]>
  typingUsers: Record<string, string[]>
  setChats: (chats: Chat[]) => void
  setActiveChat: (chat: Chat | null) => void
  addMessage: (chatId: string, msg: Message) => void
  updateMessage: (chatId: string, msgId: string, updates: Partial<Message>) => void
  setMessages: (chatId: string, messages: Message[]) => void
  appendMessages: (chatId: string, messages: Message[]) => void
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void
  updateChatPreview: (chatId: string, lastMsg: Message) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  activeChat: null,
  messages: {},
  typingUsers: {},

  setChats: (chats) => set({ chats }),

  setActiveChat: (chat) => set({ activeChat: chat }),

  addMessage: (chatId, msg) => set(state => ({
    messages: {
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), msg],
    },
  })),

  updateMessage: (chatId, msgId, updates) => set(state => ({
    messages: {
      ...state.messages,
      [chatId]: (state.messages[chatId] || []).map(m =>
        m.id === msgId ? { ...m, ...updates } : m
      ),
    },
  })),

  setMessages: (chatId, messages) => set(state => ({
    messages: { ...state.messages, [chatId]: messages },
  })),

  appendMessages: (chatId, messages) => set(state => ({
    messages: {
      ...state.messages,
      [chatId]: [...messages, ...(state.messages[chatId] || [])],
    },
  })),

  setTyping: (chatId, userId, isTyping) => set(state => {
    const current = state.typingUsers[chatId] || []
    const updated = isTyping
      ? [...new Set([...current, userId])]
      : current.filter(id => id !== userId)
    return { typingUsers: { ...state.typingUsers, [chatId]: updated } }
  }),

  updateChatPreview: (chatId, lastMsg) => set(state => ({
    chats: state.chats.map(c =>
      c.id === chatId ? { ...c, lastMessage: lastMsg, updatedAt: lastMsg.createdAt } : c
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  })),
}))
