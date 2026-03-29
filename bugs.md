# BizChat — Ultra-Detailed Feature Prompt
## Focus: Stable Chat System · Catalogue · Cart · Commerce Logic
### Doank Digital · PRD v1.0

---

> **Scope of this prompt:** This is NOT a setup guide. You have already scaffolded the project. This prompt covers ONLY the business logic, edge cases, data contracts, and UI behavior for the three core systems: **Chat**, **Catalogue**, and **Cart/Commerce**. Every rule here is non-negotiable. Implement it exactly.

---

# PART 1 — CHAT SYSTEM (WhatsApp-Grade Stability)

The chat system is the backbone of BizChat. It must feel as instant and reliable as WhatsApp. Every edge case listed below is real and must be handled.

---

## 1.1 MESSAGE SEND FLOW — THE EXACT SEQUENCE

When a user taps Send, this is the **precise sequence of events** — no deviation:

```
1.  User taps Send
2.  Generate a client-side tempId: `msg_${Date.now()}_${Math.random()}`
3.  Immediately push optimistic message to useChatStore messages[chatId]:
      { id: tempId, content, type: 'TEXT', senderId: me, status: 'SENDING',
        createdAt: new Date().toISOString(), isOptimistic: true }
4.  Scroll chat to bottom
5.  Clear the input field
6.  Trigger light haptic (mobile)
7.  Emit socket event: message:send { chatId, content, type, replyToId?, metadata? }
8.  Server receives → persists to DB → emits message:new back to the room
9.  Client receives message:new:
      - If message.senderId === me: replace optimistic message (match by content+timestamp proximity)
        Update: id = real id, status = 'SENT'
      - If message.senderId !== me: append to messages list
10. Server also emits chat:updated to all room members (update chat list preview)
```

**Failure handling:**
- If socket emit times out after 5 seconds → mark optimistic message status: `'FAILED'`
- Show red "!" icon on failed message with tap-to-retry
- Retry re-emits the same message with same tempId so it cannot create a duplicate

---

## 1.2 MESSAGE STATUS — EXACT READ RECEIPT LOGIC

```
SENDING  → Grey clock icon (optimistic, not yet ACK'd by server)
SENT     → Single grey checkmark (server received and persisted)
DELIVERED→ Double grey checkmark (recipient's client connected and received)
READ     → Double TEAL checkmark (recipient opened the chat and saw the message)
FAILED   → Red "!" icon, tap to retry
```

**When to update status:**
- `SENT`: when `message:new` ACK comes back to the sender
- `DELIVERED`: server emits `message:delivered { messageId }` when recipient's socket receives the message
- `READ`: client emits `message:read { chatId, messageId }` when:
  - The chat window is open AND focused (document.hasFocus() === true)
  - The message is within the visible scroll area
  - Only for messages where senderId !== currentUserId
  - Batch: send one `message:read` with the latest messageId in the viewport, not one per message
- Server updates `readAt` on the message record, emits `message:read` back to sender

**Important edge cases:**
- User has chat open but scrolls up — messages NOT in viewport are NOT marked read
- User opens chat → ALL unread messages above the fold are marked read immediately
- Read receipts only go to the original sender — never broadcast to the room

---

## 1.3 CHAT LIST — EXACT DATA REQUIREMENTS

Each item in the chat list must display:

```ts
interface ChatListItem {
  chatId: string
  // Other party's info
  participant: {
    userId: string
    name: string
    avatarUrl: string | null
    isOnline: boolean
    lastSeen: string  // ISO timestamp
  }
  lastMessage: {
    content: string         // Truncated to 40 chars. If image: "📷 Photo". If doc: "📄 Document"
    type: MessageType
    senderId: string        // To show "You: ..." prefix if senderId === me
    createdAt: string
    status: MessageStatus   // Only shown if senderId === me
  } | null
  unreadCount: number       // Count of messages where readAt is null and senderId !== me
  isPinned: boolean
  updatedAt: string         // Used for sort order
}
```

**Sort order:** pinned first (by pinnedAt desc), then by `updatedAt` desc (last message time)

**Smart timestamp logic:**
```
< 1 minute ago     → "just now"
< 60 minutes ago   → "Xm ago"  (e.g. "4m ago")
Today              → "2:34 PM"
Yesterday          → "Yesterday"
This week          → "Mon", "Tue" etc.
Older              → "12 Mar" or "12/3/26"
```

**Unread badge:** Show if unreadCount > 0. Display as number up to 99, then "99+".

**Typing in list preview:** When `typing:indicator` is received for a chat, replace the last message preview text with "typing..." in italic green. Auto-revert after 2s of no typing event.

**Real-time updates:** Every `chat:updated` socket event must trigger a re-sort of the list so the most recently active chat bubbles to the top.

---

## 1.4 CHAT WINDOW — COMPLETE BEHAVIOR SPEC

### Message Grouping
Messages from the same sender within **3 minutes** of each other = a group.
- First message in a group: show avatar (incoming) or no avatar (outgoing)
- Subsequent messages in group: no avatar, reduced top margin (4px instead of 12px)
- Show timestamp only on the LAST message in a group, or if > 3 min gap

