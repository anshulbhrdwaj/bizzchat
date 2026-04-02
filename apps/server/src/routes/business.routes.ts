import { Router } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import prisma from '../lib/prisma'
import logger from '../lib/logger'
import { requireAuth, requireBusinessOwner, AuthRequest } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createBusinessProfileSchema, updateBusinessProfileSchema } from '@bizchat/shared'
import { processImage } from '../lib/imageProcessor'

const router: Router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

const uploadDir = process.env.UPLOAD_DIR || './uploads'

// Ensure upload directory exists
function ensureUploadDir(subdir: string) {
  const dir = path.join(uploadDir, subdir)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

// GET /profile — own business profile
router.get('/profile', requireAuth, requireBusinessOwner, async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.businessProfile.findUnique({
      where: { id: req.businessId },
      include: { collections: { orderBy: { sortOrder: 'asc' } } },
    })
    res.json(profile)
  } catch (error) {
    logger.error('Get business profile error', { error })
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// GET /:id/profile — public business profile
router.get('/:id/profile', async (req, res) => {
  try {
    const profile = await prisma.businessProfile.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { isOnline: true, lastSeen: true } } }
    })
    if (!profile) {
      res.status(404).json({ error: 'Business not found' })
      return
    }
    res.json(profile)
  } catch (error) {
    logger.error('Get public business profile error', { error })
    res.status(500).json({ error: 'Failed to fetch business profile' })
  }
})

// POST /profile — create profile
router.post('/profile', requireAuth, validateBody(createBusinessProfileSchema), async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.businessProfile.findUnique({ where: { userId: req.userId } })
    if (existing) {
      res.status(409).json({ error: 'Business profile already exists' })
      return
    }
    const profile = await prisma.businessProfile.create({
      data: { ...req.body, userId: req.userId! },
    })
    res.status(201).json(profile)
  } catch (error) {
    logger.error('Create business profile error', { error })
    res.status(500).json({ error: 'Failed to create profile' })
  }
})

// PUT /profile — update
router.put('/profile', requireAuth, requireBusinessOwner, validateBody(updateBusinessProfileSchema), async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.businessProfile.update({
      where: { id: req.businessId },
      data: req.body,
    })
    res.json(profile)
  } catch (error) {
    logger.error('Update business profile error', { error })
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// POST /profile/logo — upload logo (WebP 400px)
router.post('/profile/logo', requireAuth, requireBusinessOwner, upload.single('logo'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }
    const { fullBuffer } = await processImage(req.file.buffer, 'logo')
    const dir = ensureUploadDir('logos')
    const filename = `${req.businessId}-${Date.now()}.webp`
    const filepath = path.join(dir, filename)
    fs.writeFileSync(filepath, fullBuffer)

    const logoUrl = `/uploads/logos/${filename}`
    await prisma.businessProfile.update({
      where: { id: req.businessId },
      data: { logoUrl },
    })
    res.json({ logoUrl })
  } catch (error) {
    logger.error('Upload logo error', { error })
    res.status(500).json({ error: 'Failed to upload logo' })
  }
})

// POST /profile/cover — upload cover (WebP 1200px)
router.post('/profile/cover', requireAuth, requireBusinessOwner, upload.single('cover'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }
    const { fullBuffer } = await processImage(req.file.buffer, 'cover')
    const dir = ensureUploadDir('covers')
    const filename = `${req.businessId}-${Date.now()}.webp`
    const filepath = path.join(dir, filename)
    fs.writeFileSync(filepath, fullBuffer)

    const coverUrl = `/uploads/covers/${filename}`
    await prisma.businessProfile.update({
      where: { id: req.businessId },
      data: { coverUrl },
    })
    res.json({ coverUrl })
  } catch (error) {
    logger.error('Upload cover error', { error })
    res.status(500).json({ error: 'Failed to upload cover' })
  }
})

