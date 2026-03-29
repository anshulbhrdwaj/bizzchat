import { Router } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import prisma from '../lib/prisma'
import logger from '../lib/logger'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { processImage } from '../lib/imageProcessor'

const router: Router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

const uploadDir = process.env.UPLOAD_DIR || './uploads'

function ensureUploadDir(subdir: string) {
  const dir = path.join(uploadDir, subdir)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

// GET /me
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        phone: true,
        name: true,
        avatarUrl: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    res.json(user)
  } catch (error) {
    logger.error('Get profile error', { error })
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// PUT /me
router.put('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, avatarUrl } = req.body
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { name, avatarUrl },
      select: {
        id: true,
        phone: true,
        name: true,
        avatarUrl: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    res.json(updated)
  } catch (error) {
    logger.error('Update profile error', { error })
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// POST /me/avatar
router.post('/me/avatar', requireAuth, upload.single('avatar'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }
    const { fullBuffer } = await processImage(req.file.buffer, 'avatar')
    const dir = ensureUploadDir('avatars')
    const filename = `${req.userId}-${Date.now()}.webp`
    const filepath = path.join(dir, filename)
    fs.writeFileSync(filepath, fullBuffer)

    const avatarUrl = `/uploads/avatars/${filename}`
    await prisma.user.update({
      where: { id: req.userId },
      data: { avatarUrl },
    })
    res.json({ url: avatarUrl })
  } catch (error) {
    logger.error('Upload avatar error', { error })
    res.status(500).json({ error: 'Failed to upload avatar' })
  }
})

// POST /by-phone
router.post('/by-phone', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { phone } = req.body
    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' })
      return
    }
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true, phone: true, avatarUrl: true },
    })
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(user)
  } catch (error) {
    logger.error('Find by phone error', { error })
    res.status(500).json({ error: 'Failed to find user' })
  }
})

export default router
