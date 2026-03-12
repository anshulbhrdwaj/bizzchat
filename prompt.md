# 🚀 WhatsApp Business Clone — Telegram UI | Full-Stack Prompt Guide

> **Stack**: TypeScript · React · Prisma · PostgreSQL · Express · TailwindCSS · shadcn/ui · Zustand · React Query · Capacitor · Electron  
> **Target**: Web · Android APK · iOS · Desktop (Electron)

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [UI/UX Design System Prompt](#3-uiux-design-system-prompt)
4. [Feature List](#4-feature-list)
5. [Database Schema (Prisma)](#5-database-schema-prisma)
6. [Backend API Prompt](#6-backend-api-prompt)
7. [Frontend Architecture Prompt](#7-frontend-architecture-prompt)
8. [Mobile APK Setup (Capacitor)](#8-mobile-apk-setup-capacitor)
9. [Desktop App Setup (Electron)](#9-desktop-app-setup-electron)
10. [Real-Time Layer (WebSocket)](#10-real-time-layer-websocket)
11. [Complete CLI Command Sequence](#11-complete-cli-command-sequence)
12. [AI Prompts by Feature](#12-ai-prompts-by-feature)

---

## 1. PROJECT OVERVIEW

Build a **production-grade, cross-platform messaging app** that replicates all WhatsApp Business features but renders with **Telegram's premium UI aesthetic** — featuring glassmorphism, fluid animations, dark/light adaptive themes, and a branded design system.

### Core Principles
- **Feature Parity**: Every WhatsApp Business feature implemented and working
- **Premium UI**: Telegram-quality glassmorphism, micro-interactions, smooth transitions
- **Cross-Platform**: One codebase → Web + Android APK + iOS + Desktop
- **Real-Time**: Sub-100ms message delivery via WebSockets
- **Type-Safe**: 100% TypeScript, end-to-end

---

## 2. TECH STACK & ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│  React + TypeScript + Vite                                  │
│  ├── shadcn/ui components (Radix UI primitives)            │
│  ├── TailwindCSS (design tokens + utilities)               │
│  ├── Zustand (global state: auth, chat, UI)                │
│  ├── React Query (server state, caching, mutations)        │
│  └── React Router v6 (navigation)                          │
├─────────────────────────────────────────────────────────────┤
│                    PLATFORM ADAPTERS                        │
│  ├── Capacitor (Android APK + iOS)                         │
│  └── Electron (Windows + macOS + Linux Desktop)            │
├─────────────────────────────────────────────────────────────┤
│                      SERVER LAYER                           │
│  Express + TypeScript                                       │
│  ├── REST API (auth, media, business features)             │
│  ├── Socket.io (real-time messaging)                       │
│  ├── Prisma ORM (type-safe DB access)                      │
│  └── PostgreSQL (primary database)                         │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure
```
/
├── apps/
│   ├── web/                    # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   │   ├── ui/         # shadcn primitives
│   │   │   │   ├── chat/       # Chat-specific components
│   │   │   │   ├── business/   # Business feature components
│   │   │   │   └── layout/     # App shell, sidebars, panels
│   │   │   ├── pages/          # Route pages
│   │   │   ├── stores/         # Zustand stores
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── lib/            # API client, utils, constants
│   │   │   ├── types/          # TypeScript types
│   │   │   └── styles/         # Global CSS, design tokens
│   │   ├── capacitor.config.ts
│   │   └── electron/           # Electron main process
│   └── server/                 # Express backend
│       ├── src/
│       │   ├── routes/         # API route handlers
│       │   ├── middleware/      # Auth, validation, rate limiting
│       │   ├── services/       # Business logic
│       │   ├── socket/         # Socket.io handlers
│       │   └── lib/            # Prisma client, redis, utils
│       └── prisma/
│           └── schema.prisma
├── packages/
│   └── shared/                 # Shared types between client/server
└── docker-compose.yml
```

---

## 3. UI/UX DESIGN SYSTEM PROMPT

### 🎨 Master UI/UX Prompt

```
You are designing a premium messaging application with Telegram-inspired aesthetics.
The design must feel cutting-edge, polished, and premium — matching or exceeding
Telegram's 2024 visual quality.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BRAND IDENTITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

App Name: "NexChat Business"
Tagline: "Connect. Automate. Grow."

Brand Personality:
- Professional yet approachable
- Modern and tech-forward
- Trustworthy and secure
- Fast and efficient

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLOR PALETTE (CSS Custom Properties)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DARK THEME (Primary):
--bg-primary: #0E1621          /* Main background */
--bg-secondary: #17212B        /* Sidebar, panels */
--bg-tertiary: #1C2733         /* Cards, elevated surfaces */
--bg-input: #242F3D            /* Input fields */
--bg-hover: #2B5278            /* Hover states */
--bg-selected: #2B5278         /* Selected items */
--bg-message-out: #2B5278      /* Sent messages */
--bg-message-in: #182533       /* Received messages */

ACCENT COLORS:
--accent-primary: #3E9BF7      /* Primary blue — CTAs, links */
--accent-secondary: #54C2E8    /* Cyan — online indicators */
--accent-success: #4FCA6E      /* Green — delivered, online */
--accent-warning: #F5B942      /* Amber — warnings, pending */
--accent-danger: #E55757       /* Red — errors, delete */
--accent-purple: #8B5CF6       /* Purple — premium features */
--accent-gradient: linear-gradient(135deg, #3E9BF7, #54C2E8)

TEXT COLORS:
--text-primary: #FFFFFF         /* Primary text */
--text-secondary: #8BA5C1       /* Secondary, labels */
--text-tertiary: #4D6B8A        /* Placeholders, disabled */
--text-link: #3E9BF7            /* Links */
--text-timestamp: #627D8E       /* Message timestamps */

GLASS MORPHISM:
--glass-bg: rgba(23, 33, 43, 0.85)
--glass-border: rgba(255, 255, 255, 0.08)
--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4)
--glass-blur: blur(20px)
--glass-bg-light: rgba(255, 255, 255, 0.06)

LIGHT THEME (Secondary):
--bg-primary: #F4F4F5
--bg-secondary: #FFFFFF
--bg-tertiary: #FAFAFA
--bg-message-out: #EFFDDE      /* WhatsApp-style green tint */
--bg-message-in: #FFFFFF
--accent-primary: #2B7BDB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TYPOGRAPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Font Stack:
- Display/Headers: "Plus Jakarta Sans" (weight: 600, 700, 800)
- Body/UI: "Inter" (weight: 400, 500, 600)
- Monospace/Code: "JetBrains Mono" (weight: 400, 500)
- Emoji: System emoji font

Scale (rem):
--text-xs: 0.6875rem    /* 11px — timestamps, badges */
--text-sm: 0.75rem      /* 12px — captions, labels */
--text-base: 0.875rem   /* 14px — message text */
--text-md: 1rem         /* 16px — UI labels */
--text-lg: 1.125rem     /* 18px — contact names */
--text-xl: 1.25rem      /* 20px — section headers */
--text-2xl: 1.5rem      /* 24px — modal titles */
--text-3xl: 2rem        /* 32px — large headings */

Line Heights:
--leading-tight: 1.2
--leading-snug: 1.4
--leading-normal: 1.5
--leading-relaxed: 1.625

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SPACING & LAYOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Base unit: 4px
Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80

Layout Breakpoints:
- Mobile: < 640px (single panel)
- Tablet: 640px–1024px (sidebar + chat)
- Desktop: > 1024px (sidebar + chat + info panel)
- Wide: > 1440px (expanded sidebar)

App Shell Layout (Desktop):
┌──────────────────────────────────────────────────────────┐
│  72px  │    320px    │      flex-1       │    380px      │
│  Nav   │  Chat List  │   Message View    │  Info Panel   │
│  Rail  │   Sidebar   │                   │  (optional)   │
└──────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GLASSMORPHISM SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apply glass effect to:
- Navigation rail
- Chat list sidebar
- Message input bar
- Modal dialogs and drawers
- Floating action buttons
- Context menus
- Tooltips

Glass CSS Pattern:
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}

Always pair glass panels with a rich background:
- Animated gradient mesh background on main view
- Subtle noise texture overlay (opacity: 0.03)
- Blurred contact avatar as background in chat view

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANIMATION & MOTION SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Easing Curves:
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in: cubic-bezier(0.4, 0, 1, 1)

Duration Scale:
--duration-instant: 80ms     /* Hover color changes */
--duration-fast: 150ms       /* Button states */
--duration-normal: 250ms     /* Panel transitions */
--duration-slow: 400ms       /* Modal open/close */
--duration-slower: 600ms     /* Page transitions */

Key Animations:
1. Message send: slide-in from bottom-right + fade
2. Message receive: slide-in from bottom-left + fade
3. Chat open: slide-in from right (mobile) or fade+scale (desktop)
4. Reaction: pop + bounce (--ease-spring)
5. Typing indicator: three dots with staggered pulse
6. Online status: smooth color transition
7. Unread badge: scale-in with spring
8. Voice note waveform: real-time amplitude animation
9. Photo send: thumbnail expand to full view
10. Context menu: origin-point scale-in

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPONENT SPECIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NAVIGATION RAIL (72px wide, full height):
- Frosted glass panel
- Icon buttons: Settings, Contacts, Calls, Archived, Saved, Business
- Active state: filled accent circle behind icon
- Hover: subtle background + scale(1.05)
- Avatar at bottom with online indicator dot
- Unread count badges (pill shape, accent bg)

CHAT LIST ITEM:
- Height: 72px
- Avatar: 52px circle with online indicator (10px dot, green, white border)
- Contact name: --text-lg, --text-primary, font-semibold
- Last message preview: --text-sm, --text-secondary, truncate
- Timestamp: --text-xs, --text-timestamp, top-right
- Unread badge: --accent-primary bg, white text, min-w 20px, pill
- Verified business: blue checkmark badge on avatar
- Pinned: pin icon (--text-tertiary)
- Muted: muted icon replacing unread badge
- Hover: --bg-hover transition 150ms
- Selected: --bg-selected persistent

MESSAGE BUBBLE:
Outgoing:
- Background: --bg-message-out (blue)
- Border-radius: 18px 18px 4px 18px
- Max-width: 65%
- Padding: 8px 12px
- Tail: custom SVG tail bottom-right
- Status icon: single tick → double tick → blue ticks (animated)
- Timestamp: bottom-right, --text-xs, semi-transparent white

Incoming:
- Background: --bg-message-in
- Border-radius: 18px 18px 18px 4px
- Tail: custom SVG tail bottom-left
- Sender name (in groups): colored by hash of name

Consecutive messages:
- Same sender within 5min: reduce border-radius on connected side
- Show timestamp only on last message in a run

MESSAGE INPUT BAR:
- Height: 56px min, auto-expand to 200px max
- Frosted glass background
- Left: Emoji picker button (animated panel)
- Left: Attachment menu (expandable arc of options)
- Center: Auto-resize textarea
- Right: Voice record button (hold) / Send button (when text)
- Voice recording: waveform visualization, red dot, timer
- Attach preview strip above input bar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESPONSIVE BEHAVIOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MOBILE (< 640px):
- Full-screen chat list (no sidebar visible when in chat)
- Bottom navigation bar (5 items) replaces nav rail
- Swipe right to go back from chat
- Swipe right on chat item to reveal quick actions
- FAB for new chat (bottom-right, accent gradient)
- Pull-to-refresh on chat list
- Virtual keyboard handling: input bar stays above keyboard
- Safe area insets (notch, home indicator)

TABLET (640px–1024px):
- Persistent sidebar (280px) + chat view
- Collapsible info panel
- Nav rail (52px)

DESKTOP (> 1024px):
- Full three-panel layout
- Keyboard shortcuts (Cmd/Ctrl+K search, etc.)
- Drag-and-drop file sharing
- System notifications
- Mini player for voice/video

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MICRO-INTERACTIONS CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ ] Send button morphs: mic → send (scale + rotate transition)
[ ] Message double-tap opens reaction picker
[ ] Long-press message shows context menu with haptic
[ ] Swipe message to reply (reveal reply indicator)
[ ] Pinch-to-zoom on images
[ ] Avatar tap opens profile card (spring animation)
[ ] Typing indicator appears with staggered dot bounce
[ ] Read receipt ticks animate individually (cascade)
[ ] Voice message seek bar with waveform
[ ] Photo gallery swipe with momentum
[ ] Notification bell shake on new message
[ ] Search bar expands with smooth width transition
[ ] Badge number animates on increment/decrement
[ ] Dark/light mode toggle with circular reveal animation
```

---

## 4. FEATURE LIST

### 💬 Core Messaging
- [ ] Text messages with full Unicode + emoji support
- [ ] Rich text formatting (bold, italic, strikethrough, monospace, spoiler)
- [ ] Reply to specific messages (with preview)
- [ ] Forward messages (single or multiple)
- [ ] Delete messages (for me / for everyone, with time limit)
- [ ] Edit sent messages (with "edited" label + history)
- [ ] Pin messages in chat
- [ ] Starring/bookmarking messages
- [ ] Message search within chat
- [ ] Copy, share, select multiple messages
- [ ] Message reactions (emoji reactions with counts)
- [ ] Message threads/replies
- [ ] Scheduled messages
- [ ] Disappearing messages (timer-based)
- [ ] Draft messages (auto-saved)

### 📎 Media & Files
- [ ] Photo sharing (single + albums up to 10)
- [ ] Video sharing + inline playback
- [ ] Voice messages (record, waveform, playback speed)
- [ ] Video messages (circular, 60s max)
- [ ] Document sharing (PDF, DOC, XLS, ZIP, etc.)
- [ ] Contact card sharing
- [ ] Location sharing (static + live location)
- [ ] GIF support with search
- [ ] Sticker packs (animated + static)
- [ ] Audio files
- [ ] File size up to 2GB

### 👤 Contacts & Profiles
- [ ] Phone number + QR code registration
- [ ] Profile photo with crop/zoom
- [ ] Username (searchable)
- [ ] Bio/about section
- [ ] Last seen & online status
- [ ] Privacy controls per field
- [ ] Contact sync from phone
- [ ] Block/unblock contacts
- [ ] Report users
- [ ] Contact info view with shared media
- [ ] Mutual groups display
- [ ] Custom notifications per contact

### 👥 Groups
- [ ] Create group with photo + description
- [ ] Up to 1024 members
- [ ] Admin roles (owner, admin, member)
- [ ] Admin permissions (who can send, add members, change info)
- [ ] Invite links (with expiry + revoke)
- [ ] Join via QR code
- [ ] Member list with admin badges
- [ ] Mention @username in groups
- [ ] Group notifications (all, mentions only, off)
- [ ] Leave group / remove members
- [ ] Promote/demote admins
- [ ] Slow mode (message cooldown)
- [ ] Locked/restricted groups
- [ ] Group call (audio + video)
- [ ] Pinned messages (multiple)
- [ ] Group statistics (admin only)

### 📢 Broadcast / Channels
- [ ] Create broadcast list
- [ ] Send to multiple contacts at once
- [ ] Channel creation (one-way communication)
- [ ] Subscriber management
- [ ] Channel analytics
- [ ] Post with rich formatting
- [ ] Scheduled posts

### 📞 Calls
- [ ] 1:1 Voice calls (WebRTC)
- [ ] 1:1 Video calls (WebRTC)
- [ ] Group voice calls (up to 32)
- [ ] Group video calls (up to 8 visible)
- [ ] Call history (missed, incoming, outgoing)
- [ ] Screen sharing during video call
- [ ] Noise cancellation toggle
- [ ] Call recording (local)
- [ ] Ringtone customization
- [ ] Call forwarding

### 🏢 WhatsApp Business Features
- [ ] Business profile (name, category, description, email, website, address, hours)
- [ ] Verified business badge
- [ ] Product catalog (items with photo, name, price, description, link)
- [ ] Collections (group products)
- [ ] Cart functionality for customers
- [ ] Quick replies (keyboard shortcuts for canned responses)
- [ ] Labels (color-coded tags for chats: New Customer, Pending, Resolved, etc.)
- [ ] Automated messages:
  - [ ] Away message (with schedule)
  - [ ] Greeting message (first contact)
  - [ ] Quick replies
- [ ] Business statistics:
  - [ ] Messages sent/delivered/read
  - [ ] Response time metrics
  - [ ] Active chats over time
  - [ ] Popular message templates
- [ ] Message templates (approved templates for outbound)
- [ ] Interactive messages:
  - [ ] Buttons (up to 3 reply buttons)
  - [ ] List messages (up to 10 options)
  - [ ] Call-to-action buttons
- [ ] Payment integration hooks
- [ ] Customer chat widget (embed code generator)
- [ ] Multi-agent / team inbox
  - [ ] Assign chats to agents
  - [ ] Agent availability status
  - [ ] Internal notes (not visible to customer)
  - [ ] Chat transfer between agents
- [ ] Chatbot builder (flow-based, no-code)
  - [ ] Trigger keywords
  - [ ] Response flows
  - [ ] Fallback to human agent
- [ ] CRM integration hooks (webhook builder)
- [ ] API access panel (generate API keys)

### 🔒 Privacy & Security
- [ ] End-to-end encryption indicator
- [ ] Two-step verification (PIN + email)
- [ ] Biometric lock (fingerprint / Face ID via Capacitor)
- [ ] Privacy settings:
  - [ ] Last seen (everyone / contacts / nobody)
  - [ ] Profile photo visibility
  - [ ] About visibility
  - [ ] Read receipts toggle
  - [ ] Online status visibility
- [ ] Blocked contacts list
- [ ] Chat lock (individual chat PIN/biometric)
- [ ] Screen security (prevent screenshots — Android)
- [ ] Incognito keyboard option
- [ ] Session management (active devices)

### ⚙️ Settings & Customization
- [ ] Theme switcher (Dark / Light / System)
- [ ] Chat wallpaper (solid, gradient, pattern, photo)
- [ ] Font size adjustment
- [ ] Notification settings (sounds, vibration, pop-up)
- [ ] Storage usage viewer + cleaner
- [ ] Data & storage (auto-download rules per network)
- [ ] Language selection
- [ ] Chat backup (local + cloud)
- [ ] Chat export
- [ ] Linked devices (QR scan to web/desktop)
- [ ] App lock settings
- [ ] Keyboard shortcuts panel (desktop)

### 🔔 Notifications
- [ ] Push notifications (FCM via Capacitor)
- [ ] Desktop notifications (Electron)
- [ ] In-app notification center
- [ ] Notification grouping
- [ ] Quick reply from notification
- [ ] Mark as read from notification
- [ ] Silent hours / Do Not Disturb

---

## 5. DATABASE SCHEMA (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── USERS ───────────────────────────────────────────

model User {
  id                String    @id @default(cuid())
  phone             String    @unique
  username          String?   @unique
  name              String
  about             String?   @default("Hey there! I am using NexChat.")
  avatarUrl         String?
  isOnline          Boolean   @default(false)
  lastSeen          DateTime  @default(now())
  isVerifiedBusiness Boolean  @default(false)
  twoFactorEnabled  Boolean   @default(false)
  twoFactorPin      String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Privacy settings
  privacy           UserPrivacy?

  // Business profile
  businessProfile   BusinessProfile?

  // Relationships
  sentMessages      Message[]         @relation("SentMessages")
  contacts          Contact[]         @relation("UserContacts")
  contactOf         Contact[]         @relation("ContactOf")
  groupMembers      GroupMember[]
  sessions          Session[]
  calls             CallParticipant[]
  blockedUsers      Block[]           @relation("Blocker")
  blockedBy         Block[]           @relation("Blocked")
  starredMessages   StarredMessage[]
  devices           Device[]
  notifications     Notification[]
}

model UserPrivacy {
  id              String  @id @default(cuid())
  userId          String  @unique
  user            User    @relation(fields: [userId], references: [id])
  lastSeen        Privacy @default(EVERYONE)
  profilePhoto    Privacy @default(EVERYONE)
  about           Privacy @default(EVERYONE)
  readReceipts    Boolean @default(true)
  onlineStatus    Privacy @default(EVERYONE)
  groupsAdd       Privacy @default(EVERYONE)
}

enum Privacy {
  EVERYONE
  CONTACTS
  NOBODY
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique
  deviceId  String?
  platform  String?
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Device {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  deviceName  String
  platform    String   // web, android, ios, desktop
  pushToken   String?
  isActive    Boolean  @default(true)
  lastActive  DateTime @default(now())
  createdAt   DateTime @default(now())
}

// ─── CONTACTS ────────────────────────────────────────

model Contact {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation("UserContacts", fields: [userId], references: [id])
  contactId   String
  contact     User     @relation("ContactOf", fields: [contactId], references: [id])
  nickname    String?
  isFavorite  Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@unique([userId, contactId])
}

model Block {
  id          String   @id @default(cuid())
  blockerId   String
  blocker     User     @relation("Blocker", fields: [blockerId], references: [id])
  blockedId   String
  blocked     User     @relation("Blocked", fields: [blockedId], references: [id])
  createdAt   DateTime @default(now())

  @@unique([blockerId, blockedId])
}

// ─── CHATS ───────────────────────────────────────────

model Chat {
  id            String      @id @default(cuid())
  type          ChatType    @default(DIRECT)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // For direct chats
  participants  ChatParticipant[]

  // For group chats
  group         Group?

  // Messages
  messages      Message[]
  pinnedMessages PinnedMessage[]

  // Labels (Business)
  labels        ChatLabel[]
}

enum ChatType {
  DIRECT
  GROUP
  BROADCAST
  CHANNEL
}

model ChatParticipant {
  id                String    @id @default(cuid())
  chatId            String
  chat              Chat      @relation(fields: [chatId], references: [id])
  userId            String
  wallpaper         String?
  mutedUntil        DateTime?
  archivedAt        DateTime?
  lastReadAt        DateTime  @default(now())
  disappearingTimer Int?      // seconds
  createdAt         DateTime  @default(now())

  @@unique([chatId, userId])
}

// ─── GROUPS ──────────────────────────────────────────

model Group {
  id            String         @id @default(cuid())
  chatId        String         @unique
  chat          Chat           @relation(fields: [chatId], references: [id])
  name          String
  description   String?
  avatarUrl     String?
  inviteLink    String?        @unique
  inviteLinkExpiry DateTime?
  slowModeSeconds Int?
  isRestricted  Boolean        @default(false)
  maxMembers    Int            @default(1024)
  createdById   String
  createdAt     DateTime       @default(now())

  members       GroupMember[]
}

model GroupMember {
  id          String      @id @default(cuid())
  groupId     String
  group       Group       @relation(fields: [groupId], references: [id])
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  role        GroupRole   @default(MEMBER)
  permissions Json?       // Override default permissions
  joinedAt    DateTime    @default(now())
  addedById   String?

  @@unique([groupId, userId])
}

enum GroupRole {
  OWNER
  ADMIN
  MEMBER
}

// ─── MESSAGES ────────────────────────────────────────

model Message {
  id              String          @id @default(cuid())
  chatId          String
  chat            Chat            @relation(fields: [chatId], references: [id])
  senderId        String
  sender          User            @relation("SentMessages", fields: [senderId], references: [id])
  type            MessageType     @default(TEXT)
  content         String?
  mediaUrl        String?
  mediaType       String?         // mime type
  mediaSize       Int?            // bytes
  mediaDuration   Int?            // seconds for audio/video
  mediaThumbnail  String?         // base64 or url
  mediaWidth      Int?
  mediaHeight     Int?
  fileName        String?
  latitude        Float?
  longitude       Float?
  locationName    String?
  isLiveLocation  Boolean         @default(false)
  expiresAt       DateTime?       // disappearing messages
  isEdited        Boolean         @default(false)
  editHistory     Json[]          @default([])
  isDeleted       Boolean         @default(false)
  deletedAt       DateTime?
  deletedFor      String[]        @default([]) // userIds for "delete for me"
  replyToId       String?
  replyTo         Message?        @relation("MessageReplies", fields: [replyToId], references: [id])
  replies         Message[]       @relation("MessageReplies")
  forwardedFromId String?
  scheduledAt     DateTime?
  sentAt          DateTime?
  createdAt       DateTime        @default(now())

  // Delivery status
  statuses        MessageStatus[]

  // Reactions
  reactions       Reaction[]

  // Pinned
  pinnedIn        PinnedMessage[]

  // Starred
  starredBy       StarredMessage[]

  // Business interactive
  interactiveData Json?           // buttons, list, etc.
}

enum MessageType {
  TEXT
  IMAGE
  VIDEO
  AUDIO
  VOICE
  VIDEO_NOTE
  DOCUMENT
  STICKER
  GIF
  LOCATION
  LIVE_LOCATION
  CONTACT_CARD
  SYSTEM
  INTERACTIVE_BUTTONS
  INTERACTIVE_LIST
  TEMPLATE
  PRODUCT
  ORDER
}

model MessageStatus {
  id          String        @id @default(cuid())
  messageId   String
  message     Message       @relation(fields: [messageId], references: [id])
  userId      String
  status      DeliveryStatus @default(SENT)
  updatedAt   DateTime      @updatedAt

  @@unique([messageId, userId])
}

enum DeliveryStatus {
  SENDING
  SENT
  DELIVERED
  READ
  FAILED
}

model Reaction {
  id          String   @id @default(cuid())
  messageId   String
  message     Message  @relation(fields: [messageId], references: [id])
  userId      String
  emoji       String
  createdAt   DateTime @default(now())

  @@unique([messageId, userId, emoji])
}

model PinnedMessage {
  id          String   @id @default(cuid())
  chatId      String
  chat        Chat     @relation(fields: [chatId], references: [id])
  messageId   String
  message     Message  @relation(fields: [messageId], references: [id])
  pinnedById  String
  pinnedAt    DateTime @default(now())
}

model StarredMessage {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  messageId   String
  message     Message  @relation(fields: [messageId], references: [id])
  createdAt   DateTime @default(now())

  @@unique([userId, messageId])
}

// ─── CALLS ───────────────────────────────────────────

model Call {
  id            String              @id @default(cuid())
  type          CallType
  status        CallStatus
  chatId        String?
  startedAt     DateTime            @default(now())
  endedAt       DateTime?
  duration      Int?                // seconds
  participants  CallParticipant[]
}

enum CallType { VOICE, VIDEO, GROUP_VOICE, GROUP_VIDEO }
enum CallStatus { RINGING, ONGOING, ENDED, MISSED, DECLINED }

model CallParticipant {
  id          String   @id @default(cuid())
  callId      String
  call        Call     @relation(fields: [callId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  joinedAt    DateTime?
  leftAt      DateTime?

  @@unique([callId, userId])
}

// ─── BUSINESS ────────────────────────────────────────

model BusinessProfile {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
  businessName  String
  category      String
  description   String?
  email         String?
  website       String?
  address       String?
  latitude      Float?
  longitude     Float?
  workingHours  Json?     // { mon: { open: "09:00", close: "17:00" }, ... }
  greetingMsg   String?
  awayMsg       String?
  awaySchedule  Json?
  createdAt     DateTime  @default(now())

  products      Product[]
  quickReplies  QuickReply[]
  labels        Label[]
  templates     MessageTemplate[]
  apiKeys       ApiKey[]
  stats         BusinessStats[]
}

model Product {
  id              String          @id @default(cuid())
  businessId      String
  business        BusinessProfile @relation(fields: [businessId], references: [id])
  name            String
  description     String?
  price           Float?
  currency        String          @default("INR")
  imageUrl        String?
  link            String?
  isAvailable     Boolean         @default(true)
  collectionId    String?
  collection      Collection?     @relation(fields: [collectionId], references: [id])
  createdAt       DateTime        @default(now())
}

model Collection {
  id          String    @id @default(cuid())
  businessId  String
  name        String
  imageUrl    String?
  products    Product[]
  createdAt   DateTime  @default(now())
}

model QuickReply {
  id          String          @id @default(cuid())
  businessId  String
  business    BusinessProfile @relation(fields: [businessId], references: [id])
  shortcut    String          // e.g., "/thanks"
  message     String
  mediaUrl    String?
  createdAt   DateTime        @default(now())

  @@unique([businessId, shortcut])
}

model Label {
  id          String          @id @default(cuid())
  businessId  String
  business    BusinessProfile @relation(fields: [businessId], references: [id])
  name        String
  color       String          // hex color
  createdAt   DateTime        @default(now())

  chatLabels  ChatLabel[]
}

model ChatLabel {
  id          String   @id @default(cuid())
  chatId      String
  chat        Chat     @relation(fields: [chatId], references: [id])
  labelId     String
  label       Label    @relation(fields: [labelId], references: [id])
  assignedAt  DateTime @default(now())

  @@unique([chatId, labelId])
}

model MessageTemplate {
  id          String          @id @default(cuid())
  businessId  String
  business    BusinessProfile @relation(fields: [businessId], references: [id])
  name        String
  category    String
  language    String          @default("en")
  body        String
  header      String?
  footer      String?
  buttons     Json?
  status      String          @default("APPROVED")
  createdAt   DateTime        @default(now())
}

model ApiKey {
  id          String          @id @default(cuid())
  businessId  String
  business    BusinessProfile @relation(fields: [businessId], references: [id])
  name        String
  keyHash     String          @unique
  permissions String[]
  lastUsed    DateTime?
  createdAt   DateTime        @default(now())
  expiresAt   DateTime?
}

model BusinessStats {
  id              String          @id @default(cuid())
  businessId      String
  business        BusinessProfile @relation(fields: [businessId], references: [id])
  date            DateTime
  messagesSent    Int             @default(0)
  messagesDelivered Int           @default(0)
  messagesRead    Int             @default(0)
  activeChats     Int             @default(0)
  newContacts     Int             @default(0)
  avgResponseTime Float?          // seconds

  @@unique([businessId, date])
}

// ─── NOTIFICATIONS ───────────────────────────────────

model Notification {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  type      String
  title     String
  body      String
  data      Json?
  isRead    Boolean   @default(false)
  createdAt DateTime  @default(now())
}
```

---

## 6. BACKEND API PROMPT

```
Build a production-grade Express.js + TypeScript REST API and Socket.io real-time
server with the following requirements:

PROJECT STRUCTURE:
apps/server/src/
├── index.ts              # Entry point
├── app.ts                # Express app setup
├── socket.ts             # Socket.io setup
├── routes/
│   ├── auth.routes.ts
│   ├── users.routes.ts
│   ├── chats.routes.ts
│   ├── messages.routes.ts
│   ├── groups.routes.ts
│   ├── calls.routes.ts
│   ├── business.routes.ts
│   ├── media.routes.ts
│   └── notifications.routes.ts
├── middleware/
│   ├── auth.middleware.ts    # JWT verification
│   ├── validate.middleware.ts # Zod schema validation
│   ├── rateLimit.middleware.ts
│   ├── upload.middleware.ts   # Multer config
│   └── error.middleware.ts
├── services/
│   ├── auth.service.ts
│   ├── message.service.ts
│   ├── media.service.ts      # S3/local upload
│   ├── notification.service.ts # FCM push
│   ├── call.service.ts       # WebRTC signaling
│   └── business.service.ts
├── socket/
│   ├── handlers/
│   │   ├── message.handler.ts
│   │   ├── typing.handler.ts
│   │   ├── presence.handler.ts
│   │   └── call.handler.ts
│   └── rooms.ts              # Room management
└── lib/
    ├── prisma.ts
    ├── redis.ts              # Presence, rate limiting
    ├── jwt.ts
    └── s3.ts

KEY REQUIREMENTS:
1. JWT authentication with refresh tokens
2. Phone number OTP verification (via SMS gateway)
3. File uploads: images, videos, audio, documents (Multer + S3)
4. WebRTC signaling via Socket.io (ICE candidates, SDP exchange)
5. Real-time events: message, typing, presence, reactions, delivery
6. Rate limiting: 1000 req/hour general, 100 req/min per user
7. Zod validation on all inputs
8. Prisma transactions for atomic operations
9. Redis for:
   - Online presence tracking
   - Typing indicators (expire in 3s)
   - Session storage
   - Rate limiting counters
10. Proper error handling with custom error classes
11. Request logging (Morgan)
12. CORS configured for all client origins
13. Helmet.js security headers
14. API versioning (/api/v1/)

SOCKET.IO EVENTS TO IMPLEMENT:
Client → Server:
- join_chat(chatId)
- leave_chat(chatId)
- send_message(payload)
- typing_start(chatId)
- typing_stop(chatId)
- message_delivered(messageId)
- message_read(messageId[])
- add_reaction(messageId, emoji)
- call_initiate(targetUserId, type)
- call_accept(callId)
- call_decline(callId)
- call_end(callId)
- ice_candidate(callId, candidate)
- sdp_offer(callId, sdp)
- sdp_answer(callId, sdp)

Server → Client:
- new_message(message)
- message_updated(message)
- message_deleted(messageId)
- user_typing(chatId, userId)
- user_stop_typing(chatId, userId)
- message_status_updated(messageId, status)
- reaction_updated(messageId, reactions)
- user_online(userId)
- user_offline(userId, lastSeen)
- call_incoming(callData)
- call_ended(callId, reason)
- ice_candidate(callId, candidate)
- sdp_offer(callId, sdp)
- sdp_answer(callId, sdp)
- chat_updated(chat)
- group_updated(group)
```

---

## 7. FRONTEND ARCHITECTURE PROMPT

```
Build a React + TypeScript SPA with the following architecture.
Every component must implement the design system defined above.

━━━━ ZUSTAND STORES ━━━━

1. useAuthStore
   - user: User | null
   - token: string | null
   - isAuthenticated: boolean
   - login(phone, otp) → void
   - logout() → void
   - updateProfile(data) → void

2. useChatStore
   - chats: Chat[]
   - activeChatId: string | null
   - setActiveChat(id) → void
   - addMessage(chatId, message) → void
   - updateMessageStatus(messageId, status) → void
   - setTyping(chatId, userId, isTyping) → void
   - typingUsers: Record<chatId, userId[]>
   - unreadCounts: Record<chatId, number>
   - draftMessages: Record<chatId, string>

3. useUIStore
   - theme: 'dark' | 'light' | 'system'
   - sidebarOpen: boolean
   - infoPanelOpen: boolean
   - activeModal: string | null
   - setTheme(theme) → void
   - openModal(name, props) → void
   - closeModal() → void
   - searchQuery: string
   - isMobile: boolean

4. useCallStore
   - activeCall: Call | null
   - localStream: MediaStream | null
   - remoteStreams: Record<userId, MediaStream>
   - callStatus: CallStatus
   - isMuted: boolean
   - isVideoOff: boolean
   - initiateCall(userId, type) → void
   - endCall() → void
   - toggleMute() → void
   - toggleVideo() → void

5. useBusinessStore
   - businessProfile: BusinessProfile | null
   - labels: Label[]
   - quickReplies: QuickReply[]
   - templates: MessageTemplate[]
   - stats: BusinessStats[]

━━━━ REACT QUERY SETUP ━━━━

Configure React Query with:
- staleTime: 30 seconds for messages, 5 min for profiles
- gcTime: 10 minutes
- retry: 2 attempts with exponential backoff
- refetchOnWindowFocus: true
- Optimistic updates for message sending
- Infinite query for message history (cursor-based pagination)
- Prefetching: prefetch adjacent chats on hover

━━━━ KEY PAGES ━━━━

/auth/phone       — Phone number entry
/auth/otp         — OTP verification
/auth/profile     — Profile setup (name, avatar)
/                 — Main chat layout
/chat/:id         — Active chat (nested route)
/calls            — Call history
/contacts         — Contact list
/settings         — Settings hub
/settings/*       — Settings sub-pages
/business         — Business hub
/business/catalog — Product catalog
/business/stats   — Analytics dashboard
/business/tools   — Quick replies, labels, templates

━━━━ COMPONENT ARCHITECTURE ━━━━

Every component must:
1. Be fully typed with TypeScript
2. Use shadcn/ui primitives where applicable
3. Follow the design system (colors, spacing, typography)
4. Include loading, error, and empty states
5. Be responsive (mobile-first)
6. Use CSS transitions matching the animation system
7. Support both dark and light themes via CSS variables

━━━━ PERFORMANCE REQUIREMENTS ━━━━

- Message list: virtualized (react-virtual or @tanstack/virtual)
- Images: lazy loading + intersection observer
- Heavy components: React.lazy() + Suspense
- Media: progressive loading with blur placeholder
- Large chat lists: windowed rendering
- Debounce search inputs (300ms)
- Throttle scroll events
- Service Worker for offline support
```

---

## 8. MOBILE APK SETUP (Capacitor)

```
Build a production Android APK using Capacitor with these requirements:

capacitor.config.ts:
{
  appId: 'com.nexchat.business',
  appName: 'NexChat Business',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
    LocalNotifications: { smallIcon: 'ic_stat_icon_config_sample' },
    Camera: { permissions: ['camera', 'photos'] },
    Filesystem: {},
    Haptics: {},
    StatusBar: { style: 'DARK', backgroundColor: '#0E1621' },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0E1621',
      showSpinner: false
    }
  }
}

REQUIRED CAPACITOR PLUGINS:
- @capacitor/push-notifications (FCM)
- @capacitor/local-notifications
- @capacitor/camera
- @capacitor/filesystem
- @capacitor/haptics
- @capacitor/status-bar
- @capacitor/splash-screen
- @capacitor/share
- @capacitor/clipboard
- @capacitor/network
- @capacitor/device
- @capacitor/app
- @capacitor-community/sqlite (local cache)
- @capacitor-community/background-runner

ANDROID-SPECIFIC:
- AndroidManifest.xml: permissions for CAMERA, RECORD_AUDIO,
  READ/WRITE_EXTERNAL_STORAGE, INTERNET, RECEIVE_BOOT_COMPLETED,
  VIBRATE, FOREGROUND_SERVICE, USE_BIOMETRIC
- Custom splash screen (1080x1920)
- Custom app icons (all densities)
- ProGuard rules for release build
- App signing config in build.gradle
- Target SDK: 34, Min SDK: 26
- Enable multidex
- Enable R8 full mode
```

---

## 9. DESKTOP APP SETUP (Electron)

```
Build an Electron desktop app wrapping the React app:

electron/main.ts requirements:
- Window: 1200x800 min, remember last size/position
- Frameless window with custom title bar on Windows
- Native macOS traffic lights
- System tray icon with unread badge count
- Global shortcuts: Cmd/Ctrl+Shift+M to toggle
- Auto-updater (electron-updater)
- Deep linking: nexchat:// protocol
- Native notifications with action buttons
- File drag-and-drop to chat window
- Desktop media capture for screen share
- Secure storage for tokens (keytar)
- IPC channels for: notifications, file ops, media capture
- Single instance lock
- Crash reporter setup
```

---

## 10. REAL-TIME LAYER (WebSocket)

```
Implement Socket.io with these requirements:

CONNECTION LIFECYCLE:
1. Client connects with JWT in auth header
2. Server validates token, joins user to personal room (user:{id})
3. Server joins user to all their chat rooms
4. Server marks user online in Redis (SET user:online:{id} 1 EX 30)
5. Server emits user_online to all contacts
6. On disconnect: mark offline, emit user_offline with lastSeen

PRESENCE SYSTEM:
- Heartbeat every 25 seconds from client
- Redis key expires in 30s (miss 1 heartbeat = offline)
- Batch presence updates (debounce 500ms before emitting)

MESSAGE FLOW:
Client sends → Server validates → Saves to DB → 
Emits to chat room → Returns ack to sender → 
Recipients emit delivered → Sender updates status

TYPING INDICATORS:
- Client emits typing_start → Server sets Redis key (SETEX typing:{chatId}:{userId} 3 1)
- Server emits user_typing to chat room (excluding sender)  
- Auto-clears after 3s via Redis TTL
- Client emits typing_stop on blur/send

WEBRTC SIGNALING:
- Rooms: call:{callId}
- Relay ICE candidates faithfully
- Handle SDP offer/answer exchange
- Detect and handle disconnection during call
```

---

## 11. COMPLETE CLI COMMAND SEQUENCE

```bash
# ═══════════════════════════════════════════════
# PHASE 1: PROJECT SCAFFOLDING
# ═══════════════════════════════════════════════

# Create monorepo
mkdir nexchat-business && cd nexchat-business
npm init -y
npm install -g turbo

# Setup Turborepo
npx create-turbo@latest . --skip-install

# Create apps
mkdir -p apps/web apps/server packages/shared

# ═══════════════════════════════════════════════
# PHASE 2: FRONTEND SETUP
# ═══════════════════════════════════════════════

cd apps/web
npm create vite@latest . -- --template react-ts

# Core dependencies
npm install \
  react-router-dom \
  @tanstack/react-query \
  @tanstack/react-virtual \
  zustand \
  socket.io-client \
  axios \
  date-fns \
  zod \
  react-hook-form \
  @hookform/resolvers

# UI Framework
npm install \
  tailwindcss \
  @tailwindcss/vite \
  postcss \
  autoprefixer

npx shadcn@latest init
# Choose: TypeScript, Default, CSS variables, src/components/ui

# Install all shadcn components
npx shadcn@latest add \
  accordion alert alert-dialog avatar badge breadcrumb button \
  calendar card carousel chart checkbox collapsible command \
  context-menu dialog drawer dropdown-menu form hover-card \
  input input-otp label menubar navigation-menu pagination \
  popover progress radio-group resizable scroll-area select \
  separator sheet skeleton slider sonner switch table tabs \
  textarea toast toggle toggle-group tooltip

# Media & rich content
npm install \
  emoji-picker-react \
  react-dropzone \
  wavesurfer.js \
  @vidstack/react \
  react-image-crop \
  react-pdf \
  qrcode.react \
  react-map-gl \
  mapbox-gl

# Animation
npm install \
  framer-motion \
  @formkit/auto-animate

# Icons
npm install lucide-react

# Fonts
npm install @fontsource/plus-jakarta-sans @fontsource/inter @fontsource/jetbrains-mono

# ═══════════════════════════════════════════════
# PHASE 3: BACKEND SETUP
# ═══════════════════════════════════════════════

cd ../server
npm init -y
npm install typescript ts-node-dev @types/node --save-dev

npm install \
  express \
  socket.io \
  prisma \
  @prisma/client \
  zod \
  jsonwebtoken \
  bcryptjs \
  multer \
  cors \
  helmet \
  morgan \
  compression \
  express-rate-limit \
  redis \
  ioredis \
  dotenv \
  uuid \
  twilio \
  @aws-sdk/client-s3 \
  @aws-sdk/s3-request-presigner

npm install --save-dev \
  @types/express \
  @types/cors \
  @types/morgan \
  @types/multer \
  @types/jsonwebtoken \
  @types/bcryptjs \
  @types/uuid

# Init Prisma
npx prisma init --datasource-provider postgresql

# ═══════════════════════════════════════════════
# PHASE 4: CAPACITOR SETUP
# ═══════════════════════════════════════════════

cd ../web
npm install \
  @capacitor/core \
  @capacitor/cli \
  @capacitor/android \
  @capacitor/ios \
  @capacitor/push-notifications \
  @capacitor/local-notifications \
  @capacitor/camera \
  @capacitor/filesystem \
  @capacitor/haptics \
  @capacitor/status-bar \
  @capacitor/splash-screen \
  @capacitor/share \
  @capacitor/clipboard \
  @capacitor/network \
  @capacitor/device \
  @capacitor/app \
  @capacitor-community/sqlite

npx cap init NexChatBusiness com.nexchat.business --web-dir dist
npx cap add android
npx cap add ios

# Build and sync
npm run build
npx cap sync

# Open in Android Studio
npx cap open android

# Generate signed APK (after Android Studio setup)
# Build → Generate Signed Bundle/APK → APK → Configure keystore

# ═══════════════════════════════════════════════
# PHASE 5: ELECTRON SETUP
# ═══════════════════════════════════════════════

cd ../web
npm install --save-dev \
  electron \
  electron-builder \
  electron-updater \
  concurrently \
  wait-on

npm install \
  keytar

# ═══════════════════════════════════════════════
# PHASE 6: DATABASE
# ═══════════════════════════════════════════════

cd ../server

# Apply schema
npx prisma generate
npx prisma db push

# Seed data
npx prisma db seed

# ═══════════════════════════════════════════════
# PHASE 7: TAILWIND CONFIG
# ═══════════════════════════════════════════════

# tailwind.config.ts (in web/)
# Add to extend:
# - All CSS variables from design system
# - Custom animations
# - Custom box-shadows
# - Custom border-radius values
# - Container queries plugin
# - Animate plugin

npm install \
  tailwindcss-animate \
  @tailwindcss/container-queries \
  @tailwindcss/typography

# ═══════════════════════════════════════════════
# PHASE 8: DOCKER SETUP
# ═══════════════════════════════════════════════

# docker-compose.yml at root:
# services:
#   postgres: postgres:16-alpine (port 5432)
#   redis: redis:7-alpine (port 6379)
#   minio: minio/minio (ports 9000, 9001) — local S3

docker-compose up -d

# ═══════════════════════════════════════════════
# PHASE 9: ENV SETUP
# ═══════════════════════════════════════════════

# apps/server/.env
cat << EOF > apps/server/.env
DATABASE_URL=postgresql://postgres:password@localhost:5432/nexchat
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=nexchat-media
AWS_REGION=us-east-1
FCM_SERVER_KEY=your-fcm-key
PORT=3001
NODE_ENV=development
EOF

# apps/web/.env
cat << EOF > apps/web/.env
VITE_API_URL=http://localhost:3001/api/v1
VITE_SOCKET_URL=http://localhost:3001
VITE_MAPBOX_TOKEN=your-mapbox-token
EOF

# ═══════════════════════════════════════════════
# PHASE 10: START DEVELOPMENT
# ═══════════════════════════════════════════════

# Terminal 1 — Backend
cd apps/server && npm run dev

# Terminal 2 — Frontend
cd apps/web && npm run dev

# Terminal 3 — Live reload Capacitor (Android)
cd apps/web && npx cap run android --livereload --external

# Terminal 4 — Electron
cd apps/web && npm run electron:dev
```

---

## 12. AI PROMPTS BY FEATURE

### Prompt 1: Auth Flow
```
Create a complete authentication flow for a messaging app with:
- Phone number input with international dial code picker (all countries)
- Auto-format phone number as user types
- OTP input (6-digit, auto-advance between inputs, paste support)
- OTP resend with 60-second countdown
- Profile setup: name input + avatar upload with crop tool
- Animations: screen-to-screen with slide + fade transitions
- Design: follows the NexChat glassmorphism design system
- Full TypeScript, React Hook Form + Zod validation
- React Query mutations for API calls
- On success: store JWT in zustand + localStorage, redirect to /
```

### Prompt 2: Main Chat Layout
```
Create the main app shell with three-panel layout:
- Left: 72px navigation rail (glass, icons for chats/calls/contacts/settings)
- Center-left: 320px chat list sidebar (glass, search, chat items)
- Center: flex-1 message view (chat header, messages, input bar)
- Right: 380px collapsible info panel
- Chat list item: avatar, name, last message, timestamp, unread badge
- Message bubbles: outgoing (right, blue) / incoming (left, dark)
- Message input: emoji picker, attachments, voice record, send
- Fully responsive: single panel on mobile, slide navigation
- Implement all transitions, hover states, and micro-interactions
- Use react-virtual for message list virtualization
- Real-time typing indicators, online status, read receipts
```

### Prompt 3: Business Dashboard
```
Create a WhatsApp Business feature dashboard with:
- Business profile form (all fields, working hours grid)
- Product catalog with grid view, add/edit/delete products
- Interactive Charts (recharts): messages sent/delivered/read over time,
  response time histogram, active chats gauge
- Labels manager: color picker, create/edit/delete, drag to reorder
- Quick replies: shortcut + message editor, preview panel
- Auto-messages: toggle + rich text editor for greeting/away messages
- Message templates: create, preview, status indicator
- Team inbox: agent list, assign chats, internal notes
- All panels use the glass card design system
- Responsive: stacked on mobile, side-by-side on desktop
```

### Prompt 4: Voice/Video Call UI
```
Create a WebRTC call interface with:
- Incoming call screen: avatar, name, animated ring, accept/decline
- Active call fullscreen view:
  - Remote video (full screen)
  - Local video (pip, draggable)
  - Control bar (bottom, glass): mute, video, speaker, screen share, end
  - Duration timer
  - Participant grid for group calls (up to 8 tiles)
- Minimize to floating widget while in chat
- Call quality indicator
- Implement WebRTC peer connection setup
- Socket.io signaling (offer, answer, ICE candidates)
- Handle camera/mic permissions via Capacitor on mobile
- Smooth transitions for call states
```

### Prompt 5: Media Viewer
```
Create a full-screen media viewer with:
- Photo gallery: swipe left/right with momentum physics
- Pinch-to-zoom on images
- Video player with custom controls (play/pause, seek, volume, fullscreen)
- Voice message player: waveform visualization (wavesurfer.js), 
  playback speed control (1x, 1.5x, 2x), time display
- Document viewer: PDF inline rendering (react-pdf)
- Download button, share button, forward button
- Counter: "3 of 12"
- Transition: expand from thumbnail position (shared element transition)
- Swipe down to close
- Backdrop blur behind viewer
```

---

## 📦 PACKAGE.JSON SCRIPTS REFERENCE

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "android:sync": "npm run build && npx cap sync android",
    "android:run": "npx cap run android",
    "android:open": "npx cap open android",
    "android:build": "npm run build && npx cap sync android && cd android && ./gradlew assembleRelease",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron:build:win": "npm run build && electron-builder --win",
    "electron:build:mac": "npm run build && electron-builder --mac",
    "electron:build:linux": "npm run build && electron-builder --linux"
  }
}
```

---

> **Tip**: Work through features in this order for fastest results:
> 1. Auth + DB + Basic messaging (foundation)
> 2. Real-time layer + delivery status
> 3. Media sharing
> 4. Groups + calls
> 5. Business features
> 6. Settings + privacy
> 7. Capacitor APK build
> 8. Electron build
> 9. Polish: animations, themes, offline support