### Date Separators
Insert a date separator pill between messages from different calendar days:
```
Today      → "Today"
Yesterday  → "Yesterday"
This year  → "Mon, 12 Mar"
Older      → "12 Mar 2025"
```

### Scroll Behavior
- On initial load: scroll to bottom instantly (no animation)
- On new incoming message:
  - If user is within 150px of bottom → auto-scroll to bottom (smooth)
  - If user is scrolled up → do NOT auto-scroll, show unread badge on scroll-to-bottom FAB
- Scroll-to-bottom FAB: appears when scrolled > 150px from bottom. Shows pending unread count. Tapping scrolls to bottom AND marks messages as read.

### Message Virtualization
Use `react-virtual` (or `@tanstack/virtual`). Config:
- `overscan: 10` — render 10 items above/below viewport
- Reverse layout: newest messages at bottom
- On height change (image load, reaction add): maintain scroll position — do NOT jump

### Cursor Pagination (Load Older Messages)
- Initial load: fetch last 30 messages
- When user scrolls to top → fetch next 30 older messages using cursor (oldest messageId seen)
- Prepend messages, maintain scroll position exactly (store scrollTop before prepend, restore after)
- Show "Loading..." spinner at top while fetching
- When no more messages → show "This is the beginning of your conversation"

### Reply-to-Message
```
Trigger (mobile): Swipe right on a message bubble (>60px swipe = trigger)
Trigger (desktop): Hover on bubble → reply icon button appears

Reply context bar (above input):
  - Left border: 3px solid --color-primary
  - Shows: sender name (bold) + content preview (40 chars) or "Photo" / "Document"
  - "×" button to dismiss
  - Input gets focus automatically

In the sent message:
  - Reply preview card rendered ABOVE the message content
  - Shows replied-to sender name + content snippet
  - Tapping the reply preview → smooth scroll to original message + highlight it (purple bg flash, 800ms)
  - If original message was deleted → show "Original message was deleted" in italic
```

### Emoji Reactions
```
Trigger: Long-press (500ms) on mobile, hover-then-click reaction icon on desktop
Quick picker: 6 emojis = ["❤️", "😂", "👍", "😮", "😢", "🙏"]
Full picker: "+" button opens emoji-picker-react or similar lib

Logic:
  - One reaction per user per message
  - Tapping your own reaction removes it
  - Tapping a different emoji replaces your reaction
  - Reactions shown below the bubble, grouped by emoji with count: "❤️ 2  👍 1"
  - If you reacted: that emoji has a subtle purple bg ring
  - If total reactions > 0: always show reaction bar below message (don't hide)
```

### Delete Message
```
Trigger: Long-press (mobile) → context menu. Hover → "⋮" button → context menu.
Options:
  "Delete for Me"       → sets isDeleted = true, deletedFor = 'SELF'
                          Message hidden for deleter, visible to others as normal
  "Delete for Everyone" → only available within 7 minutes of sending
                          OR if you are the sender
                          Sets isDeleted = true, deletedFor = 'EVERYONE'
                          All clients in the room receive message:deleted { messageId }
                          Replace bubble content with italic grey "This message was deleted"
                          No reactions shown. Reply previews to this message show "Message deleted"
```

### Image Messages
```
In bubble: show with 2:1 or natural aspect ratio (max 280px wide)
Blur-up placeholder: show blurred 20px thumbnail while full image loads
Tap → opens full-screen lightbox:
  - Black bg, image centered
  - Pinch to zoom (mobile), scroll wheel zoom (desktop)
  - Swipe down to dismiss (mobile), ESC or backdrop click (desktop)
  - Download button in top-right corner
```

---

## 1.5 SPECIAL MESSAGE CARDS (in-chat commerce)

These are rendered as distinct card components INSIDE the chat bubble stream. They are NOT regular text bubbles. They have their own layout.

### Product Card
```
Triggered when: business sends product to customer chat
Data (in message.metadata):
  { productId, name, imageUrl, basePrice, fromPrice, hasVariants, businessId }

Visual layout:
  ┌─────────────────────────────────┐
  │  [Product Image — 1:1 square]   │
  ├─────────────────────────────────┤
  │  Product Name (bold)            │
  │  ₹249  (or "From ₹199")         │
  │  [View Product →]  (purple btn) │
  └─────────────────────────────────┘

Width: same as a standard message bubble max-width
"View Product" → navigates to /catalog/:businessId/product/:productId
```

### Shared Cart Card
```
Triggered when: business sends shared cart to customer
Data (in message.metadata): { sharedCartId }
Fetch shared cart details on render (or embed in metadata)

Visual layout:
  ┌─────────────────────────────────┐
  │  🛒 Cart from [Business Name]   │  ← gradient header
  ├─────────────────────────────────┤
  │  • Product A × 2    ₹198        │
  │  • Product B × 1    ₹249        │
  │  + 1 more item                  │  ← if > 2 items
  ├─────────────────────────────────┤
  │  Total: ₹447                    │
  │  [Open Cart]      (purple btn)  │  ← opens SharedCartPage
  ├─────────────────────────────────┤
  │  Status: Pending                │  ← Pending/Viewed/Added/Ordered
  │  Expires: in 2 days (if set)    │
  └─────────────────────────────────┘

If expired: entire card is greyed, button disabled, status = "Expired"
```

