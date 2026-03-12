// Shared TypeScript types used across the frontend

export interface User {
  id: string;
  phone: string;
  name: string;
  username?: string;
  about?: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen: string;
  isVerifiedBusiness: boolean;
  isNewUser?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  sender: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  type: MessageType;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  mediaSize?: number;
  mediaDuration?: number;
  fileName?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  replyToId?: string;
  replyTo?: Partial<Message> & { sender: Pick<User, 'id' | 'name'> };
  reactions: Reaction[];
  statuses: MessageStatus[];
  isEdited: boolean;
  isDeleted: boolean;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  tempId?: string;
}

export type MessageType =
  | 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'VOICE' | 'VIDEO_NOTE'
  | 'DOCUMENT' | 'STICKER' | 'GIF' | 'LOCATION' | 'LIVE_LOCATION'
  | 'CONTACT_CARD' | 'SYSTEM' | 'INTERACTIVE_BUTTONS' | 'INTERACTIVE_LIST'
  | 'TEMPLATE' | 'PRODUCT' | 'ORDER';

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
}

export interface MessageStatus {
  id: string;
  messageId: string;
  userId: string;
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
}

export interface Chat {
  id: string;
  type: 'DIRECT' | 'GROUP' | 'BROADCAST' | 'CHANNEL';
  updatedAt: string;
  otherUser?: User;
  group?: Group;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  mutedUntil?: string;
  wallpaper?: string;
  lastReadAt?: string;
}

export interface Group {
  id: string;
  chatId: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  inviteLink?: string;
  memberCount?: number;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  userId: string;
  user: User;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface Call {
  id: string;
  type: 'VOICE' | 'VIDEO' | 'GROUP_VOICE' | 'GROUP_VIDEO';
  status: 'RINGING' | 'ONGOING' | 'ENDED' | 'MISSED' | 'DECLINED';
  chatId?: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  participants: { userId: string; user: User }[];
}

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  category: string;
  description?: string;
  email?: string;
  website?: string;
  address?: string;
  workingHours?: Record<string, { open: string; close: string }>;
  greetingMsg?: string;
  awayMsg?: string;
  products: Product[];
  quickReplies: QuickReply[];
  labels: Label[];
  templates: MessageTemplate[];
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  price?: number;
  currency: string;
  imageUrl?: string;
  link?: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface QuickReply {
  id: string;
  shortcut: string;
  message: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  body: string;
  status: string;
}
