/// <reference types="vite/client" />
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Demo Mode Mock Interceptor
if (IS_DEMO) {
  api.interceptors.request.use((config) => {
    const url = config.url || '';
    
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => {
        let mockData: any = {};
        
        if (url.includes('/auth/send-otp')) {
          mockData = { success: true };
        } else if (url.includes('/auth/verify-otp')) {
          mockData = { user: { id: 'demo1', name: 'Demo User', phone: '+1234567890' }, tokens: { accessToken: 'demo_token', refreshToken: 'demo_token' } };
        } else if (url.match(/\/users\/me$/)) {
          mockData = { id: 'demo1', name: 'Demo User', phone: '+1234567890', username: 'demo', isVerifiedBusiness: false, about: 'Using BizChat!' };
        } else if (url.includes('/users/contacts/list')) {
          mockData = [
            { id: 'demo2', name: 'Alice (Friend)', phone: '+9876543210', isOnline: true, about: 'Available' },
            { id: 'demo3', name: 'Bob\'s Bakery', phone: '+1112223333', isVerifiedBusiness: true, isOnline: false }
          ];
        } else if (url.match(/\/business\/user\/demo3\/public/)) {
          mockData = { businessName: 'Bob\'s Bakery', category: 'Food & Beverage', description: 'Fresh pastries daily!', address: '123 Main St', email: 'hello@bobsbakery.com', website: 'bobsbakery.com', products: [{ id: 'p1', name: 'Croissant', price: 3.50, currency: 'USD' }] };
        } else if (url.match(/\/users\/demo2/)) {
          mockData = { id: 'demo2', name: 'Alice (Friend)', phone: '+9876543210', isOnline: true, about: 'Available' };
        } else if (url.match(/\/users\/demo3/)) {
          mockData = { id: 'demo3', name: 'Bob\'s Bakery', phone: '+1112223333', isVerifiedBusiness: true, isOnline: false };
        } else if (url.match(/\/chats$/) && config.method?.toLowerCase() === 'get') {
          mockData = [
            { id: 'chat1', type: 'DIRECT', otherUser: { id: 'demo2', name: 'Alice (Friend)', avatarUrl: '', isOnline: true }, lastMessage: { content: 'Hey, are we still on?', type: 'TEXT', sentAt: new Date().toISOString(), createdAt: new Date().toISOString() }, unreadCount: 0, updatedAt: new Date().toISOString() },
            { id: 'chat2', type: 'DIRECT', otherUser: { id: 'demo3', name: 'Bob\'s Bakery', avatarUrl: '', isVerifiedBusiness: true, isOnline: false }, lastMessage: { content: 'Your order is ready!', type: 'TEXT', sentAt: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString() }, unreadCount: 2, updatedAt: new Date(Date.now() - 86400000).toISOString() }
          ];
        } else if (url.match(/\/chats\/(chat1|chat2)$/)) {
          const isChat1 = url.includes('chat1');
          mockData = {
            id: isChat1 ? 'chat1' : 'chat2',
            type: 'DIRECT',
            updatedAt: new Date().toISOString(),
            unreadCount: 0,
            otherUser: isChat1 
              ? { id: 'demo2', name: 'Alice (Friend)', isOnline: true }
              : { id: 'demo3', name: 'Bob\'s Bakery', isVerifiedBusiness: true }
          };
        } else if (url.match(/\/messages\/(chat1|chat2)/)) {
          const isChat1 = url.includes('chat1');
          mockData = {
            messages: isChat1 
              ? [{ id: 'm1', chatId: 'chat1', senderId: 'demo2', sender: { id: 'demo2', name: 'Alice (Friend)' }, content: 'Hey, are we still on?', type: 'TEXT', sentAt: new Date().toISOString(), createdAt: new Date().toISOString(), statuses: [], reactions: [] }]
              : [{ id: 'm2', chatId: 'chat2', senderId: 'demo3', sender: { id: 'demo3', name: 'Bob\'s Bakery' }, content: 'Your order is ready!', type: 'TEXT', sentAt: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString(), statuses: [], reactions: [] }],
            nextCursor: null
          };
        } else if (url.includes('/business/profile')) {
          mockData = { businessName: 'BizChat Demo', category: 'Technology', description: 'Standalone Demo Mode', products: [] };
        } else if (url.includes('/calls/history')) {
          mockData = [
            {
              id: 'call1',
              type: 'VOICE',
              status: 'ENDED',
              startedAt: new Date(Date.now() - 3600000).toISOString(),
              duration: 125,
              isOutgoing: false,
              participants: [
                { userId: 'demo2', user: { id: 'demo2', name: 'Alice (Friend)' } }
              ]
            },
            {
              id: 'call2',
              type: 'VIDEO',
              status: 'MISSED',
              startedAt: new Date(Date.now() - 86400000).toISOString(),
              isOutgoing: true,
              participants: [
                { userId: 'demo3', user: { id: 'demo3', name: 'Bob\'s Bakery' } }
              ]
            }
          ];
        } else if (url.includes('/settings')) {
          mockData = {};
        } else if (url.includes('/chats/direct')) {
           // Simulate starting a chat
           const userId = JSON.parse(config.data || '{}').userId;
           mockData = { id: userId === 'demo2' ? 'chat1' : 'chat2' };
        }

        // Trick axios into resolving early by attaching an adapter that instantly returns data
        config.adapter = () => {
          return Promise.resolve({
            data: mockData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config,
            request: {}
          });
        };
        resolve(config);
      }, 500); // 500ms realistic delay
    });
  });
}

// Attach token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401 and update authStore
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const newToken = data.accessToken;
          localStorage.setItem('accessToken', newToken);
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          // Update accessToken in Zustand authStore without triggering logout
          try {
            const { useAuthStore } = await import('../stores/authStore');
            useAuthStore.setState({ accessToken: newToken });
          } catch { /* ignore if store unavailable */ }
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // Redirect to login
          window.location.href = '/auth/phone';
        }
      } else {
        window.location.href = '/auth/phone';
      }
    }
    return Promise.reject(error);
  }
);
