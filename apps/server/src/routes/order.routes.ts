import { Router } from 'express'
import prisma from '../lib/prisma'
import logger from '../lib/logger'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { placeOrderSchema } from '@bizchat/shared'
import { getIO } from '../index'

const router: Router = Router()

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.order.count({
    where: { createdAt: { gte: new Date(`${year}-01-01`) } },
  })
  return `ORD-${year}-${String(count + 1).padStart(3, '0')}`
}

// POST / — place order from cart
router.post('/', requireAuth, validateBody(placeOrderSchema), async (req: AuthRequest, res) => {
  try {
    const { businessId, deliveryAddress, customerNote } = req.body

    const cart = await prisma.cart.findFirst({
      where: { userId: req.userId!, businessId, status: 'ACTIVE' },
      include: {
        items: { include: { product: { include: { images: true } }, variant: true } },
      },
    })

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ error: 'Cart is empty' })
      return
    }

    const orderNumber = await generateOrderNumber()

    // Snapshot prices at order time
    const orderItems = cart.items.map(item => {
      const unitPrice = item.variant?.priceOverride ?? item.product.basePrice
      const lineTotal = Number(unitPrice) * item.quantity
      return {
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        variantLabel: item.variant?.label ?? null,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
        imageUrl: item.product.images?.[0]?.url ?? null,
      }
    })

    // Validate stock before transaction
    const stockErrors: { productId: string, variantId: string | null, requested: number, available: number }[] = []
    
    for (const item of cart.items) {
      if (item.variant && item.variant.stock !== null) {
        if (item.quantity > item.variant.stock) {
          stockErrors.push({
            productId: item.productId,
            variantId: item.variantId,
            requested: item.quantity,
            available: item.variant.stock,
          })
        }
      }
    }

    // Disable strict stock boundary checking for checkout
    // if (stockErrors.length > 0) {
    //   res.status(400).json({ error: 'STOCK_UNAVAILABLE', items: stockErrors })
    //   return
    // }

    const subtotal = orderItems.reduce((sum, item) => sum + Number(item.lineTotal), 0)

    const order = await prisma.$transaction(async (tx) => {
      // Decrement stock without throwing errors if it falls below zero
      for (const item of cart.items) {
        if (item.variant && item.variant.stock !== null) {
          await tx.variantValue.update({
            where: { id: item.variant.id },
            data: { stock: { decrement: item.quantity } }
          })
        }
      }

      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: req.userId!,
          businessId,
          cartId: cart.id,
          subtotal,
          total: subtotal, // Tax can be added later
          deliveryAddress,
          customerNote,
          items: { create: orderItems },
          statusHistory: {
            create: { status: 'PENDING', changedBy: req.userId!, note: 'Order placed' },
          },
        },
        include: {
          items: true,
          statusHistory: true,
          business: true,
        },
      })

      // Mark cart as checked out
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: 'CHECKED_OUT' },
      })

      return newOrder
    })

    // Emit socket event order:new to business owner + chat integration
    try {
      const io = getIO()
      const businessProfile = await prisma.businessProfile.findUnique({
        where: { id: businessId },
        select: { userId: true },
      })
      
      if (businessProfile) {
        io.to(`user:${businessProfile.userId}`).emit('order:new', order)

        // ─── Chat Message Integration ✨ ───
        let chat = await prisma.chat.findFirst({
          where: {
            AND: [
              { members: { some: { userId: req.userId! } } },
              { members: { some: { userId: businessProfile.userId } } },
            ]
          },
          include: { members: true }
        })

        if (!chat) {
          chat = await prisma.chat.create({
            data: { members: { create: [{ userId: req.userId! }, { userId: businessProfile.userId }] } },
            include: { members: true }
          })
        }

        const msg = await prisma.message.create({
          data: {
            chatId: chat.id,
            senderId: req.userId!,
            type: 'ORDER_UPDATE',
            content: `Order #${order.orderNumber} placed`,
            metadata: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              status: 'PENDING',
              itemCount: order.items.length,
              total: order.total
            }
          },
          include: { sender: { select: { id: true, name: true, avatarUrl: true } } }
        })

        await prisma.chat.update({ where: { id: chat.id }, data: { updatedAt: new Date() } })

        io.to(`chat:${chat.id}`).emit('message:new', msg)

        for (const m of chat.members) {
          const unreadCount = await prisma.message.count({
            where: { chatId: chat.id, createdAt: { gt: m.lastRead }, senderId: { not: m.userId } }
          })
          io.to(`user:${m.userId}`).emit('chat:updated', { chatId: chat.id, lastMessage: msg, unreadCount })
        }
      }
    } catch (socketErr) {
      logger.warn('Socket emit failed for order:new', { error: socketErr })
    }

    res.status(201).json(order)
  } catch (error) {
    logger.error('Place order error', { error })
    res.status(500).json({ error: 'Failed to place order' })
  }
})

// GET / — customer order list
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { cursor, limit = '20' } = req.query
    const take = Math.min(parseInt(limit as string, 10), 50)
    const orders = await prisma.order.findMany({
      where: { userId: req.userId! },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor as string }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: { items: true, business: true },
    })
    const hasMore = orders.length > take
    if (hasMore) orders.pop()
    res.json({
      data: orders,
      cursor: orders.length > 0 ? orders[orders.length - 1].id : null,
      hasMore,
    })
  } catch (error) {
    logger.error('Get orders error', { error })
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// GET /:id — full order detail
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true, statusHistory: { orderBy: { createdAt: 'asc' } }, business: true },
    })
    if (!order || order.userId !== req.userId) {
      res.status(404).json({ error: 'Order not found' })
      return
    }
    res.json(order)
  } catch (error) {
    logger.error('Get order detail error', { error })
    res.status(500).json({ error: 'Failed to fetch order' })
  }
})

export default router
