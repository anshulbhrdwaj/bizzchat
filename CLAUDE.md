# BizChat — Master Vibe Coding Prompt
### WhatsApp Business Clone · Commerce-First Messaging Platform
### By Doank Digital · PRD v1.0 · March 2026

---

> **How to use this prompt:** Feed this entire document to your AI coding assistant (Cursor, Windsurf, Claude, etc.) as the system/project prompt. It is self-contained. Every section is a precise instruction. Do not summarize or compress it — the density is intentional.

---

## 0. PRIME DIRECTIVE

You are building **BizChat** — a production-grade, commerce-first messaging platform. Think WhatsApp Business, but if Apple designed it with a full e-commerce stack built in. The philosophy is: **"Zero-friction ordering inside a conversation."**

This is not a prototype. This is not an MVP skeleton. Every screen must be:
- **Pixel-perfect** to the design system defined below
- **Fully wired** — real API calls, real socket events, real state
- **Cross-platform ready** — the same React codebase runs on Web, Capacitor Android/iOS, and Electron
- **Production-grade** — TypeScript strict mode, Zod validation everywhere, no `any`, no shortcuts

When in doubt, **build more, not less.** Every loading state, every empty state, every error state must exist.

---

## 1. MONOREPO STRUCTURE

```
bizchat/
├── apps/
│   ├── web/                        # React 18 + Vite frontend
│   │   ├── src/
│   │   │   ├── components/         # Shared UI components
│   │   │   │   ├── ui/             # shadcn/ui primitives
│   │   │   │   ├── chat/           # Chat-specific components
│   │   │   │   ├── catalog/        # Catalog components
│   │   │   │   ├── cart/           # Cart components
│   │   │   │   ├── orders/         # Order components
│   │   │   │   └── dashboard/      # Business dashboard components
│   │   │   ├── pages/              # Route-level page components
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── stores/             # Zustand stores
│   │   │   ├── lib/                # Utilities, API client, socket
│   │   │   ├── types/              # Local type extensions
│   │   │   └── styles/             # Global CSS, design tokens
│   │   ├── capacitor.config.ts
│   │   ├── electron/               # Electron main process
│   │   └── vite.config.ts
│   └── server/                     # Node.js + Express backend
│       ├── src/
│       │   ├── routes/             # Express routers per domain
│       │   ├── controllers/        # Route handler logic
│       │   ├── middleware/         # Auth, validation, rate-limit
│       │   ├── services/           # Business logic layer
│       │   ├── socket/             # Socket.io event handlers
│       │   ├── lib/                # Prisma client, logger, etc.
│       │   └── index.ts            # Server entry point
│       └── prisma/
│           ├── schema.prisma
│           └── seed.ts
└── packages/
    └── shared/                     # Shared TypeScript types + Zod schemas
        ├── types/
        └── validators/
```

**Rules:**
- `packages/shared` is the single source of truth for all types and validators
- Import shared types in both `apps/web` and `apps/server` — never duplicate
- All environment variables are typed and validated at startup using Zod
- Root `package.json` uses workspaces; `turbo.json` orchestrates build pipeline

---

## 2. TECHNOLOGY STACK — EXACT VERSIONS

| Layer | Package | Version |
|---|---|---|
| Frontend Framework | `react` + `react-dom` | `^18.3` |
| Language | `typescript` | `^5.4` |
| Build Tool | `vite` | `^5.2` |
| Styling | `tailwindcss` | `^3.4` |
| Component Library | `shadcn/ui` (Radix-based) | latest |
| State — Global | `zustand` | `^4.5` |
| State — Server | `@tanstack/react-query` | `^5.0` |
| Routing | `react-router-dom` | `^6.23` |
| Real-time | `socket.io-client` | `^4.7` |
| Drag & Drop | `@dnd-kit/core` + `@dnd-kit/sortable` | `^6.1` |
| Mobile | `@capacitor/core` | `^6.0` |
| Desktop | `electron` | `^28.0` |
| Backend | `express` + `@types/express` | `^4.18` |
| ORM | `@prisma/client` + `prisma` | `^5.13` |
| Database | PostgreSQL | `16` |
| Validation | `zod` | `^3.23` |
| Auth | `jsonwebtoken` + `bcrypt` | latest |
| Logging | `winston` | `^3.13` |
| File Handling | `multer` + `sharp` | latest |
| Rate Limiting | `express-rate-limit` | latest |
| Socket Server | `socket.io` | `^4.7` |

---

## 3. DESIGN SYSTEM — IMPLEMENT EXACTLY

### 3.1 Color Tokens — CSS Custom Properties

Define all tokens in `:root` in `globals.css`. Use these **everywhere** — never hardcode hex values in components.

