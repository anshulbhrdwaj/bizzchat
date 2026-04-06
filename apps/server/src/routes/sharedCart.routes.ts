import { Router } from 'express'
import prisma from '../lib/prisma'
import logger from '../lib/logger'
import { requireAuth, requireBusinessOwner, AuthRequest } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createSharedCartSchema, updateSharedCartStatusSchema } from '@bizchat/shared'
import { getIO } from '../index'

const router: Router = Router()

// POST / — business creates + sends shared cart (also creates a chat message)
router.post('/', requireAuth, requireBusinessOwner, validateBody(createSharedCartSchema), async (req: AuthRequest, res) => {
  try {
    const sharedCart = await prisma.sharedCart.create({
      data: {
        businessId: req.businessId!,
        recipientId: req.body.recipientId,
        note: req.body.note,
        expiresAt: req.body.expiresAt
          ? new Date(req.body.expiresAt)
          : req.body.expiresInDays
            ? new Date(Date.now() + req.body.expiresInDays * 86400_000)
            : undefined,
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
        items: {
          include: {
            product: {
              include: {
                images: true,
                _count: { select: { variantGroups: true } }
              }
            },
            variant: true
          }
        },
        business: true,
      },
    })

    const mappedItems = sharedCart.items.map((item: any) => ({
      ...item,
      product: {
        ...item.product,
        hasVariants: item.product._count.variantGroups > 0
      }
    }))
    const responseData = { ...sharedCart, items: mappedItems }

    // ── Find or create the DM chat, then insert a SHARED_CART message ──
    try {
      const io = getIO()

      // Find existing DM between sender and recipient
      let chat = await prisma.chat.findFirst({
        where: {
          AND: [
            { members: { some: { userId: req.userId! } } },
            { members: { some: { userId: req.body.recipientId } } },
          ],
        },
      })

      // Create DM if none exists
      if (!chat) {
        chat = await prisma.chat.create({
          data: {
            members: {
              create: [{ userId: req.userId! }, { userId: req.body.recipientId }],
            },
          },
        })
      }

      // Insert message
      const message = await prisma.message.create({
        data: {
          chatId: chat.id,
          senderId: req.userId!,
          type: 'SHARED_CART',
          content: req.body.note || `Shared a catalogue with ${sharedCart.items.length} items`,
          metadata: {
            sharedCartId: sharedCart.id,
            businessId: req.businessId,
            businessName: sharedCart.business?.name,
            itemCount: sharedCart.items.length,
          },
        },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
      })

      // Update chat timestamp
      await prisma.chat.update({
        where: { id: chat.id },
        data: { updatedAt: new Date() },
      })

      // Emit socket events
      io.to(`chat:${chat.id}`).emit('message:new', message)

      const members = await prisma.chatMember.findMany({ where: { chatId: chat.id } })
      for (const m of members) {
        const unreadCount = await prisma.message.count({
          where: {
            chatId: chat.id,
            createdAt: { gt: m.lastRead },
            senderId: { not: m.userId },
          },
        })
        io.to(`user:${m.userId}`).emit('chat:updated', {
          chatId: chat.id,
          lastMessage: message,
          unreadCount,
        })
      }

      // Also emit the legacy socket event
      io.to(`user:${req.body.recipientId}`).emit('shared_cart:received', sharedCart)

      // Return enriched response with chatId
      res.status(201).json({ ...responseData, chatId: chat.id, messageId: message.id })
    } catch (socketErr) {
      logger.warn('Chat integration failed for shared cart, returning bare result', { error: socketErr })
      res.status(201).json(responseData)
    }
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
        items: {
          include: {
            product: {
              include: {
                images: true,
                _count: { select: { variantGroups: true } }
              }
            },
            variant: true
          }
        },
        business: true,
      },
    })
    if (!sharedCart) {
      res.status(404).json({ error: 'Shared cart not found' })
      return
    }

    const mappedItems = sharedCart.items.map((item: any) => ({
      ...item,
      product: {
        ...item.product,
        hasVariants: item.product._count.variantGroups > 0
      }
    }))
    const responseData = { ...sharedCart, items: mappedItems }
    // Only business owner or recipient can view
    const profile = await prisma.businessProfile.findUnique({ where: { userId: req.userId } })
    if (sharedCart.recipientId !== req.userId && profile?.id !== sharedCart.businessId) {
      res.status(403).json({ error: 'Not authorized' })
      return
    }
    res.json(responseData)
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
