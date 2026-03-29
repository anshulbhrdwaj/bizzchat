import { Router } from 'express'
import prisma from '../lib/prisma'
import logger from '../lib/logger'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router: Router = Router()

// GET / - List all contacts for the user
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const contacts = await prisma.contact.findMany({
      where: { userId: req.userId },
      include: {
        contact: {
          select: { id: true, name: true, phone: true, avatarUrl: true, isOnline: true, lastSeen: true }
        }
      },
      orderBy: { savedName: 'asc' }
    })
    
    // Map the response to merge savedName with contact profile
    const formatted = contacts.map(c => ({
      ...c.contact,
      id: c.id,
      contactId: c.contactId,
      savedName: c.savedName,
      // If no saved name, use their profile name, or phone as fallback
      displayName: c.savedName || c.contact.name || c.contact.phone
    }))
    
    res.json(formatted)
  } catch (error) {
    logger.error('Get contacts error', { error })
    res.status(500).json({ error: 'Failed to fetch contacts' })
  }
})

// POST / - Add a new contact by phone
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { phone, savedName } = req.body
    
    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' })
      return
    }

    // Find the user by phone
    const contactUser = await prisma.user.findUnique({ where: { phone } })
    if (!contactUser) {
      res.status(404).json({ error: 'User not found on BizChat' })
      return
    }

    if (contactUser.id === req.userId) {
      res.status(400).json({ error: 'Cannot add yourself as a contact' })
      return
    }

    // Upsert the contact
    const contact = await prisma.contact.upsert({
      where: {
        userId_contactId: {
          userId: req.userId!,
          contactId: contactUser.id
        }
      },
      update: { savedName },
      create: {
        userId: req.userId!,
        contactId: contactUser.id,
        savedName
      },
      include: {
        contact: {
          select: { id: true, name: true, phone: true, avatarUrl: true, isOnline: true, lastSeen: true }
        }
      }
    })

    const formatted = {
      ...contact.contact,
      id: contact.id,
      contactId: contact.contactId,
      savedName: contact.savedName,
      displayName: contact.savedName || contact.contact.name || contact.contact.phone
    }

    res.status(201).json(formatted)
  } catch (error) {
    logger.error('Add contact error', { error })
    res.status(500).json({ error: 'Failed to add contact' })
  }
})

// PUT /:id - Edit a contact (e.g., change savedName)
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { savedName } = req.body
    
    // Verify ownership
    const existing = await prisma.contact.findUnique({ where: { id: req.params.id } })
    if (!existing || existing.userId !== req.userId) {
      res.status(404).json({ error: 'Contact not found' })
      return
    }

    const updated = await prisma.contact.update({
      where: { id: req.params.id },
      data: { savedName }
    })
    
    res.json(updated)
  } catch (error) {
    logger.error('Update contact error', { error })
    res.status(500).json({ error: 'Failed to update contact' })
  }
})

// DELETE /:id - Remove a contact
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.contact.findUnique({ where: { id: req.params.id } })
    if (!existing || existing.userId !== req.userId) {
      res.status(404).json({ error: 'Contact not found' })
      return
    }
    
    await prisma.contact.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (error) {
    logger.error('Delete contact error', { error })
    res.status(500).json({ error: 'Failed to delete contact' })
  }
})

export default router