```css
:root {
  /* Brand */
  --color-primary: #5B3FD9;
  --color-primary-mid: #7B5FE8;
  --color-primary-light: #EDE9FF;
  --color-accent-cyan: #0891B2;

  /* Surfaces */
  --color-background: #FFFFFF;
  --color-surface: #F9FAFB;
  --color-surface-elevated: #FFFFFF;

  /* Text */
  --color-text-primary: #111827;
  --color-text-body: #374151;
  --color-text-muted: #6B7280;

  /* Chat Bubbles */
  --bubble-outgoing-bg: rgba(91, 63, 217, 0.85);
  --bubble-outgoing-text: #FFFFFF;
  --bubble-incoming-bg: rgba(255, 255, 255, 0.75);
  --bubble-incoming-text: #111827;
  --bubble-border: rgba(91, 63, 217, 0.15);

  /* Status Colors */
  --color-success: #059669;
  --color-warning: #D97706;
  --color-error: #DC2626;
  --color-info: #0891B2;

  /* Glass Effects */
  --glass-bg: rgba(255, 255, 255, 0.6);
  --glass-border: rgba(255, 255, 255, 0.8);
  --glass-blur: blur(12px);
  --glass-shadow: 0 4px 24px rgba(91, 63, 217, 0.08);

  /* Spacing Scale */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 24px;
  --space-8: 32px; --space-10: 40px; --space-12: 48px;

  /* Border Radius */
  --radius-sm: 6px;   --radius-md: 12px;  --radius-lg: 16px;
  --radius-xl: 24px;  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-base: 200ms ease-out;
  --transition-slow: 300ms ease;
  --transition-spring: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dark {
  --color-background: #0F0B1A;
  --color-surface: #1A1428;
  --color-surface-elevated: #221B35;
  --color-text-primary: #F9FAFB;
  --color-text-body: #E5E7EB;
  --color-text-muted: #9CA3AF;
  --glass-bg: rgba(26, 20, 40, 0.7);
  --glass-border: rgba(91, 63, 217, 0.2);
  --bubble-incoming-bg: rgba(34, 27, 53, 0.85);
  --bubble-incoming-text: #F9FAFB;
}
```

### 3.2 Typography Scale

Use **Geist** (display) + **Geist Mono** for code. Load via `@fontsource/geist`.

```js
// tailwind.config.ts — extend fontSize
fontSize: {
  'display': ['48px', { lineHeight: '1.1', fontWeight: '700' }],
  'h1':      ['20px', { lineHeight: '1.3', fontWeight: '700' }],
  'h2':      ['15px', { lineHeight: '1.4', fontWeight: '600' }],
  'h3':      ['12px', { lineHeight: '1.4', fontWeight: '600' }],
  'body':    ['11px', { lineHeight: '1.5', fontWeight: '400' }],
  'small':   ['10px', { lineHeight: '1.4', fontWeight: '400' }],
  'micro':   ['9px',  { lineHeight: '1.3', fontWeight: '500' }],
}
```

### 3.3 Glassmorphism Utility Classes

```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--glass-shadow);
}
.glass-nav {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--glass-border);
}
```

### 3.4 Animation Keyframes

```css
@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes typing-pulse {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30%            { transform: translateY(-4px); opacity: 1; }
}
@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}
@keyframes confetti-fall {
  0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
}
@keyframes checkmark-draw {
  from { stroke-dashoffset: 100; }
  to   { stroke-dashoffset: 0; }
}
@keyframes badge-bounce {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.3); }
}
```

---

## 4. DATABASE SCHEMA — PRISMA (COMPLETE)

```prisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  phone         String   @unique
  name          String?
  avatarUrl     String?
  isOnline      Boolean  @default(false)
  lastSeen      DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  refreshTokens RefreshToken[]
  businessProfile BusinessProfile?
  chatMembers   ChatMember[]
  messages      Message[]
  reactions     MessageReaction[]
  carts         Cart[]
  orders        Order[]
  sharedCartsReceived SharedCart[]     @relation("SharedCartRecipient")
  orderStatusChanges  OrderStatusHistory[]
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  family    String
  used      Boolean  @default(false)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model BusinessProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  logoUrl     String?
  coverUrl    String?
  category    String?
  description String?
  address     String?
  website     String?
  email       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  collections CatalogCollection[]
  orders      Order[]
  sharedCarts SharedCart[]
}

model CatalogCollection {
  id          String   @id @default(cuid())
  businessId  String
  business    BusinessProfile @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name        String
  description String?
  coverUrl    String?
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  productCollections ProductCollection[]
}

model Product {
  id          String   @id @default(cuid())
  businessId  String
  name        String
  description String?
  basePrice   Decimal  @db.Decimal(10, 2)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  images          ProductImage[]
  variantGroups   VariantGroup[]
  collections     ProductCollection[]
  cartItems       CartItem[]
  orderItems      OrderItem[]
  sharedCartItems SharedCartItem[]
}

model ProductImage {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
}

model ProductCollection {
  productId    String
  collectionId String
  product      Product           @relation(fields: [productId], references: [id], onDelete: Cascade)
  collection   CatalogCollection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  @@id([productId, collectionId])
}

model VariantGroup {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  name      String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  values    VariantValue[]
}

model VariantValue {
  id            String       @id @default(cuid())
  groupId       String
  group         VariantGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  label         String
  priceOverride Decimal?     @db.Decimal(10, 2)
  stock         Int          @default(0)
  sku           String?
  imageUrl      String?
  sortOrder     Int          @default(0)
  createdAt     DateTime     @default(now())
  cartItems       CartItem[]
  orderItems      OrderItem[]
  sharedCartItems SharedCartItem[]
}

model Cart {
  id         String     @id @default(cuid())
  userId     String
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  businessId String
  status     CartStatus @default(ACTIVE)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  items      CartItem[]
  order      Order?
  @@unique([userId, businessId, status])
}
enum CartStatus { ACTIVE CHECKED_OUT }

model CartItem {
  id        String        @id @default(cuid())
  cartId    String
  cart      Cart          @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String
  product   Product       @relation(fields: [productId], references: [id])
  variantId String?
  variant   VariantValue? @relation(fields: [variantId], references: [id])
  quantity  Int
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  @@unique([cartId, productId, variantId])
}

model SharedCart {
  id          String           @id @default(cuid())
  businessId  String
  business    BusinessProfile  @relation(fields: [businessId], references: [id])
  recipientId String
  recipient   User             @relation("SharedCartRecipient", fields: [recipientId], references: [id])
  note        String?
  expiresAt   DateTime?
  status      SharedCartStatus @default(PENDING)
  chatId      String?
  messageId   String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  items       SharedCartItem[]
}
enum SharedCartStatus { PENDING VIEWED ADDED_TO_CART ORDERED EXPIRED }

model SharedCartItem {
  id           String      @id @default(cuid())
  sharedCartId String
  sharedCart   SharedCart  @relation(fields: [sharedCartId], references: [id], onDelete: Cascade)
  productId    String
  product      Product     @relation(fields: [productId], references: [id])
  variantId    String?
  variant      VariantValue? @relation(fields: [variantId], references: [id])
  quantity     Int
  note         String?
  createdAt    DateTime    @default(now())
}

model Order {
  id              String      @id @default(cuid())
  orderNumber     String      @unique
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  businessId      String
  business        BusinessProfile @relation(fields: [businessId], references: [id])
  cartId          String?     @unique
  cart            Cart?       @relation(fields: [cartId], references: [id])
  status          OrderStatus @default(PENDING)
  subtotal        Decimal     @db.Decimal(10, 2)
  total           Decimal     @db.Decimal(10, 2)
  deliveryAddress String?
  customerNote    String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  items           OrderItem[]
  statusHistory   OrderStatusHistory[]
}
enum OrderStatus { PENDING CONFIRMED PROCESSING DISPATCHED DELIVERED CANCELLED REFUNDED }

model OrderItem {
  id           String        @id @default(cuid())
  orderId      String
  order        Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId    String
  product      Product       @relation(fields: [productId], references: [id])
  variantId    String?
  variant      VariantValue? @relation(fields: [variantId], references: [id])
  // SNAPSHOTTED at order time — never join for price display
  productName  String
  variantLabel String?
  unitPrice    Decimal       @db.Decimal(10, 2)
  quantity     Int
  lineTotal    Decimal       @db.Decimal(10, 2)
  imageUrl     String?
}

model OrderStatusHistory {
  id        String      @id @default(cuid())
  orderId   String
  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  status    OrderStatus
  note      String?
  changedBy String
  changer   User        @relation(fields: [changedBy], references: [id])
  createdAt DateTime    @default(now())
}

model Chat {
  id        String     @id @default(cuid())
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  members   ChatMember[]
  messages  Message[]
}

model ChatMember {
  chatId   String
  userId   String
  chat     Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  joinedAt DateTime @default(now())
  lastRead DateTime @default(now())
  @@id([chatId, userId])
}

model Message {
  id          String      @id @default(cuid())
  chatId      String
  chat        Chat        @relation(fields: [chatId], references: [id], onDelete: Cascade)
  senderId    String
  sender      User        @relation(fields: [senderId], references: [id])
  type        MessageType @default(TEXT)
  content     String?
  metadata    Json?
  replyToId   String?
  replyTo     Message?    @relation("Replies", fields: [replyToId], references: [id])
  replies     Message[]   @relation("Replies")
  isDeleted   Boolean     @default(false)
  deletedFor  DeletedFor?
  deliveredAt DateTime?
  readAt      DateTime?
  createdAt   DateTime    @default(now())
  reactions   MessageReaction[]
}
enum MessageType { TEXT IMAGE DOCUMENT AUDIO PRODUCT_CARD SHARED_CART ORDER_UPDATE }
enum DeletedFor  { SELF EVERYONE }

model MessageReaction {
  id        String   @id @default(cuid())
  messageId String
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  emoji     String
  createdAt DateTime @default(now())
  @@unique([messageId, userId])
}
```

