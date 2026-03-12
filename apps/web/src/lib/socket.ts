/// <reference types="vite/client" />
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

let socket: Socket | null = null;
let currentToken: string | null = null;

// Mock socket for Backendless Demo Mode
class MockSocket {
  connected = true;
  auth: any = {};
  listeners: Record<string, Function[]> = {};

  on(event: string, cb: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  off(event: string, cb?: Function) {
    if (!cb) this.listeners[event] = [];
    else this.listeners[event] = this.listeners[event].filter(fn => fn !== cb);
  }

  emit(event: string, data?: any) {
    if (event === 'send_message') {
      const msgId = `mock-msg-${Date.now()}`;
      
      // Simulate sending our own message
      const myMsg = {
        id: msgId,
        chatId: data.chatId,
        senderId: 'demo1',
        sender: { id: 'demo1', name: 'Demo User', avatarUrl: '' },
        type: data.type || 'TEXT',
        content: data.content,
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        statuses: [{ status: 'SENT' }, { status: 'DELIVERED' }],
        reactions: [],
      };

      setTimeout(() => {
        (this.listeners['new_message'] || []).forEach(cb => cb(myMsg));
        (this.listeners['message_status_updated'] || []).forEach(cb => cb({ messageIds: [msgId], status: 'READ', chatId: data.chatId }));

        // Simulate an automated bot reply!
        setTimeout(() => {
          const isBakery = data.chatId === 'chat2';
          const replyText = isBakery 
            ? `Thanks for your message! 🥐 We will get back to your inquiry "${data.content}" shortly.`
            : `Haha! 😂 I agree about "${data.content}". Let's catch up later.`;

          const replyMsg = {
            id: `mock-reply-${Date.now()}`,
            chatId: data.chatId,
            senderId: isBakery ? 'demo3' : 'demo2',
            sender: { 
              id: isBakery ? 'demo3' : 'demo2', 
              name: isBakery ? "Bob's Bakery" : "Alice (Friend)" 
            },
            type: 'TEXT',
            content: replyText,
            sentAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            statuses: [],
            reactions: [],
          };
          
          (this.listeners['new_message'] || []).forEach(cb => cb(replyMsg));
        }, 1200);

      }, 300);
    }
  }

  connect() {}
  disconnect() {}
}

export function getSocket(): Socket {
  if (IS_DEMO) {
    if (!socket) socket = new MockSocket() as unknown as Socket;
    return socket;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Re-attach token on every reconnect attempt
    socket.on('reconnect_attempt', () => {
      if (currentToken) socket!.auth = { token: currentToken };
    });
  }
  return socket;
}

export function connectSocket(token: string): void {
  currentToken = token;
  const s = getSocket();
  s.auth = { token };
  if (!s.connected) s.connect();
}

export function disconnectSocket(): void {
  currentToken = null;
  if (socket) {
    socket.disconnect();
    socket = null; // Reset so next connectSocket gets a fresh instance
  }
}