### Order Status Card
```
Auto-sent as a chat message every time order status changes
Sender: the business profile (not a real user message — system-generated, displayed differently)
Data (in message.metadata): { orderId, orderNumber, status, itemCount, total }

Visual layout:
  ┌─────────────────────────────────┐
  │  📦 Order #ORD-2026-001         │
  │  Status: [CONFIRMED pill]       │
  │  2 items · ₹447                 │
  │  "Your order has been           │
  │   confirmed!"                   │  ← status-specific copy
  │  [View Order →]                 │
  └─────────────────────────────────┘

Status-specific copy:
  PENDING    → "Order placed! We'll confirm it shortly."
  CONFIRMED  → "Your order has been confirmed!"
  PROCESSING → "Your order is being prepared."
  DISPATCHED → "Your order is on the way! 🚚"
  DELIVERED  → "Order delivered. Enjoy! 🎉"
  CANCELLED  → "This order has been cancelled."
```

---

## 1.6 ONLINE PRESENCE — EXACT RULES

```
isOnline = true:
  Set when: user's socket connects (any device/tab)
  Broadcast: to all users who share a chat with this user
  Format in UI: Green filled dot (8px) beside avatar

isOnline = false + lastSeen:
  Set when: user's socket disconnects AND no reconnect within 30 seconds
  Format in UI: No dot. Show "last seen [smart timestamp]"

Special case — "last seen" privacy:
  Show exact "last seen X:XX PM" only for today
  Yesterday → "last seen yesterday"
  Older → "last seen [date]"
  
  Exception: if isOnline = true → always show "Online", never show last seen

Presence ping:
  Client emits presence:ping every 30 seconds while app is in foreground
  If no ping received for 90 seconds → server marks user offline
  
Typing indicator presence:
  Separate from online status
  Show "typing..." in the chat header (replaces the online/last seen line)
  Auto-clear 2 seconds after last typing:stop event
```

---

## 1.7 INPUT BAR — EXACT BEHAVIOR

```
Component: glass pill, fixed to bottom of chat window, above keyboard on mobile

States:
  EMPTY:   [😊] [                         ] [🎙]
  TYPING:  [😊] [  user's text here...    ] [➤]  ← Send button, purple, scale-in 150ms
  FOCUSED: auto-resize from 1 line to 6 lines max (textarea rows)

Attachment button (📎) — opens bottom sheet on mobile / popover on desktop:
  ┌──────────────────────┐
  │  📷  Image           │  → opens camera/gallery via Capacitor.Camera
  │  📄  Document        │  → opens file picker
  │  🏷  Product Card    │  → opens product search overlay
  │  🛒  Create Cart     │  → navigates to /dashboard/shared-cart/new
  └──────────────────────┘

Typing events:
  On first keypress → emit typing:start { chatId }
  Debounce 2s of inactivity → emit typing:stop { chatId }
  On message send → immediately emit typing:stop { chatId }
  On input blur → immediately emit typing:stop { chatId }

Send behavior:
  Desktop: Enter = send, Shift+Enter = newline
  Mobile: Send button only, Enter = newline
  
  Prevent send if: content.trim() === '' AND no attached media

Emoji picker:
  Opens above input bar
  Does NOT dismiss keyboard on mobile
  Tap emoji → inserts at cursor position in textarea
```

---

# PART 2 — CATALOGUE SYSTEM

---

## 2.1 DATA HIERARCHY — BUSINESS RULES

```
Business
  └── Collections (unlimited, ordered)
        └── Products (belong to 1+ collections; "All Items" is the default catch-all)
              └── VariantGroups (e.g. "Size", "Color") — 0 to N per product
                    └── VariantValues (e.g. "Small", "Red") — 1 to N per group
```

**Key invariants:**
- Every product ALWAYS belongs to the virtual "All Items" collection (not stored in DB — computed)
- A product can belong to multiple collections simultaneously
- A product with ZERO variant groups = "simple product" → add to cart directly
- A product with 1+ variant groups = "variant product" → must select one value per group before adding to cart
- Deleting a collection does NOT delete products — products move to "All Items" only
- Deleting a variant group cascades to delete all its values
- A VariantValue with stock = 0 is "out of stock" — displayed disabled, cannot be added to cart

---

## 2.2 CATALOGUE PAGE (CUSTOMER VIEW)

### Page Structure
```
┌─────────────────────────────────────────────┐
│  Business Cover Image (full width, 200px)   │
│  [Logo] Business Name   Category            │
│  Description (max 2 lines, "read more")     │
│  [Message Business]  [Call: website]        │
├─────────────────────────────────────────────┤
│  Collection Tabs (horizontal scroll):       │
│  [All Items] [Plates] [Cups] [Seasonal]     │  ← sticky on scroll
├─────────────────────────────────────────────┤
│  Sort/Filter bar:                           │
│  [Price: Low→High] [Price: High→Low]        │
│  [In Stock Only toggle]                     │
├─────────────────────────────────────────────┤
│  Product Grid                               │
│  Mobile: 2 columns                         │
│  Tablet: 3 columns                         │
│  Desktop: 4 columns                        │
└─────────────────────────────────────────────┘
```