---

## 5. BACKEND — API ROUTES (ALL REQUIRED)

### Middleware stack order
```ts
app.use(helmet())
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())
app.use(requestLogger)   // Winston
```

### Auth Middleware
```ts
export const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload
    req.userId = payload.sub
    next()
  } catch { res.status(401).json({ error: 'Invalid token' }) }
}

export const requireBusinessOwner = async (req, res, next) => {
  const profile = await prisma.businessProfile.findUnique({ where: { userId: req.userId } })
  if (!profile) return res.status(403).json({ error: 'No business profile' })
  req.businessId = profile.id
  next()
}
```

### Complete Route List

**`/api/auth`**
- `POST /send-otp` — rate-limited 5/hour/phone, generate 6-digit OTP, store hashed, 5min TTL
- `POST /verify-otp` — compare hash, create user if new, return JWT access + refresh token pair
- `POST /refresh` — validate refresh token family, rotate, return new pair
- `POST /logout` — invalidate refresh token family

**`/api/catalog`**
- `GET /business/:id/collections` — active collections with product counts
- `GET /collections/:id/products` — paginated, active-only for public
- `POST/PUT/DELETE /collections` — CRUD (business owner)
- `PATCH /collections/reorder` — bulk sortOrder update
- `POST/PUT/DELETE /products` — CRUD (business owner)
- `POST /products/:id/images` — multer upload → sharp WebP
- `PATCH /products/:id/images/reorder` — update sortOrder
- `POST /products/:id/variants` — create group + values
- `PUT /variants/:groupId` — update group name
- `POST /variants/:groupId/values` — add value
- `PUT /variants/values/:valueId` — price, stock, sku
- `DELETE /variants/:groupId` — remove group + cascade values

**`/api/cart`**
- `GET /` — get or create active cart for user+businessId (businessId in query)
- `POST /items` — add item; upsert on productId+variantId duplicate
- `PUT /items/:id` — set exact quantity (0 = delete)
- `DELETE /items/:id` — remove item
- `DELETE /` — clear all items
- `POST /from-shared/:sharedCartId` — merge shared cart into active cart

**`/api/shared-carts`**
- `POST /` — business creates + sends (emits `shared_cart:received` socket)
- `GET /:id` — full detail (business or recipient)
- `PATCH /:id/status` — update status

**`/api/orders`**
- `POST /` — place order from cart; snapshot all prices; emit `order:new`
- `GET /` — customer order list, paginated, sorted newest first
- `GET /:id` — full order detail with items + status history

**`/api/business/orders`**
- `GET /` — filterable (status, search, date range), sortable, paginated
- `PATCH /:id/status` — validate transition → update → emit `order:status` to customer
- `GET /stats` — today's orders, revenue, pending count, delivered this week

**`/api/chats`**
- `GET /` — all chats with last message + unread count
- `POST /` — create or retrieve DM (recipientId in body)
- `GET /:id/messages` — cursor paginated, newest first
- `POST /:id/messages` — send message (text, image, doc, special types)
- `DELETE /messages/:id` — soft delete self or everyone
- `POST /messages/:id/react` — toggle emoji reaction

**`/api/business`**
- `GET /profile` — own business profile
- `POST /profile` — create profile
- `PUT /profile` — update fields
- `POST /profile/logo` — upload logo (WebP 400px)
- `POST /profile/cover` — upload cover (WebP 1200px)

### Order Number Generation
```ts
async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.order.count({
    where: { createdAt: { gte: new Date(`${year}-01-01`) } }
  })
  return `ORD-${year}-${String(count + 1).padStart(3, '0')}`
}
```

### Image Processing
```ts
export async function processImage(buffer: Buffer, type: 'product'|'avatar'|'cover'|'logo') {
  const sizes = {
    product: { full: 1200, thumb: 200 },
    avatar:  { full: 400,  thumb: 80  },
    cover:   { full: 1200, thumb: 400 },
    logo:    { full: 400,  thumb: 80  },
  }
  const { full, thumb } = sizes[type]
  const [fullBuffer, thumbBuffer] = await Promise.all([
    sharp(buffer).resize(full, null, { withoutEnlargement: true }).webp({ quality: 85 }).toBuffer(),
    sharp(buffer).resize(thumb, thumb, { fit: 'cover' }).webp({ quality: 75 }).toBuffer(),
  ])
  return { fullBuffer, thumbBuffer }
}
```

