import { z } from 'zod'

// ─── Auth Validators ─────────────────────────────────────

export const sendOtpSchema = z.object({
  phone: z.string().min(10).max(15).regex(/^\+?[0-9]+$/, 'Invalid phone number'),
})

export const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6, 'OTP must be 6 digits'),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})

// ─── User Validators ────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
})

// ─── Business Profile Validators ─────────────────────────

export const createBusinessProfileSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  address: z.string().max(500).optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  deliveryCharge: z.number().min(0).optional(),
})

export const updateBusinessProfileSchema = createBusinessProfileSchema.partial()

// ─── Catalog Validators ─────────────────────────────────

export const createCollectionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
})

export const updateCollectionSchema = createCollectionSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export const reorderCollectionsSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    sortOrder: z.number().int().min(0),
  })),
})

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  basePrice: z.number().positive(),
  isActive: z.boolean().optional(),
})

export const updateProductSchema = createProductSchema.partial()

export const reorderImagesSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    sortOrder: z.number().int().min(0),
  })),
})

export const createVariantGroupSchema = z.object({
  name: z.string().min(1).max(100),
  values: z.array(z.object({
    label: z.string().min(1).max(100),
    priceOverride: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
    sku: z.string().max(50).optional(),
  })).min(1),
})

export const updateVariantValueSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  priceOverride: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().max(50).optional().nullable(),
})

// ─── Cart Validators ────────────────────────────────────

export const addCartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().nullable().optional(),
  quantity: z.number().int().positive(),
  businessId: z.string(),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0),
})

// ─── Shared Cart Validators ─────────────────────────────

export const createSharedCartSchema = z.object({
  recipientId: z.string(),
  note: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().nullable().optional(),
    quantity: z.number().int().positive(),
    note: z.string().max(200).optional(),
  })).min(1),
})

export const updateSharedCartStatusSchema = z.object({
  status: z.enum(['PENDING', 'VIEWED', 'ADDED_TO_CART', 'ORDERED', 'EXPIRED']),
})

// ─── Order Validators ───────────────────────────────────

export const placeOrderSchema = z.object({
  businessId: z.string(),
  deliveryAddress: z.string().max(500).optional(),
  customerNote: z.string().max(500).optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  note: z.string().max(500).optional(),
})

// ─── Chat Validators ────────────────────────────────────

export const createChatSchema = z.object({
  recipientId: z.string(),
})

export const sendMessageSchema = z.object({
  type: z.enum(['TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'PRODUCT_CARD', 'SHARED_CART', 'ORDER_UPDATE']).default('TEXT'),
  content: z.string().max(5000).optional(),
  replyToId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const deleteMessageSchema = z.object({
  deleteFor: z.enum(['SELF', 'EVERYONE']),
})

export const reactToMessageSchema = z.object({
  emoji: z.string().min(1).max(10),
})

// ─── Environment Validators ─────────────────────────────

export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,capacitor://localhost'),
  UPLOAD_DIR: z.string().default('./uploads'),
})

// ─── Type Exports ────────────────────────────────────────

export type SendOtpInput = z.infer<typeof sendOtpSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type CreateBusinessProfileInput = z.infer<typeof createBusinessProfileSchema>
export type UpdateBusinessProfileInput = z.infer<typeof updateBusinessProfileSchema>
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type AddCartItemInput = z.infer<typeof addCartItemSchema>
export type CreateSharedCartInput = z.infer<typeof createSharedCartSchema>
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