### Product Card (in grid)
```
┌──────────────────┐
│                  │
│   Product Image  │  ← 1:1 aspect ratio, WebP, blur-up placeholder
│   (tap = detail) │
├──────────────────┤
│ Product Name     │  ← max 2 lines, ellipsis
│ ₹249             │  ← or "From ₹199" if variants have different prices
│ [Add to Cart ✚]  │  ← green button. If has variants: "Select Options" instead
└──────────────────┘

Out of stock: show "Out of Stock" overlay on image. Button disabled and grey.
"Add to Cart" on simple product: adds directly, shows cart animation.
"Select Options": opens product detail page.
```

### Infinite Scroll / Pagination
- Initial load: 20 products per collection
- IntersectionObserver on last product card → trigger fetch next 20
- Loading state: 4 skeleton cards at bottom
- When fetched: append new cards with fade-in
- "No more products" → no indicator needed, just stop fetching

---

## 2.3 PRODUCT DETAIL PAGE (CUSTOMER VIEW)

### Image Carousel
```
- Horizontal swipeable carousel
- Thumbnail strip below (desktop) / dot indicators (mobile)
- Active thumbnail: purple border
- Pinch to zoom on mobile (native via Capacitor or CSS touch-action)
- Double-tap to zoom on mobile
- Max 10 images per product (from PRD)
- If 1 image: no carousel controls
```

### Price Display Logic
```
NO variants:
  → Show basePrice directly: "₹249"

HAS variants, ALL same price:
  → Show basePrice: "₹249"

HAS variants, DIFFERENT prices:
  → Show: "From ₹149"
  → After variant selection: update to show selected variant's price: "₹249"
  → If selected variant has NO priceOverride: show basePrice

Price update animation: number cross-fades (opacity 0→1) when price changes
```

### Variant Selection UI
```
For EACH VariantGroup, render a section:

  [Group Name]              ← e.g. "Size"
  [S]  [M]  [L]  [XL]      ← pill buttons

Pill states:
  UNSELECTED: white bg, grey border, grey text
  SELECTED:   primary purple bg, white text, scale(1.05), box-shadow
  OUT_OF_STOCK: light grey bg, strikethrough text, cursor-not-allowed, 40% opacity

Selection rules:
  - Customer must select EXACTLY ONE value per group
  - Each group is independent
  - Selecting in one group does NOT clear other groups
  - Only after ALL groups have a selection → Add to Cart button activates

Add to Cart button states:
  No selection:     grey, disabled, text: "Select [GroupName]"  ← show first unselected group
  Partial:          grey, disabled, text: "Select [Next unselected GroupName]"
  All selected:     green, enabled, text: "Add to Cart"
  Adding (loading): spinner, disabled
  Added:            brief green checkmark flash (300ms), returns to "Add to Cart"
```

### Quantity Stepper
```
Default quantity: 1
Min: 1  Max: stock of selected variant (or 999 if no stock tracking = stock is 0 means unlimited? 
  → Business logic: stock = 0 means "out of stock". stock = null means "unlimited".
     VariantValue.stock should be nullable in schema for this distinction.)
  
Stepper: [−] [2] [+]
  Minus at 1: disable minus button (cannot go below 1)
  Plus at max stock: disable plus button

If stock = 5 and quantity = 5: show "Only 5 left!" label in amber above stepper
If stock ≤ 3: show "Only [N] left!" in red
```

---

## 2.4 CATALOGUE MANAGER (BUSINESS VIEW)

### Collections Manager
```
Layout: vertical list of collection cards, drag handle on left

Each collection card:
  ┌──────────────────────────────────────────────┐
  │  ⠿  [Cover img]  Collection Name             │
  │                  12 products  ●Active         │
  │                  [Edit] [Delete]              │
  └──────────────────────────────────────────────┘

Drag-to-reorder:
  - Use @dnd-kit/sortable
  - On dragEnd → immediately fire PATCH /catalog/collections/reorder
    Body: { orderedIds: ["id1", "id2", ...] } — full ordered array
  - Optimistic: reorder in store immediately, rollback on error

Active toggle:
  - Toggling inactive: products in that collection still exist; collection tab just hides in customer view
  - Confirmation dialog if collection has > 0 products: "This will hide X products from customers. Continue?"

Delete collection:
  - Confirmation: "Deleting this collection won't delete its products. They'll still appear in All Items."
  - On confirm: DELETE /catalog/collections/:id
```

### Products Manager
```
Tab per collection (same collection tabs as customer view, plus "All Products")

Product list item:
  ┌──────────────────────────────────────────────────────┐
  │  ⠿  [img]  Product Name                             │
  │             ₹249  |  3 variants  |  ●Active         │
  │             [Edit] [Duplicate] [Delete]              │
  └──────────────────────────────────────────────────────┘

Duplicate: creates a copy with name "Product Name (Copy)", same price/variants, inactive
Delete: confirmation → soft delete (isActive = false, hidden from customer)
  WARNING: "This product will be removed from all collections and hidden from customers."
```

