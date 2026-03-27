import { Router } from 'express'
import prisma from '../lib/prisma'
import logger from '../lib/logger'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createChatSchema, sendMessageSchema, deleteMessageSchema, reactToMessageSchema } from '@bizchat/shared'
import { getIO } from '../index'

const router: Router = Router()

// GET / — all chats with last message + unread count
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const memberships = await prisma.chatMember.findMany({
      where: { userId: req.userId! },
      include: {
        chat: {
          include: {
            members: { include: { user: { select: { id: true, name: true, avatarUrl: true, isOnline: true, lastSeen: true } } } },
            messages: { take: 1, orderBy: { createdAt: 'desc' }, include: { sender: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { chat: { updatedAt: 'desc' } },
    })

    const chats = memberships.map(m => {
      const unreadCount = 0 // TODO: Calculate based on lastRead vs message count
      return {
        ...m.chat,
        lastMessage: m.chat.messages[0] ?? null,
        unreadCount,
      }
    })

    res.json(chats)
  } catch (error) {
    logger.error('Get chats error', { error })
    res.status(500).json({ error: 'Failed to fetch chats' })
  }
})

// POST / — create or retrieve DM
router.post('/', requireAuth, validateBody(createChatSchema), async (req: AuthRequest, res) => {
  try {
    const { recipientId } = req.body

    // Check for existing DM
    const existing = await prisma.chat.findFirst({
      where: {
        AND: [
          { members: { some: { userId: req.userId! } } },
          { members: { some: { userId: recipientId } } },
        ],
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true, isOnline: true, lastSeen: true } } } },
      },
    })

    if (existing) {
      res.json(existing)
      return
    }

    // Create new DM
    const chat = await prisma.chat.create({
      data: {
        members: {
          create: [{ userId: req.userId! }, { userId: recipientId }],
        },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true, isOnline: true, lastSeen: true } } } },
      },
    })

    res.status(201).json(chat)
  } catch (error) {
    logger.error('Create chat error', { error })
    res.status(500).json({ error: 'Failed to create chat' })
  }
})

// GET /:id/messages — cursor paginated, newest first
router.get('/:id/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    // Verify membership
    const member = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: req.params.id, userId: req.userId! } },
    })
    if (!member) {
      res.status(403).json({ error: 'Not a member of this chat' })
      return
    }

    const { cursor, limit = '30' } = req.query
    const take = Math.min(parseInt(limit as string, 10), 50)

    const messages = await prisma.message.findMany({
      where: { chatId: req.params.id },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor as string }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        reactions: true,
        replyTo: { include: { sender: { select: { id: true, name: true } } } },
      },
    })

    const hasMore = messages.length > take
    if (hasMore) messages.pop()

    res.json({
      data: messages,
      cursor: messages.length > 0 ? messages[messages.length - 1].id : null,
      hasMore,
    })
  } catch (error) {
    logger.error('Get messages error', { error })
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// POST /:id/messages — send message
router.post('/:id/messages', requireAuth, validateBody(sendMessageSchema), async (req: AuthRequest, res) => {
  try {
    const member = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: req.params.id, userId: req.userId! } },
    })
    if (!member) {
      res.status(403).json({ error: 'Not a member of this chat' })
      return
    }

    const message = await prisma.message.create({
      data: {
        chatId: req.params.id,
        senderId: req.userId!,
        type: req.body.type,
        content: req.body.content,
        replyToId: req.body.replyToId,
        metadata: req.body.metadata,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        replyTo: { include: { sender: { select: { id: true, name: true } } } },
      },
    })

    // Update chat timestamp
    await prisma.chat.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date() },
    })

    // Emit socket events
    try {
      const io = getIO()
      io.to(`chat:${req.params.id}`).emit('message:new', message)

      // Notify chat list updates for all members
      const members = await prisma.chatMember.findMany({
        where: { chatId: req.params.id },
        select: { userId: true },
      })
      for (const member of members) {
        io.to(`user:${member.userId}`).emit('chat:updated', {
          chatId: req.params.id,
          lastMessage: message,
          unreadCount: 0,
        })
      }
    } catch (socketErr) {
      logger.warn('Socket emit failed in message:send', { error: socketErr })
    }

    res.status(201).json(message)
  } catch (error) {
    logger.error('Send message error', { error })
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// DELETE /messages/:id — soft delete
router.delete('/messages/:id', requireAuth, validateBody(deleteMessageSchema), async (req: AuthRequest, res) => {
  try {
    const message = await prisma.message.findUnique({ where: { id: req.params.id } })
    if (!message || message.senderId !== req.userId) {
      res.status(404).json({ error: 'Message not found' })
      return
    }
    const updated = await prisma.message.update({
      where: { id: req.params.id },
      data: { isDeleted: true, deletedFor: req.body.deleteFor },
    })
    // Emit socket event
    try {
      const io = getIO()
      io.to(`chat:${updated.chatId}`).emit('message:deleted', {
        messageId: req.params.id,
        deletedFor: req.body.deleteFor,
      })
    } catch (socketErr) {
      logger.warn('Socket emit failed in message:deleted', { error: socketErr })
    }
    res.json(updated)
  } catch (error) {
    logger.error('Delete message error', { error })
    res.status(500).json({ error: 'Failed to delete message' })
  }
})

// POST /messages/:id/react — toggle emoji reaction
router.post('/messages/:id/react', requireAuth, validateBody(reactToMessageSchema), async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.messageReaction.findUnique({
      where: { messageId_userId: { messageId: req.params.id, userId: req.userId! } },
    })
    if (existing) {
      if (existing.emoji === req.body.emoji) {
        await prisma.messageReaction.delete({ where: { id: existing.id } })
        res.json({ action: 'removed' })
      } else {
        const updated = await prisma.messageReaction.update({
          where: { id: existing.id },
          data: { emoji: req.body.emoji },
        })
        res.json({ action: 'updated', reaction: updated })
      }
    } else {
      const reaction = await prisma.messageReaction.create({
        data: { messageId: req.params.id, userId: req.userId!, emoji: req.body.emoji },
      })
      res.json({ action: 'added', reaction })
    }
  } catch (error) {
    logger.error('React to message error', { error })
    res.status(500).json({ error: 'Failed to react' })
  }
})

export default router
