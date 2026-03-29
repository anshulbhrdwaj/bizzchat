import { io, Socket } from "socket.io-client";
import { useChatStore } from "@/stores/chatStore";
import { usePresenceStore } from "@/stores/presenceStore";
import { useAuthStore } from "@/stores/authStore";
import { useOrderStore } from "@/stores/orderStore";

let socket: Socket | null = null;

export function initSocket(token: string) {
  if (socket) return;

  socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
  });

  socket.on("message:new", (msg) => {
    const store = useChatStore.getState();
    const myId = useAuthStore.getState().user?.id;

    // Optimistic reconciliation
    if (msg.senderId === myId) {
      const chatMsgs = store.messages[msg.chatId] || [];
      const tempIdFromMsg = (msg as any).metadata?.tempId;
      
      let optimistic: any = tempIdFromMsg 
        ? chatMsgs.find((m: any) => (m as any).tempId === tempIdFromMsg)
        : null;
        
      if (!optimistic) {
        optimistic = chatMsgs.find(
          (m: any) => (m as any).isOptimistic && (m as any).tempId && m.content === msg.content,
        );
      }

      if (optimistic && optimistic.tempId) {
        store.confirmOptimisticMessage(msg.chatId, optimistic.tempId, msg);
        store.updateChatPreview(msg.chatId, msg);
        return; // Don't add duplicate
      }
    } else {
      // It's from someone else. Acknowledge delivery to server.
      if (socket?.connected && !msg.deliveredAt) {
        socket.emit("message:delivered", { chatId: msg.chatId, messageId: msg.id });
      }
    }

    store.addMessage(msg.chatId, msg);
    store.updateChatPreview(msg.chatId, msg);
  });

  socket.on("message:read", ({ messageId, readAt, deliveredAt }) => {
    // Update all messages with this id across chats
    const state = useChatStore.getState();
    Object.keys(state.messages).forEach((chatId) => {
      // @ts-ignore
      state.updateMessage(chatId, messageId, { readAt, deliveredAt, status: 'READ' });
    });
  });

  socket.on("message:deleted", ({ messageId }) => {
    const state = useChatStore.getState();
    Object.keys(state.messages).forEach((chatId) => {
      state.updateMessage(chatId, messageId, { isDeleted: true });
    });
  });

  socket.on("typing:indicator", ({ chatId, userId, isTyping }) => {
    useChatStore.getState().setTyping(chatId, userId, isTyping);
  });

  socket.on("presence:update", ({ userId, isOnline, lastSeen }) => {
    usePresenceStore.getState().updatePresence(userId, isOnline, lastSeen);
  });

  socket.on("order:new", (order) => {
    useOrderStore.getState().addOrder(order);
  });

  socket.on("order:status", ({ orderId, status }) => {
    useOrderStore.getState().updateOrderStatus(orderId, status);
  });

  socket.on("chat:updated", ({ chatId, lastMessage, unreadCount }) => {
    useChatStore.getState().updateChatPreview(chatId, lastMessage, unreadCount);
  });

  socket.on("shared_cart:received", (sharedCart) => {
    // Notify the user about new shared cart (store can add to a list or show notification)
    const store = useOrderStore.getState() as any;
    store.addSharedCart?.(sharedCart);
  });

  socket.on("message:delivered", ({ messageId, deliveredAt }) => {
    const state = useChatStore.getState();
    Object.keys(state.messages).forEach((chatId) => {
      // @ts-ignore
      state.updateMessage(chatId, messageId, { deliveredAt, status: 'DELIVERED' });
    });
  });

  // Presence ping every 30 seconds
  setInterval(() => {
    if (socket?.connected) {
      socket.emit('presence:ping');
    }
  }, 30000);
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