### Product Editor (Create / Edit)
```
Full-screen modal or dedicated page. Sections:

─── IMAGES ────────────────────────────────
  Drop zone: "Drag images or tap to upload"
  Accepts: .jpg .jpeg .png .webp (MIME validated server-side)
  Max file size: 2MB each. Max 10 images total.
  On upload: show progress bar per image, then thumbnail with drag handle
  Drag-to-reorder thumbnails: uses @dnd-kit/sortable
  Delete image: "×" on each thumbnail
  First image = primary image shown in catalog grid

─── DETAILS ───────────────────────────────
  Name: text input, required, max 100 chars (char counter)
  Description: textarea, optional, max 1000 chars
  Base Price: number input, min 0.01, prefix "₹", required

─── COLLECTIONS ───────────────────────────
  Multi-select checkboxes of available collections
  "All Items" always checked and disabled (always belongs to all)

─── VARIANTS ──────────────────────────────
  [ + Add Variant Group ] button

  For each VariantGroup:
  ┌──────────────────────────────────────────────────┐
  │  Group Name: [Size          ]  [× Delete Group]  │
  │                                                  │
  │  Values:                                         │
  │  ┌──────────────────────────────────────────┐   │
  │  │  Label    │ Price Override │ Stock │ SKU  │   │
  │  │  [Small ] │ [     ₹199  ] │ [50 ] │ [  ] │   │
  │  │  [Medium] │ [           ] │ [30 ] │ [  ] │   │
  │  │  [Large ] │ [     ₹249  ] │ [20 ] │ [  ] │   │
  │  └──────────────────────────────────────────┘   │
  │  [ + Add Value ]                                 │
  └──────────────────────────────────────────────────┘

  Price override: OPTIONAL. If blank → uses basePrice. If filled → overrides.
  Stock: integer ≥ 0. Leave blank = unlimited (null in DB). 0 = out of stock.
  SKU: optional text, no validation

─── ACTIVE STATUS ─────────────────────────
  Toggle: Active / Inactive
  Inactive products NOT shown in customer catalog

─── SAVE ──────────────────────────────────
  [Cancel]  [Save Product]
  Zod validation before submit. Inline errors under each field.
  On success: close modal, update product in list optimistically
```

---

# PART 3 — CART & COMMERCE SYSTEM

---

## 3.1 CART — FUNDAMENTAL RULES

These rules are absolute. The cart logic breaks if any of these are violated:

```
RULE 1: One active cart per (userId + businessId) pair.
  - A customer can have multiple active carts (one per business they shop with)
  - GET /cart?businessId=xxx — always returns or creates the cart for that business

RULE 2: Cart line item uniqueness = (cartId + productId + variantId)
  - Same product + same variant → UPDATE quantity (never create duplicate)
  - Same product + different variant → CREATE new line item (this is allowed, intentional)
  - Simple product (no variant) → variantId = null → UPDATE quantity if item exists

RULE 3: Cart is server-persisted, not local storage.
  - Cart survives app close, logout/login, device change
  - On login: immediately fetch active cart for each business

RULE 4: Cart is cleared (status = CHECKED_OUT) when order is placed.
  - The CHECKED_OUT cart is kept in DB for order reference
  - A new ACTIVE cart is created for the next purchase

RULE 5: Price shown in cart = live product/variant price, NOT cached.
  - Fetch current prices when displaying cart
  - BUT: once order is placed, orderItem.unitPrice is the SNAPSHOT (never updates)

RULE 6: Stock validation happens at checkout, not at cart add.
  - Adding to cart does NOT decrement stock
  - On Place Order: validate each item's variant stock ≥ quantity
  - If stock fails: return error per item, do NOT place order, show user which items failed
```

---

## 3.2 CART PAGE (CUSTOMER VIEW)

### Layout
```
┌──────────────────────────────────────────────┐
│  [←]  Cart · [Business Name]                 │
├──────────────────────────────────────────────┤
│  CART ITEMS (scrollable list):               │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ [img] Product Name                    │  │
│  │       Variant: Size: L, Color: Red    │  │
│  │       ₹249 per unit                   │  │
│  │                        [−] [2] [+]    │  │
│  │                        Subtotal: ₹498 │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ← swipe left on mobile to reveal [Delete]  │
│                                             │
├──────────────────────────────────────────────┤
│  ORDER SUMMARY (sticky bottom):              │
│  Subtotal          ₹747                      │
│  Tax               ₹0 (not implemented v1)   │
│  ─────────────────────────                   │
│  Total             ₹747  (bold, larger)      │
│                                              │
│  Delivery Address:                           │
│  [Text area / address input]                 │
│                                              │
│  Order Note (optional):                      │
│  [Text area — "Any special instructions?"]   │
│                                              │
│  [       Place Order  →       ]              │
│   (primary purple, full width)               │
└──────────────────────────────────────────────┘
```

### Cart Item Interactions
```
Quantity stepper:
  Tap + → quantity++, update in store (optimistic), PATCH /cart/items/:id
  Tap − → quantity--
    If quantity reaches 0 → treat as DELETE (remove item), not update to 0
    Show undo toast: "Item removed. Undo?" (5 second window)
  Tap − when quantity = 1 → triggers delete confirm or just delete with undo toast

Swipe-to-delete (mobile only):
  Swipe left > 80px → reveals red Delete button
  Tap Delete → DELETE /cart/items/:id
  Show undo toast (5 seconds)

Update quantity API call:
  Debounce: 400ms. Don't fire API on every tap. 
  Accumulate taps, then send final quantity.
  Optimistic: update store immediately, reconcile on API response.

Empty cart state:
  Illustration (empty basket)
  "Your cart is empty"
  "Browse [Business Name]'s catalog to add items"
  [Browse Catalog → ] button
```

