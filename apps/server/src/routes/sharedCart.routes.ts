import { Router } from 'express'
import prisma from '../lib/prisma'
import logger from '../lib/logger'
import { requireAuth, requireBusinessOwner, AuthRequest } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createSharedCartSchema, updateSharedCartStatusSchema } from '@bizchat/shared'
import { getIO } from '../index'

const router: Router = Router()

// POST / — business creates + sends shared cart
router.post('/', requireAuth, requireBusinessOwner, validateBody(createSharedCartSchema), async (req: AuthRequest, res) => {
  try {
    const sharedCart = await prisma.sharedCart.create({
      data: {
        businessId: req.businessId!,
        recipientId: req.body.recipientId,
        note: req.body.note,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
        items: {
          create: req.body.items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            note: item.note,
          })),
        },
      },
      include: {
        items: { include: { product: { include: { images: true } }, variant: true } },
        business: true,
      },
    })

    // Emit socket event shared_cart:received to recipient
    try {
      const io = getIO()
      io.to(`user:${req.body.recipientId}`).emit('shared_cart:received', sharedCart)
    } catch (socketErr) {
      logger.warn('Socket emit failed for shared_cart:received', { error: socketErr })
    }

    res.status(201).json(sharedCart)
  } catch (error) {
    logger.error('Create shared cart error', { error })
    res.status(500).json({ error: 'Failed to create shared cart' })
  }
})

// GET /:id — full detail
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const sharedCart = await prisma.sharedCart.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: { include: { images: true } }, variant: true } },
        business: true,
      },
    })
    if (!sharedCart) {
      res.status(404).json({ error: 'Shared cart not found' })
      return
    }
    // Only business owner or recipient can view
    const profile = await prisma.businessProfile.findUnique({ where: { userId: req.userId } })
    if (sharedCart.recipientId !== req.userId && profile?.id !== sharedCart.businessId) {
      res.status(403).json({ error: 'Not authorized' })
      return
    }
    res.json(sharedCart)
  } catch (error) {
    logger.error('Get shared cart error', { error })
    res.status(500).json({ error: 'Failed to fetch shared cart' })
  }
})

// PATCH /:id/status — update status
router.patch('/:id/status', requireAuth, validateBody(updateSharedCartStatusSchema), async (req: AuthRequest, res) => {
  try {
    const updated = await prisma.sharedCart.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    })
    res.json(updated)
  } catch (error) {
    logger.error('Update shared cart status error', { error })
    res.status(500).json({ error: 'Failed to update status' })
  }
})

export default router
