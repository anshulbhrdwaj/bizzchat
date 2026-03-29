import { Router } from 'express'
import prisma from '../lib/prisma'
import logger from '../lib/logger'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { addCartItemSchema, updateCartItemSchema } from '@bizchat/shared'

const router: Router = Router()

// GET /all — get all active carts for the user
router.get('/all', requireAuth, async (req: AuthRequest, res) => {
  try {
    const carts = await prisma.cart.findMany({
      where: { userId: req.userId!, status: 'ACTIVE' },
      include: { 
        items: {
          include: {
            product: { include: { images: true } },
            variant: true
          }
        }
      }
    })
    // Fetch business details for each cart
    const businessIds = [...new Set(carts.map(c => c.businessId))]
    const businesses = await prisma.businessProfile.findMany({
      where: { id: { in: businessIds } },
      select: { id: true, name: true, logoUrl: true, coverUrl: true }
    })
    const bMap = new Map(businesses.map(b => [b.id, b]))
    
    // Attach business to cart
    const enriched = carts.map(c => ({
      ...c,
      business: bMap.get(c.businessId)
    })).filter(c => c.items.length > 0) // Only return carts that actually have items

    res.json(enriched)
  } catch (error) {
    logger.error('Get all carts error', { error })
    res.status(500).json({ error: 'Failed to fetch carts' })
  }
})

// GET / — get or create active cart
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { businessId } = req.query
    if (!businessId) {
      res.status(400).json({ error: 'businessId required' })
      return
    }
    let cart = await prisma.cart.findFirst({
      where: { userId: req.userId!, businessId: businessId as string, status: 'ACTIVE' },
      include: {
        items: {
          include: { product: { include: { images: true } }, variant: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.userId!, businessId: businessId as string },
        include: {
          items: {
            include: { product: { include: { images: true } }, variant: true },
          },
        },
      })
    }
    res.json(cart)
  } catch (error) {
    logger.error('Get cart error', { error })
    res.status(500).json({ error: 'Failed to fetch cart' })
  }
})

// POST /items — add item (upsert on duplicate)
router.post('/items', requireAuth, validateBody(addCartItemSchema), async (req: AuthRequest, res) => {
  try {
    const { productId, variantId, quantity, businessId } = req.body
    let cart = await prisma.cart.findFirst({
      where: { userId: req.userId!, businessId, status: 'ACTIVE' },
    })
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.userId!, businessId },
      })
    }
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId, variantId: variantId ?? null },
    })
    if (existing) {
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
        include: { product: { include: { images: true } }, variant: true },
      })
      res.json(updated)
    } else {
      const item = await prisma.cartItem.create({
        data: { cartId: cart.id, productId, variantId, quantity },
        include: { product: { include: { images: true } }, variant: true },
      })
      res.status(201).json(item)
    }
  } catch (error) {
    logger.error('Add cart item error', { error })
    res.status(500).json({ error: 'Failed to add item' })
  }
})

// PUT /items/:id — set exact quantity (0 = delete)
router.put('/items/:id', requireAuth, validateBody(updateCartItemSchema), async (req: AuthRequest, res) => {
  try {
    const item = await prisma.cartItem.findUnique({
      where: { id: req.params.id },
      include: { cart: true },
    })
    if (!item || item.cart.userId !== req.userId) {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    if (req.body.quantity === 0) {
      await prisma.cartItem.delete({ where: { id: req.params.id } })
      res.json({ message: 'Item removed' })
    } else {
      const updated = await prisma.cartItem.update({
        where: { id: req.params.id },
        data: { quantity: req.body.quantity },
        include: { product: { include: { images: true } }, variant: true },
      })
      res.json(updated)
    }
  } catch (error) {
    logger.error('Update cart item error', { error })
    res.status(500).json({ error: 'Failed to update item' })
  }
})

// DELETE /items/:id
router.delete('/items/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const item = await prisma.cartItem.findUnique({
      where: { id: req.params.id },
      include: { cart: true },
    })
    if (!item || item.cart.userId !== req.userId) {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    await prisma.cartItem.delete({ where: { id: req.params.id } })
    res.json({ message: 'Item removed' })
  } catch (error) {
    logger.error('Delete cart item error', { error })
    res.status(500).json({ error: 'Failed to delete item' })
  }
})

// DELETE / — clear all items
router.delete('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { businessId } = req.query
    if (!businessId) {
      res.status(400).json({ error: 'businessId required' })
      return
    }
    const cart = await prisma.cart.findFirst({
      where: { userId: req.userId!, businessId: businessId as string, status: 'ACTIVE' },
    })
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    }
    res.json({ message: 'Cart cleared' })
  } catch (error) {
    logger.error('Clear cart error', { error })
    res.status(500).json({ error: 'Failed to clear cart' })
  }
})

// POST /from-shared/:sharedCartId — merge shared cart into active cart
router.post('/from-shared/:sharedCartId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const sharedCart = await prisma.sharedCart.findUnique({
      where: { id: req.params.sharedCartId },
      include: { items: true },
    })
    if (!sharedCart || sharedCart.recipientId !== req.userId) {
      res.status(404).json({ error: 'Shared cart not found' })
      return
    }

    // Get or create active cart
    let cart = await prisma.cart.findFirst({
      where: { userId: req.userId!, businessId: sharedCart.businessId, status: 'ACTIVE' },
    })
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.userId!, businessId: sharedCart.businessId },
      })
    }

    // Merge items (upsert on productId+variantId)
    for (const item of sharedCart.items) {
      const existing = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, productId: item.productId, variantId: item.variantId },
      })
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        })
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          },
        })
      }
    }

    // Update shared cart status
    await prisma.sharedCart.update({
      where: { id: req.params.sharedCartId },
      data: { status: 'ADDED_TO_CART' },
    })

    // Fetch updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: { product: { include: { images: true } }, variant: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    res.json(updatedCart)
  } catch (error) {
    logger.error('Merge shared cart error', { error })
    res.status(500).json({ error: 'Failed to merge shared cart' })
  }
})

export default router

