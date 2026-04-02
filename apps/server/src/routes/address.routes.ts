import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma'
import logger from '../lib/logger'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router: Router = Router()

const upsertSchema = z.object({
  label: z.string().min(1).max(50).default('Home'),
  line1: z.string().min(1).max(300),
  isDefault: z.boolean().optional(),
})

// GET /addresses  — list all saved addresses for the authenticated user
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const addresses = await prisma.savedAddress.findMany({
      where: { userId: req.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })
    res.json(addresses)
  } catch (error) {
    logger.error('List addresses error', { error })
    res.status(500).json({ error: 'Failed to fetch addresses' })
  }
})

// POST /addresses  — add a new saved address
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = upsertSchema.parse(req.body)

    // If this address is being set as default, clear all others first
    if (body.isDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId: req.userId },
        data: { isDefault: false },
      })
    }

    const address = await prisma.savedAddress.create({
      data: { userId: req.userId!, ...body },
    })
    res.status(201).json(address)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors })
      return
    }
    logger.error('Create address error', { error })
    res.status(500).json({ error: 'Failed to save address' })
  }
})

// PUT /addresses/:id  — update a saved address
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.savedAddress.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!existing) {
      res.status(404).json({ error: 'Address not found' })
      return
    }

    const body = upsertSchema.partial().parse(req.body)

    // If setting as default, clear all others first
    if (body.isDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId: req.userId },
        data: { isDefault: false },
      })
    }

    const updated = await prisma.savedAddress.update({
      where: { id: req.params.id },
      data: body,
    })
    res.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors })
      return
    }
    logger.error('Update address error', { error })
    res.status(500).json({ error: 'Failed to update address' })
  }
})

// DELETE /addresses/:id  — remove a saved address
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.savedAddress.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!existing) {
      res.status(404).json({ error: 'Address not found' })
      return
    }
    await prisma.savedAddress.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (error) {
    logger.error('Delete address error', { error })
    res.status(500).json({ error: 'Failed to delete address' })
  }
})

export default router