---

## 6. SOCKET.IO — COMPLETE EVENT WIRING

### Server Handler
```ts
io.use(socketAuthMiddleware)  // Validate JWT from handshake.auth.token

io.on('connection', async (socket) => {
  const userId = socket.data.userId
  await prisma.user.update({ where: { id: userId }, data: { isOnline: true, lastSeen: new Date() } })
  await broadcastPresence(userId, true)

  socket.on('join:chat',    (chatId) => socket.join(`chat:${chatId}`))
  socket.on('leave:chat',   (chatId) => socket.leave(`chat:${chatId}`))
  socket.on('message:send', handleMessageSend(socket, io))
  socket.on('message:read', handleMessageRead(socket, io))
  socket.on('message:react',handleMessageReact(socket, io))
  socket.on('typing:start', ({ chatId }) =>
    socket.to(`chat:${chatId}`).emit('typing:indicator', { chatId, userId, isTyping: true }))
  socket.on('typing:stop',  ({ chatId }) =>
    socket.to(`chat:${chatId}`).emit('typing:indicator', { chatId, userId, isTyping: false }))
  socket.on('presence:ping', () =>
    prisma.user.update({ where: { id: userId }, data: { lastSeen: new Date() } }))

  socket.on('disconnect', async () => {
    setTimeout(async () => {
      const sessions = await io.in(`user:${userId}`).fetchSockets()
      if (sessions.length === 0) {
        await prisma.user.update({ where: { id: userId }, data: { isOnline: false, lastSeen: new Date() } })
        await broadcastPresence(userId, false)
      }
    }, 30000)
  })
})
```

### Event Reference

| Direction | Event | Payload |
|---|---|---|
| C→S | `join:chat` | `chatId` |
| C→S | `leave:chat` | `chatId` |
| C→S | `message:send` | `{ chatId, type, content, replyToId?, metadata? }` |
| C→S | `message:read` | `{ chatId, messageId }` |
| C→S | `message:react` | `{ messageId, emoji }` |
| C→S | `typing:start` | `{ chatId }` |
| C→S | `typing:stop` | `{ chatId }` |
| C→S | `presence:ping` | `{}` |
| S→C | `message:new` | Full message + sender |
| S→C | `message:delivered` | `{ messageId }` |
| S→C | `message:read` | `{ messageId, readAt }` |
| S→C | `message:deleted` | `{ messageId, deletedFor }` |
| S→C | `typing:indicator` | `{ chatId, userId, isTyping }` |
| S→C | `presence:update` | `{ userId, isOnline, lastSeen }` |
| S→C | `chat:updated` | `{ chatId, lastMessage, unreadCount }` |
| S→C | `order:new` | Full order object → business owner |
| S→C | `order:status` | `{ orderId, status, note }` → customer |
| S→C | `shared_cart:received` | SharedCart object → recipient |

---

## 7. FRONTEND — ZUSTAND STORES

```ts
// useAuthStore
interface AuthStore {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  updateUser: (updates: Partial<User>) => void
  logout: () => void
}

// useChatStore
interface ChatStore {
  chats: Chat[]
  activeChat: Chat | null
  messages: Record<string, Message[]>    // keyed by chatId
  typingUsers: Record<string, string[]>  // chatId → userId[]
  setActiveChat: (chat: Chat | null) => void
  addMessage: (chatId: string, msg: Message) => void
  updateMessage: (chatId: string, msgId: string, updates: Partial<Message>) => void
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void
  updateChatPreview: (chatId: string, lastMsg: Message) => void
}

// useCartStore
interface CartStore {
  carts: Record<string, Cart>  // keyed by businessId
  setCart: (businessId: string, cart: Cart) => void
  addItem: (businessId: string, item: CartItem) => void
  updateItem: (businessId: string, itemId: string, qty: number) => void
  removeItem: (businessId: string, itemId: string) => void
  clearCart: (businessId: string) => void
  getTotalItems: (businessId: string) => number
}

// usePresenceStore
interface PresenceStore {
  presence: Record<string, { isOnline: boolean; lastSeen: string }>
  updatePresence: (userId: string, isOnline: boolean, lastSeen: string) => void
}

// useOrderStore (business dashboard)
interface OrderStore {
  orders: Order[]
  stats: BusinessStats | null
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: OrderStatus) => void
  setStats: (stats: BusinessStats) => void
}
```

---

## 8. ROUTING STRUCTURE

