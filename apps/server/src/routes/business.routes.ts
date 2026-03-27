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

export default router