### Place Order Flow
```
Pre-validation (client-side before API call):
  1. deliveryAddress.trim() must not be empty → inline error "Please enter a delivery address"
  2. Cart must have ≥ 1 item
  3. Show loading spinner on button

API call: POST /api/orders
  Body: { businessId, deliveryAddress, customerNote }
  Server logic:
    a. Fetch user's ACTIVE cart for businessId
    b. Validate cart has items
    c. For each CartItem:
       - Fetch current product + variant
       - Validate variant stock (if stock !== null and stock < quantity → error)
       - Snapshot: productName, variantLabel, unitPrice, lineTotal
    d. Calculate subtotal = sum(lineTotal)
    e. Generate orderNumber (ORD-YYYY-NNN)
    f. Create Order record + OrderItem records
    g. Create first OrderStatusHistory entry { status: PENDING, changedBy: userId, note: 'Order placed' }
    h. Update Cart status to CHECKED_OUT
    i. Emit order:new socket event to business owner's room
    j. Create automated ORDER_UPDATE chat message in the business↔customer chat:
       { type: 'ORDER_UPDATE', metadata: { orderId, orderNumber, status: 'PENDING', ... } }
    k. Return { orderId, orderNumber }

On success:
  1. Clear cart in Zustand store for this businessId
  2. Show full-screen success animation:
     - SVG checkmark draws itself (600ms, stroke-dashoffset animation)
     - Confetti burst (10-15 colored particles, fall and fade, 1200ms)
     - "Order Placed! 🎉" heading
     - "Order #ORD-2026-001" subheading
     - [View Order] button → /orders/:orderId
     - [Continue Shopping] → /catalog/:businessId
  3. Medium haptic feedback (mobile)

On stock error:
  Show error banner: "Some items are unavailable:"
  List each failed item with error: "Product A (Size: L) — only 2 left in stock"
  User can adjust quantities and retry
```

---

## 3.3 SHARED CART SYSTEM

The Shared Cart is the most complex commerce feature. These are the exact rules:

### Business Creates a Shared Cart (4-Step Flow)

**Step 1 — Select Customer**
```
UI: Searchable list of customers who have chatted with this business
Each row: avatar, name, phone, last chat date
Search: filters by name or phone number in real time
Selection: single select, customer highlights with purple checkmark
[Next →] button activates after selection
```

**Step 2 — Build Cart**
```
UI: Same catalogue browse experience (collection tabs + product grid)
But: "Add" button adds to the SHARED cart, not the customer's personal cart

Shared cart builder panel (right side on desktop, bottom sheet on mobile):
  ┌────────────────────────────────────┐
  │  Cart for [Customer Name]          │
  ├────────────────────────────────────┤
  │  • Product A  Size:L  ×2  ₹498    │
  │  • Product B          ×1  ₹249    │
  ├────────────────────────────────────┤
  │  Total: ₹747                       │
  │  [Next: Add Notes →]               │
  └────────────────────────────────────┘

Adding a product:
  If product has variants → open mini-variant-selector sheet
  Select variant → add to shared cart with quantity 1
  [+] [-] controls in the cart panel per item

Constraint: minimum 1 item to proceed to Step 3
```

**Step 3 — Notes & Expiry**
```
Per-item notes:
  Each item in the shared cart gets an optional note field
  Example: "This size runs small — consider ordering one size up"
  Max 200 chars per note

Overall cart note:
  Optional textarea
  Max 500 chars
  "Any message for the customer?"

Expiry date:
  Optional date picker
  Must be in the future (today + 1 day minimum)
  Formats: "Expires on 25 Mar" or "No expiry"
  If expired at time of customer view → cart is locked
```

**Step 4 — Preview & Send**
```
Render the Shared Cart Card exactly as customer will see it
All data is final — no editing on this screen

[← Back to Edit]   [Send Cart to [Customer Name] →]

On Send:
  POST /api/shared-carts
  Body: { recipientId, items: [...], note, expiresAt }
  Server:
    a. Create SharedCart record
    b. Create SharedCartItems
    c. Find or create Chat between business owner ↔ customer
    d. Create a SHARED_CART message in that chat:
       { type: 'SHARED_CART', metadata: { sharedCartId } }
    e. Emit shared_cart:received socket to recipient
    f. Emit chat:updated to both users
  
  On success:
    Navigate to the chat with that customer (the cart message is already there)
    Show toast: "Cart sent to [Customer Name]!"
```

### Customer Receives and Views Shared Cart

**In Chat:**
- SharedCartCard renders immediately in the message stream (see Section 1.5 spec above)
- On first render: emit PATCH /shared-carts/:id status: VIEWED to server
- Status updates in real time: business can see VIEWED in their copy of the shared cart

