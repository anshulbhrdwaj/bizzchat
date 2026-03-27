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

    const subtotal = orderItems.reduce((sum, item) => sum + Number(item.lineTotal), 0)

    const order = await prisma.order.create({
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
    await prisma.cart.update({
      where: { id: cart.id },
      data: { status: 'CHECKED_OUT' },
    })

    // Emit socket event order:new to business owner
    try {
      const io = getIO()
      const businessProfile = await prisma.businessProfile.findUnique({
        where: { id: businessId },
        select: { userId: true },
      })
      if (businessProfile) {
        io.to(`user:${businessProfile.userId}`).emit('order:new', order)
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
