import { Router } from 'express'
import prisma from '../lib/prisma'
import logger from '../lib/logger'
import { requireAuth, requireBusinessOwner, AuthRequest } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { updateOrderStatusSchema } from '@bizchat/shared'
import { getIO } from '../index'

const router: Router = Router()

// GET / — business order list (filterable, sortable, paginated)
router.get('/', requireAuth, requireBusinessOwner, async (req: AuthRequest, res) => {
  try {
    const { status, search, cursor, limit = '20' } = req.query
    const take = Math.min(parseInt(limit as string, 10), 50)

    const where: any = { businessId: req.businessId }
    if (status && status !== 'ALL') where.status = status
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { user: { name: { contains: search as string, mode: 'insensitive' } } },
      ]
    }

    const orders = await prisma.order.findMany({
      where,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor as string }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: { items: true, user: { select: { id: true, name: true, phone: true, avatarUrl: true } } },
    })

    const hasMore = orders.length > take
    if (hasMore) orders.pop()

    res.json({
      data: orders,
      cursor: orders.length > 0 ? orders[orders.length - 1].id : null,
      hasMore,
    })
  } catch (error) {
    logger.error('Get business orders error', { error })
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// PATCH /:id/status — update order status
router.patch('/:id/status', requireAuth, requireBusinessOwner, validateBody(updateOrderStatusSchema), async (req: AuthRequest, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, businessId: req.businessId },
    })
    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['DISPATCHED', 'CANCELLED'],
      DISPATCHED: ['DELIVERED'],
      DELIVERED: ['REFUNDED'],
      CANCELLED: [],
      REFUNDED: [],
    }
    if (!validTransitions[order.status]?.includes(req.body.status)) {
      res.status(400).json({ error: `Cannot transition from ${order.status} to ${req.body.status}` })
      return
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: req.body.status,
        statusHistory: {
          create: {
            status: req.body.status,
            note: req.body.note,
            changedBy: req.userId!,
          },
        },
      },
      include: { items: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
    })

    // Emit socket event order:status to customer + chat integration
    try {
      const io = getIO()
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { items: true },
      })
      
      if (order) {
        io.to(`user:${order.userId}`).emit('order:status', {
          orderId: req.params.id,
          status: req.body.status,
          note: req.body.note,
        })
        
        // ─── Chat Message Integration ✨ ───
        let chat = await prisma.chat.findFirst({
          where: {
            AND: [
              { members: { some: { userId: order.userId } } },
              { members: { some: { userId: req.userId! } } }, // business owner is the sender
            ]
          },
          include: { members: true }
        })

        if (!chat) {
          chat = await prisma.chat.create({
            data: { members: { create: [{ userId: order.userId }, { userId: req.userId! }] } },
            include: { members: true }
          })
        }

        const msg = await prisma.message.create({
          data: {
            chatId: chat.id,
            senderId: req.userId!,
            type: 'ORDER_UPDATE',
            content: `Order #${order.orderNumber} status updated to ${req.body.status}`,
            metadata: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              status: req.body.status,
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
      logger.warn('Socket emit failed for order:status', { error: socketErr })
    }

    res.json(updated)
  } catch (error) {
    logger.error('Update order status error', { error })
    res.status(500).json({ error: 'Failed to update status' })
  }
})

// GET /stats — dashboard stats
router.get('/stats', requireAuth, requireBusinessOwner, async (req: AuthRequest, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [todayOrders, todayRevenue, pendingCount, deliveredThisWeek] = await Promise.all([
      prisma.order.count({
        where: { businessId: req.businessId, createdAt: { gte: today } },
      }),
      prisma.order.aggregate({
        where: { businessId: req.businessId, createdAt: { gte: today }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { businessId: req.businessId, status: 'PENDING' },
      }),
      prisma.order.count({
        where: { businessId: req.businessId, status: 'DELIVERED', updatedAt: { gte: weekAgo } },
      }),
    ])

    res.json({
      todayOrders,
      todayRevenue: (todayRevenue._sum.total ?? 0).toString(),
      pendingCount,
      deliveredThisWeek,
    })
  } catch (error) {
    logger.error('Get business stats error', { error })
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router