// GET /dashboard — business analytics dashboard
router.get('/dashboard', requireAuth, requireBusinessOwner, async (req: AuthRequest, res) => {
  try {
    const biz = req.businessId!

    const now = new Date()
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)

    // Month boundaries
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    // 7-day window
    const sevenDaysAgo = new Date(todayStart)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    const [
      totalOrders,
      pendingOrders,
      allDelivered,
      thisMonthRevAgg,
      lastMonthRevAgg,
      uniqueUsersAll,
      recentOrders,
      allOrdersLast7,
      topItemsRaw,
      statusCounts,
    ] = await Promise.all([
      // total orders ever
      prisma.order.count({ where: { businessId: biz } }),
      // pending
      prisma.order.count({ where: { businessId: biz, status: 'PENDING' } }),
      // all delivered for total revenue
      prisma.order.aggregate({
        where: { businessId: biz, status: 'DELIVERED' },
        _sum: { total: true },
      }),
      // this month revenue (non-cancelled)
      prisma.order.aggregate({
        where: { businessId: biz, createdAt: { gte: thisMonthStart }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      // last month
      prisma.order.aggregate({
        where: { businessId: biz, createdAt: { gte: lastMonthStart, lte: lastMonthEnd }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      // unique customers
      prisma.order.findMany({
        where: { businessId: biz },
        select: { userId: true },
        distinct: ['userId'],
      }),
      // recent 8 orders
      prisma.order.findMany({
        where: { businessId: biz },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } }, items: true },
      }),
      // all orders in last 7 days for chart
      prisma.order.findMany({
        where: { businessId: biz, createdAt: { gte: sevenDaysAgo }, status: { not: 'CANCELLED' } },
        select: { createdAt: true, total: true },
      }),
      // top 5 products by revenue
      prisma.orderItem.groupBy({
        by: ['productName'],
        where: { order: { businessId: biz, status: { not: 'CANCELLED' } } },
        _sum: { lineTotal: true },
        orderBy: { _sum: { lineTotal: 'desc' } },
        take: 5,
      }),
      // status distribution
      prisma.order.groupBy({
        by: ['status'],
        where: { businessId: biz },
        _count: { id: true },
      }),
    ])

    // Build 7-day chart (last 7 calendar days, day 0 = oldest)
    const chartDays: { label: string; revenue: number; orders: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart)
      d.setDate(d.getDate() - i)
      const label = d.toLocaleDateString('en-IN', { weekday: 'short' })
      const dayStart = d.getTime()
      const dayEnd = dayStart + 86_400_000
      const dayOrders = allOrdersLast7.filter(o => {
        const t = new Date(o.createdAt).getTime()
        return t >= dayStart && t < dayEnd
      })
      chartDays.push({
        label,
        revenue: dayOrders.reduce((s, o) => s + Number(o.total), 0),
        orders: dayOrders.length,
      })
    }

    const thisMonthRev = Number(thisMonthRevAgg._sum.total ?? 0)
    const lastMonthRev = Number(lastMonthRevAgg._sum.total ?? 0)
    const revenueGrowth = lastMonthRev === 0
      ? (thisMonthRev > 0 ? 100 : 0)
      : Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100)

    const todayRevenue = chartDays[chartDays.length - 1]?.revenue ?? 0
    const totalRevenue = Number(allDelivered._sum.total ?? 0)

    res.json({
      kpis: {
        totalOrders,
        pendingOrders,
        revenue: totalRevenue,
        thisMonthRevenue: thisMonthRev,
        todayRevenue,
        revenueGrowth,
        customers: uniqueUsersAll.length,
      },
      chart: chartDays,
      recentOrders,
      topProducts: topItemsRaw.map(r => ({
        name: r.productName,
        revenue: Number(r._sum.lineTotal ?? 0),
      })),
      statusDistribution: statusCounts.map(s => ({
        status: s.status,
        count: s._count.id,
      })),
    })
  } catch (error) {
    logger.error('Get dashboard error', { error })
    res.status(500).json({ error: 'Failed to fetch dashboard' })
  }
})

export default router



