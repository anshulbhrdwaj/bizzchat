import { io, Socket } from 'socket.io-client'
import { useChatStore } from '@/stores/chatStore'
import { usePresenceStore } from '@/stores/presenceStore'
import { useOrderStore } from '@/stores/orderStore'

let socket: Socket | null = null

export function initSocket(token: string) {
  if (socket?.connected) return

  socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
  })

  socket.on('message:new', (msg) => {
    useChatStore.getState().addMessage(msg.chatId, msg)
    useChatStore.getState().updateChatPreview(msg.chatId, msg)
  })

  socket.on('message:read', ({ messageId, readAt }) => {
    // Update all messages with this id across chats
    const state = useChatStore.getState()
    Object.keys(state.messages).forEach(chatId => {
      state.updateMessage(chatId, messageId, { readAt })
    })
  })

  socket.on('message:deleted', ({ messageId }) => {
    const state = useChatStore.getState()
    Object.keys(state.messages).forEach(chatId => {
      state.updateMessage(chatId, messageId, { isDeleted: true })
    })
  })

  socket.on('typing:indicator', ({ chatId, userId, isTyping }) => {
    useChatStore.getState().setTyping(chatId, userId, isTyping)
  })

  socket.on('presence:update', ({ userId, isOnline, lastSeen }) => {
    usePresenceStore.getState().updatePresence(userId, isOnline, lastSeen)
  })

  socket.on('order:new', (order) => {
    useOrderStore.getState().addOrder(order)
  })

  socket.on('order:status', ({ orderId, status }) => {
    useOrderStore.getState().updateOrderStatus(orderId, status)
  })

  socket.on('chat:updated', ({ chatId, lastMessage }) => {
    useChatStore.getState().updateChatPreview(chatId, lastMessage)
  })

  socket.on('shared_cart:received', (sharedCart) => {
    // Notify the user about new shared cart (store can add to a list or show notification)
    useOrderStore.getState().addSharedCart?.(sharedCart)
  })

  socket.on('message:delivered', ({ messageId, deliveredAt }) => {
    const state = useChatStore.getState()
    Object.keys(state.messages).forEach(chatId => {
      state.updateMessage(chatId, messageId, { deliveredAt })
    })
  })
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