```tsx
<Routes>
  {/* Public */}
  <Route path="/auth"         element={<AuthPage />} />
  <Route path="/auth/otp"     element={<OTPPage />} />
  <Route path="/auth/profile" element={<ProfileSetupPage />} />

  {/* Protected */}
  <Route element={<AuthGuard />}>
    <Route element={<AppShell />}>
      <Route path="/"                            element={<Navigate to="/chats" />} />
      <Route path="/chats"                       element={<ChatListPage />} />
      <Route path="/chats/:chatId"               element={<ChatWindowPage />} />
      <Route path="/catalog/:businessId"         element={<CatalogPage />} />
      <Route path="/catalog/:businessId/product/:productId" element={<ProductDetailPage />} />
      <Route path="/cart/:businessId"            element={<CartPage />} />
      <Route path="/orders"                      element={<OrdersPage />} />
      <Route path="/orders/:orderId"             element={<OrderDetailPage />} />
      <Route path="/shared-cart/:id"             element={<SharedCartPage />} />

      {/* Business owner only */}
      <Route element={<BusinessGuard />}>
        <Route path="/dashboard"                        element={<DashboardPage />} />
        <Route path="/dashboard/orders"                 element={<OrderManagerPage />} />
        <Route path="/dashboard/catalog"                element={<CatalogManagerPage />} />
        <Route path="/dashboard/shared-cart/new"        element={<SharedCartCreatorPage />} />
      </Route>

      <Route path="/settings"       element={<SettingsPage />} />
      <Route path="/business/setup" element={<BusinessSetupPage />} />
    </Route>
  </Route>
</Routes>
```

---

## 9. COMPONENT SPECIFICATIONS

### MessageBubble
- Outgoing: right-aligned, purple glass (`--bubble-outgoing-bg`), CSS clip-path tail right
- Incoming: left-aligned, white glass, tail left
- Max width: 65% desktop / 80% mobile
- `rounded-2xl` except tail corner (`rounded-md`)
- Read receipts: ✓ sent, ✓✓ delivered, teal ✓✓ read
- Long-press mobile / hover desktop: reaction bar (6 emoji + picker) + reply + delete
- Reply preview: above content, left border `--color-primary`, sender name
- Deleted: italic grey "This message was deleted"
- Mount animation: `scale-in` + `fade-up` 150ms

### VariantSelector
- Each VariantGroup = labeled row of pill buttons
- Out-of-stock: strikethrough, 50% opacity, pointer-events none
- Selected pill: filled primary bg, white text, `scale(1.05)`
- Price updates live below: "₹249" or "From ₹199"
- Add to Cart: disabled until ALL groups selected
- On add: thumbnail animates to cart tab icon (400ms spring)

### TypingIndicator
- 3 dots, 8px circles, primary purple
- Staggered `typing-pulse` animation, 150ms delay between dots, loop
- Auto-clears 2s after last typing event

### ChatInputBar
- Glass pill, bottom of chat window
- Empty: smile icon left, mic icon right
- Typing: smile icon left, Send button right (scale-in, primary purple)
- Attachment (paperclip): action sheet → Image / Document / Product Card / Create Shared Cart
- Auto-resize: 1–6 lines
- `typing:start` on first keystroke, `typing:stop` after 2s idle
- Enter to send (desktop), Send button (mobile)
- Reply context bar above input when replying

### SharedCartCard (in chat)
- Gradient header, cart icon, business name
- Max 3 items shown, "+N more" overflow
- Subtotal displayed
- Expiry: "Expires in 2 days" amber warning
- "View Cart" CTA → SharedCartPage
- Expired: greyed, "Cart Expired" overlay
- Status pill: Pending / Viewed / Added / Ordered

### OrderStatusCard (in chat)
- Auto-sent on every status change
- Order number bold, status icon + color, item count, total
- Status-specific copy: "Your order is being prepared!" etc.
- "View Order" link button

### KPI Card (Dashboard)
- White card, 4px left border `--color-primary`
- Number: 48px bold, count-up animation on socket update
- Label: small muted text
- Loading: pulse skeleton matching exact layout

### OrderStatusPill — Color Map
```
PENDING    → amber
CONFIRMED  → blue
PROCESSING → purple
DISPATCHED → cyan
DELIVERED  → green
CANCELLED  → red
REFUNDED   → grey
```
Color transition: 300ms ease on change.

---

## 10. SCREENS — EVERY STATE REQUIRED

Every page requires **three states**: loading skeleton (matching layout), empty (illustration + CTA), error (message + retry).

### AUTH FLOW
**PhoneEntryPage** — country selector (flag + dial code), large numeric input, "Get OTP" CTA, purple mesh bg  
**OTPPage** — 6 boxes (48x48px each), auto-advance, paste support, shake on wrong, 5min countdown, resend link  
**ProfileSetupPage** — circular avatar upload, required name input, "Continue" disabled until name filled

### CHAT LIST PAGE
Pinned chats at top · avatar + online dot · name · last message preview · smart timestamp · unread badge · swipe actions (archive, mark read) · typing "..." preview · real-time search filter · skeleton: 8 items