**SharedCartPage (/shared-cart/:id):**
```
Header:
  "Cart from [Business Name]"
  Expiry notice (if set): "This cart expires on 25 Mar 2026"

Item list (adjustable):
  For each SharedCartItem:
  ┌──────────────────────────────────────────┐
  │ [img] Product Name                       │
  │       Variant: Size: L                   │
  │       Note: "This size runs small!"  🟡  │  ← amber banner per-item note
  │       ₹249    [−] [1] [+]               │
  └──────────────────────────────────────────┘

Customer CAN:
  - Adjust quantity (local state only, not saved back to SharedCart)
  - Remove items (local state only)
  - Change variant (if product has variants — opens variant selector)

Customer CANNOT:
  - Add new products to the shared cart
  - Edit item notes

Overall note (if set):
  "Note from [Business Name]: [note text]"
  Displayed in a subtle amber callout card

Add to My Cart button:
  "Add All to My Cart"  (full width, primary purple)
  
  Logic:
    For each item (with customer's adjusted quantity/variant):
      POST /cart/items for businessId
      If item already in cart → INCREMENT quantity (merge, no duplicate)
      If item has different variant → separate line item (allowed)
    
    After all items added:
      Update SharedCart status → ADDED_TO_CART
      Emit PATCH /shared-carts/:id { status: 'ADDED_TO_CART' }
      Navigate to /cart/:businessId
      Show toast: "Items added to your cart!"
  
  If cart is expired:
    Button disabled
    "This cart has expired and can no longer be added."
  
  Items already in cart:
    Highlight those items with a "Already in cart (×N)" badge
    Show merged quantity: "Will add to existing 1 in cart → total: 3"
```

---

## 3.4 ORDER SYSTEM — BUSINESS VIEW

### Order Manager (in Dashboard)

**Status Tabs with Live Counts:**
```
[ All (24) ]  [ Pending (3) ]  [ Confirmed (5) ]  [ Processing (8) ]  [ Dispatched (6) ]  [ Delivered ]  [ Cancelled ]

Tab counts update in real time via:
  - order:new socket → increment relevant tab counts
  - order:status socket → decrement old status tab, increment new status tab
```

**DataTable columns (desktop):**
```
Order #     | Customer       | Items | Total  | Placed At        | Status          | Actions
ORD-2026-001| Ravi Kumar     | 3     | ₹747   | Today, 2:34 PM   | [PENDING pill]  | [View] [Quick Action ▾]
```

**Quick Action dropdown** (shows only valid next transitions):
```
PENDING:    [Confirm Order] [Cancel Order]
CONFIRMED:  [Mark Processing] [Cancel Order]
PROCESSING: [Mark Dispatched] [Cancel Order]
DISPATCHED: [Mark Delivered]
```

**New Order Notification Banner:**
```
Appears at TOP of order table (slides down from top):
  ┌──────────────────────────────────────────────┐
  │  🔔 New Order: ORD-2026-004 from Ravi Kumar  │
  │     3 items · ₹747    [View Order]  [×]       │
  └──────────────────────────────────────────────┘

Auto-dismisses after 6 seconds
Browser notification (if permission granted): same info, click opens order detail
Sound: subtle chime (web audio, only if user has interacted with page)
```

### Order Detail Sheet/Drawer

Triggered by [View] button. Slides in from right (desktop) / slides up (mobile).

```
─── ORDER HEADER ────────────────────────────────
  Order #ORD-2026-001        Placed: 12 Mar 2026, 2:34 PM
  
─── CUSTOMER ────────────────────────────────────
  [Avatar] Ravi Kumar
  📞 +91 98765 43210        [Message Customer →]  ← opens chat with this customer

─── ITEMS ───────────────────────────────────────
  [img] Product Name
        Variant: Size: L, Color: Red
        ₹249 × 2 = ₹498

  [img] Product B
        No variants
        ₹249 × 1 = ₹249

─── SUMMARY ─────────────────────────────────────
  Subtotal    ₹747
  Tax         ₹0
  Total       ₹747  (bold)

─── DELIVERY ────────────────────────────────────
  123 Main Street, Apartment 4B
  Mumbai, Maharashtra 400001

─── CUSTOMER NOTE ───────────────────────────────
  "Please leave at the door"

─── UPDATE STATUS ───────────────────────────────
  Current: [CONFIRMED pill]
  
  Next valid actions (buttons, not dropdown):
    [Mark as Processing]  [Cancel Order]
  
  Optional note textarea:
    "Add a note (e.g. tracking number, reason for cancellation)"
    Max 300 chars
  
  [Confirm Status Update] button → PATCH /api/business/orders/:id/status
    Body: { status: 'PROCESSING', note: '...' }
    On success: update order in list, update status pill, update timeline

─── STATUS HISTORY TIMELINE ─────────────────────
  ● PENDING       12 Mar 2026, 2:34 PM   "Order placed"        [Customer]
  ● CONFIRMED     12 Mar 2026, 2:41 PM   "Confirmed"           [You]
  ● PROCESSING    12 Mar 2026, 3:15 PM   "Started packing"     [You]
  (latest at top or bottom — latest at bottom, chronological)
```

### Order Status Transition Rules (enforced server-side)
```ts
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:    ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:  ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['DELIVERED'],
  DELIVERED:  ['REFUNDED'],
  CANCELLED:  [],          // Terminal state
  REFUNDED:   [],          // Terminal state
}

// Server validation:
if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
  return res.status(400).json({ error: `Cannot transition from ${currentStatus} to ${newStatus}` })
}

// After valid transition:
// 1. Update order.status
// 2. Create OrderStatusHistory entry
// 3. Emit order:status socket to customer
// 4. Create ORDER_UPDATE message in the customer↔business chat
```

