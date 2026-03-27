// ─── Enums ───────────────────────────────────────────────

export type CartStatus = 'ACTIVE' | 'CHECKED_OUT'
export type SharedCartStatus = 'PENDING' | 'VIEWED' | 'ADDED_TO_CART' | 'ORDERED' | 'EXPIRED'
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
export type MessageType = 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'PRODUCT_CARD' | 'SHARED_CART' | 'ORDER_UPDATE'
export type DeletedFor = 'SELF' | 'EVERYONE'

// ─── User ────────────────────────────────────────────────

export interface User {
  id: string
  phone: string
  name: string | null
  avatarUrl: string | null
  isOnline: boolean
  lastSeen: string
  createdAt: string
  updatedAt: string
}

// ─── Business Profile ────────────────────────────────────

export interface BusinessProfile {
  id: string
  userId: string
  name: string
  logoUrl: string | null
  coverUrl: string | null
  category: string | null
  description: string | null
  address: string | null
  website: string | null
  email: string | null
  createdAt: string
  updatedAt: string
}

// ─── Catalog ─────────────────────────────────────────────

export interface CatalogCollection {
  id: string
  businessId: string
  name: string
  description: string | null
  coverUrl: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  productCount?: number
}

export interface Product {
  id: string
  businessId: string
  name: string
  description: string | null
  basePrice: string // Decimal as string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  images?: ProductImage[]
  variantGroups?: VariantGroup[]
}

export interface ProductImage {
  id: string
  productId: string
  url: string
  sortOrder: number
  createdAt: string
}

export interface VariantGroup {
  id: string
  productId: string
  name: string
  sortOrder: number
  createdAt: string
  values: VariantValue[]
}

export interface VariantValue {
  id: string
  groupId: string
  label: string
  priceOverride: string | null
  stock: number
  sku: string | null
  imageUrl: string | null
  sortOrder: number
  createdAt: string
}

// ─── Cart ────────────────────────────────────────────────

export interface Cart {
  id: string
  userId: string
  businessId: string
  status: CartStatus
  createdAt: string
  updatedAt: string
  items: CartItem[]
}

export interface CartItem {
  id: string
  cartId: string
  productId: string
  variantId: string | null
  quantity: number
  createdAt: string
  updatedAt: string
  product?: Product
  variant?: VariantValue
}

// ─── Shared Cart ─────────────────────────────────────────

export interface SharedCart {
  id: string
  businessId: string
  recipientId: string
  note: string | null
  expiresAt: string | null
  status: SharedCartStatus
  chatId: string | null
  messageId: string | null
  createdAt: string
  updatedAt: string
  items: SharedCartItem[]
  business?: BusinessProfile
}

export interface SharedCartItem {
  id: string
  sharedCartId: string
  productId: string
  variantId: string | null
  quantity: number
  note: string | null
  createdAt: string
  product?: Product
  variant?: VariantValue
}

// ─── Orders ──────────────────────────────────────────────

export interface Order {
  id: string
  orderNumber: string
  userId: string
  businessId: string
  cartId: string | null
  status: OrderStatus
  subtotal: string
  total: string
  deliveryAddress: string | null
  customerNote: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  statusHistory?: OrderStatusHistory[]
  business?: BusinessProfile
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  variantId: string | null
  productName: string
  variantLabel: string | null
  unitPrice: string
  quantity: number
  lineTotal: string
  imageUrl: string | null
}

export interface OrderStatusHistory {
  id: string
  orderId: string
  status: OrderStatus
  note: string | null
  changedBy: string
  createdAt: string
}

// ─── Chat ────────────────────────────────────────────────

export interface Chat {
  id: string
  createdAt: string
  updatedAt: string
  members?: ChatMember[]
  lastMessage?: Message
  unreadCount?: number
}

export interface ChatMember {
  chatId: string
  userId: string
  joinedAt: string
  lastRead: string
  user?: User
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  type: MessageType
  content: string | null
  metadata: Record<string, unknown> | null
  replyToId: string | null
  replyTo?: Message
  isDeleted: boolean
  deletedFor: DeletedFor | null
  deliveredAt: string | null
  readAt: string | null
  createdAt: string
  reactions?: MessageReaction[]
  sender?: User
}

export interface MessageReaction {
  id: string
  messageId: string
  userId: string
  emoji: string
  createdAt: string
}

// ─── API Response Types ──────────────────────────────────

export interface AuthResponse {
  user: User
  accessToken: string
}

export interface PaginatedResponse<T> {
  data: T[]
  cursor: string | null
  hasMore: boolean
}

export interface BusinessStats {
  todayOrders: number
  todayRevenue: string
  pendingCount: number
  deliveredThisWeek: number
}

// ─── Socket Event Payloads ───────────────────────────────

export interface TypingIndicatorPayload {
  chatId: string
  userId: string
  isTyping: boolean
}

export interface PresenceUpdatePayload {
  userId: string
  isOnline: boolean
  lastSeen: string
}

export interface ChatUpdatedPayload {
  chatId: string
  lastMessage: Message
  unreadCount: number
}

export interface OrderStatusPayload {
  orderId: string
  status: OrderStatus
  note?: string
}