### CHAT WINDOW PAGE
Header: avatar, name, online/last seen, overflow menu · Virtualized message list (react-virtual) · Date separators · Auto-scroll + scroll-to-bottom FAB · Inline special cards · Cursor pagination on scroll to top · Input bar pinned above keyboard

### CATALOG PAGE
Business cover + logo header · Sticky collection tabs · 2/3/4 col responsive grid · IntersectionObserver pagination · Filter/sort bar

### PRODUCT DETAIL PAGE
Swipeable image carousel + pinch-zoom · Product name, description, price · VariantSelector · Quantity stepper · Add to Cart (with animation) · Message Business button · Related products

### CART PAGE
Business header · Line items with quantity steppers · Swipe-to-delete mobile · Sticky order summary (subtotal, tax, **Total**) · Delivery address + note · Place Order CTA with loading · Success: confetti + checkmark draw animation

### ORDERS PAGE
Tabs: Active / Completed / Cancelled · Order rows with status pills · Real-time status transitions

### ORDER DETAIL PAGE
Order number + date · Vertical status timeline with notes · Snapshotted item list · Total summary · Message Business button

### BUSINESS DASHBOARD
4 KPI cards (live) · shadcn DataTable with live status-tab badges · New order slide-in banner (auto-dismiss 5s) · Desktop: table / Mobile: cards · Order detail: Sheet component

### CATALOG MANAGER
Collections: @dnd-kit drag-to-reorder, active toggle, edit/delete · Product editor: full form, drag-to-reorder images, variant builder · Image upload: drag-drop zone + progress indicator

### SHARED CART CREATOR (4-step stepper)
1. **Select Customer** — searchable list with avatars  
2. **Build Cart** — browse own catalog, add with variant + quantity  
3. **Notes & Expiry** — per-item notes, cart note, date picker  
4. **Preview & Send** — exact customer view, Confirm & Send CTA

---

## 11. NAVIGATION LAYOUT

### Mobile (< 768px) — Bottom Tab Bar
```tsx
const tabs = [
  { icon: ChatBubbleIcon, label: 'Chats',     path: '/chats' },
  { icon: ShoppingBagIcon,label: 'Catalog',   path: '/catalog' },
  { icon: CartIcon,       label: 'Cart',      path: '/cart', badge: cartCount },
  { icon: PackageIcon,    label: 'Orders',    path: '/orders' },
  { icon: DashboardIcon,  label: 'Dashboard', path: '/dashboard' }, // business only
]
// Active: primary purple icon + bold label
// All targets: min 44x44px touch area
// Cart badge: item count
```

### Desktop (≥ 1024px)
60px icon strip (logo top, nav icons, settings + profile bottom) + 380px collapsible content panel + flex main area. Active icon: primary purple + subtle purple bg circle.

### Tablet (768–1023px)
Icons + labels sidebar (collapsible) + main content.

---

## 12. CAPACITOR CONFIG

```ts
const config: CapacitorConfig = {
  appId: 'com.doank.bizchat',
  appName: 'BizChat',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    SplashScreen: { launchShowDuration: 1500, backgroundColor: '#5B3FD9', showSpinner: false },
    StatusBar:    { style: Style.Light, backgroundColor: '#5B3FD9' },
    Keyboard:     { resize: 'body', style: KeyboardStyle.Dark },
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
  }
}
```

**Mobile behaviors:**
- Input bar above keyboard: `visualViewport` API to track height
- Safe area: all fixed elements use `env(safe-area-inset-*)` CSS vars
- Haptics: Light on send · Medium on cart add · Success notification on order placed
- iOS: do not override native swipe-back gesture

---

## 13. ELECTRON CONFIG

```js
mainWindow = new BrowserWindow({
  width: 1280, height: 800, minWidth: 900, minHeight: 600,
  frame: false,
  titleBarStyle: 'hiddenInset',  // macOS traffic lights
  webPreferences: { nodeIntegration: false, contextIsolation: true, preload: '...' }
})
// System tray icon + quick actions
// Native desktop notifications: new messages + new orders
// electron-updater auto-update
// bizchat:// custom URL scheme deep link
```

---

## 14. API CLIENT + SOCKET CLIENT