---

## 3.5 CUSTOMER ORDERS PAGE

```
─── TABS ────────────────────────────────────────
  [Active]  [Completed]  [Cancelled]

Active = PENDING, CONFIRMED, PROCESSING, DISPATCHED
Completed = DELIVERED, REFUNDED
Cancelled = CANCELLED

─── ORDER LIST ──────────────────────────────────
  ┌──────────────────────────────────────────────┐
  │  [Business Logo]  Business Name              │
  │  ORD-2026-001  ·  3 items  ·  ₹747          │
  │  Placed: Today, 2:34 PM                      │
  │  [PROCESSING pill]                           │
  └──────────────────────────────────────────────┘

Real-time: when order:status socket received:
  - Update the status pill with color transition (300ms ease)
  - Show toast: "Order #ORD-2026-001 is now [status]"
  - If order moves from Active to Completed/Cancelled → move to correct tab

─── ORDER DETAIL ─────────────────────────────────
  Navigates to /orders/:orderId (full page on mobile, modal on desktop)
  
  Contents:
    - Order header: number, business, placed date
    - Status timeline (full, same as business view but read-only)
    - Item list (snapshotted names, variants, unit prices, line totals)
    - Delivery address + customer note
    - Total summary
    - [Message Business] button → opens chat
    - [Reorder] button (DELIVERED only) → adds all items back to cart
      "Some items may no longer be available or have changed prices"
```

---

# PART 4 — CROSS-CUTTING CONCERNS

---

## 4.1 OPTIMISTIC UI PATTERN (applies everywhere)

Every mutation in the app follows this pattern:
```ts
async function mutate(input) {
  const rollbackData = getCurrentState()  // snapshot before
  const tempId = `temp_${Date.now()}`
  
  // 1. Apply optimistic update to Zustand store immediately
  store.applyOptimistic(input, tempId)
  
  try {
    // 2. API call
    const result = await api.call(input)
    // 3. Replace optimistic data with real server data
    store.confirmOptimistic(tempId, result)
  } catch (error) {
    // 4. Rollback
    store.rollback(rollbackData)
    toast.error(getErrorMessage(error))
  }
}
```

Apply to:
- Sending messages
- Adding to cart
- Updating cart quantity
- Removing cart item
- Reordering collections/products (drag-and-drop)
- Adding emoji reaction
- Deleting message

---

## 4.2 ERROR HANDLING STANDARDS

```
API errors → standardized error object:
  { error: string, field?: string, code?: string }

HTTP status usage:
  400 → validation error (Zod), business rule violation
  401 → not authenticated
  403 → authenticated but not authorized (wrong owner)
  404 → resource not found
  409 → conflict (duplicate, state violation)
  500 → server error (never expose details to client)

Client-side error display:
  Form fields: inline error text below the field (red, small)
  Mutations: toast notification (bottom of screen, auto-dismiss 4s)
  Page load failures: full error state with [Retry] button
  Network offline: banner at top "You're offline. Reconnecting..."
```

---

## 4.3 LOADING SKELETONS (required for all lists)

Every list/grid must have a skeleton that matches the EXACT layout:
```
Chat list skeleton:     [circle] [long bar] [short bar]   × 8 items
Chat messages skeleton: Alternating left/right bubbles, varying widths
Product grid skeleton:  [square] [bar] [short bar] [button]  × 4/6/8 items
Order list skeleton:    [circle] [bars]  × 5 items
Cart skeleton:          [square] [bars] [stepper outline]  × 3 items
KPI cards skeleton:     [card with large number bar]  × 4 cards

All skeletons use: pulse animation (opacity 0.4 → 0.7, 1.5s ease-in-out, infinite)
Color: --color-surface (#F9FAFB) for bg, slightly darker for the animated bar
```

---

## 4.4 EMPTY STATES (required for all lists)

```
Chat list empty:        Speech bubble illustration + "No conversations yet"
                        + [Find a business to chat with]
Product grid empty:     Box illustration + "No products in this collection"
                        (business view: + [Add Product] button)
Cart empty:             Basket illustration + "Your cart is empty"
                        + [Browse Catalog →]
Orders empty (active):  Package illustration + "No active orders"
                        + [Start Shopping →]
Orders empty (past):    Receipt illustration + "No past orders yet"
Search results empty:   Magnifier illustration + "No results for '[query]'"
```

---

## 4.5 TOAST NOTIFICATION SYSTEM

```
Position: bottom-center on mobile, bottom-right on desktop
Auto-dismiss: 4 seconds (default)
Types:
  success: green left border, ✓ icon
  error: red left border, ✗ icon
  info: blue left border, ℹ icon
  warning: amber left border, ⚠ icon

Special: undo toast (cart item removed):
  Shows for 5 seconds
  Has [Undo] button that reverses the action
  Progress bar underneath counting down

Max 3 toasts visible at once (oldest auto-removes when 4th appears)
```

---

*BizChat Focused Prompt — Doank Digital — March 2026*
*Every rule in this document is a hard requirement. No simplification. No "close enough". Build it exactly as specified.*