```ts
// lib/api.ts — axios with JWT interceptor + auto-refresh on 401
const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true })
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
apiClient.interceptors.response.use(res => res, async (error) => {
  if (error.response?.status === 401 && !error.config._retry) {
    error.config._retry = true
    const { data } = await apiClient.post('/auth/refresh')
    useAuthStore.getState().setAuth(data.user, data.accessToken)
    return apiClient(error.config)
  }
  return Promise.reject(error)
})

// lib/socket.ts — init with token, wire all events to Zustand stores
export function initSocket(token: string) {
  const socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token }, transports: ['websocket'],
    reconnection: true, reconnectionAttempts: 10,
  })
  socket.on('message:new',      (msg) => useChatStore.getState().addMessage(msg.chatId, msg))
  socket.on('typing:indicator', ({ chatId, userId, isTyping }) =>
    useChatStore.getState().setTyping(chatId, userId, isTyping))
  socket.on('presence:update',  ({ userId, isOnline, lastSeen }) =>
    usePresenceStore.getState().updatePresence(userId, isOnline, lastSeen))
  socket.on('order:new',        (order) => useOrderStore.getState().addOrder(order))
  socket.on('order:status',     ({ orderId, status }) =>
    useOrderStore.getState().updateOrderStatus(orderId, status))
}
```

### Optimistic UI Pattern (apply to all mutations)
```ts
// 1. Optimistic: add temp item to store immediately
// 2. API call in background
// 3. Replace temp item with server-confirmed item
// 4. On error: rollback + toast.error()
```

---

## 15. PERFORMANCE TARGETS

| Metric | Target | Method |
|---|---|---|
| Initial JS bundle | < 150KB gzip | Dynamic imports per route |
| App load (4G) | < 2s | Skeleton screens + lazy routes |
| Message send → visible | < 200ms | Optimistic UI |
| API P95 | < 300ms | Prisma indexes on all FK + query columns |
| Chat scroll | 60fps | `react-virtual` virtualized list |
| Image load | < 500ms | Blur-up + WebP + CDN |
| Lighthouse Mobile | > 85 | Lazy images + font preload + minification |

---

## 16. SECURITY CHECKLIST

- [ ] All routes: Zod validation via `validateBody(schema)` middleware — no raw `req.body`
- [ ] Business routes: `requireBusinessOwner` + ownership check in every controller
- [ ] Cart/order routes: verify resource belongs to `req.userId`
- [ ] Image uploads: server-side MIME type validation, size limits (2MB images, 10MB docs)
- [ ] Rate limiting: auth 5/min, API 100/min, upload 20/min
- [ ] JWT secret from env only — never hardcoded
- [ ] Phone numbers masked in all Winston log output
- [ ] CORS: only `VITE_ORIGIN` + `capacitor://localhost`
- [ ] Helmet.js: all defaults + HSTS
- [ ] Prisma only — zero raw SQL
- [ ] Refresh token reuse detection: replayed token → invalidate entire family

---

## 17. DEFINITION OF DONE

Mark a feature complete only when ALL are true:

- [ ] Works: Chrome + Safari + Firefox + Android APK + iOS + Electron
- [ ] Loading skeleton matches layout exactly
- [ ] Empty state: illustration + CTA
- [ ] Error state: message + retry
- [ ] All interactive elements ≥ 44x44px touch target
- [ ] Dark mode: all `dark:` Tailwind variants applied
- [ ] WCAG AA contrast on all text
- [ ] Keyboard navigable with visible focus rings
- [ ] TypeScript strict: zero `any`
- [ ] Zod validation on all API inputs
- [ ] Winston log on all API errors
- [ ] Socket events wired and manually tested
- [ ] Viewport verified: 320px, 390px, 768px, 1024px, 1440px

---

## 18. ENVIRONMENT VARIABLES

```env
# Server
DATABASE_URL=postgresql://user:pass@localhost:5432/bizchat
JWT_SECRET=your-256-bit-secret
REFRESH_TOKEN_SECRET=different-256-bit-secret
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,capacitor://localhost
UPLOAD_DIR=./uploads

# Client
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_APP_NAME=BizChat
```

Validate ALL env vars with Zod at server startup. Crash immediately if any are missing.

---

## 19. SEED DATA

`apps/server/prisma/seed.ts` must generate:
- 3 users: 2 business owners (`+919999000001`, `+919999000002`) + 1 customer (`+919999000003`)
- Business 1 "Darpan Paper Plates": 3 collections, 12 products, variants (Size + Material)
- Business 2 "Meena Fashion": 4 collections, 16 products, variants (Size + Color)
- Sample chats with messages between users
- Orders in all status states (PENDING through DELIVERED, one CANCELLED)
- 2 shared carts (one PENDING, one ADDED_TO_CART)

---

## 20. DEV STARTUP SEQUENCE

```bash
pnpm install                           # Install all workspaces
docker compose up -d postgres          # Start database
pnpm db:push && pnpm db:seed           # Schema + seed
pnpm --filter server dev               # Start API + Socket servera
pnpm --filter web dev                  # Start Vite dev server

# Mobile
pnpm --filter web build && npx cap sync android && npx cap open android

# Desktop
pnpm --filter web build && pnpm --filter web electron:dev
```

---

*BizChat Master Prompt — Doank Digital — March 2026*
*This document is the single source of truth. Build exactly what is specified. No simplifying, no shortcuts, no placeholders.*