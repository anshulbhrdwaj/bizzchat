import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import logger from '../lib/logger'

// Socket auth middleware
function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('No auth token'))

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string }
    socket.data.userId = payload.sub
    next()
  } catch {
    next(new Error('Invalid token'))
  }
}

async function broadcastPresence(io: Server, userId: string, isOnline: boolean) {
  // Get all chats this user is in, broadcast to those rooms
  const memberships = await prisma.chatMember.findMany({
    where: { userId },
    select: { chatId: true },
  })
  const lastSeen = new Date().toISOString()
  for (const m of memberships) {
    io.to(`chat:${m.chatId}`).emit('presence:update', { userId, isOnline, lastSeen })
  }
}

export function setupSocketHandlers(io: Server) {
  io.use(socketAuthMiddleware)

  io.on('connection', async (socket) => {
    const userId = socket.data.userId
    logger.info('Socket connected', { userId, socketId: socket.id })

    // Join user-specific room
    socket.join(`user:${userId}`)

    // Mark user online
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeen: new Date() },
    })
    await broadcastPresence(io, userId, true)

    // Join all chat rooms for real-time background events (receipts, etc)
    const memberships = await prisma.chatMember.findMany({
      where: { userId },
      select: { chatId: true }
    })
    for (const m of memberships) {
      socket.join(`chat:${m.chatId}`)
    }

    // Automatically mark all undelivered messages to this user as delivered
    const undeliveredMessages = await prisma.message.findMany({
      where: {
        chat: { members: { some: { userId } } },
        senderId: { not: userId },
        deliveredAt: null
      },
      select: { id: true, chatId: true }
    });

    if (undeliveredMessages.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: undeliveredMessages.map(m => m.id) } },
        data: { deliveredAt: new Date() }
      });

      // Broadcast delivered status for all these messages
      const nowStr = new Date().toISOString()
      for (const msg of undeliveredMessages) {
        io.to(`chat:${msg.chatId}`).emit('message:delivered', {
          messageId: msg.id,
          deliveredAt: nowStr
        });
      }
    }

    // ─── Chat Room Management ───────────────────────
    socket.on('join:chat', (chatId: string) => {
      socket.join(`chat:${chatId}`)
    })

    socket.on('leave:chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`)
    })

    // ─── Delivery Receipts ──────────────────────────
    socket.on('message:delivered', async (data: { chatId: string; messageId: string }) => {
      try {
        await prisma.message.update({
          where: { id: data.messageId },
          data: { deliveredAt: new Date() },
        })
        socket.to(`chat:${data.chatId}`).emit('message:delivered', {
          messageId: data.messageId,
          deliveredAt: new Date().toISOString(),
        })
      } catch (error) {
        logger.error('Socket message:delivered error', { error, userId })
      }
    })

    // ─── Messages ───────────────────────────────────
    socket.on('message:send', async (data: {
      chatId: string
      type: string
      content?: string
      replyToId?: string
      metadata?: Record<string, unknown>
    }) => {
      try {
        const message = await prisma.message.create({
          data: {
            chatId: data.chatId,
            senderId: userId,
            type: data.type as any,
            content: data.content,
            replyToId: data.replyToId,
            metadata: data.metadata as any,
          },
          include: {
            sender: { select: { id: true, name: true, avatarUrl: true } },
            replyTo: { include: { sender: { select: { id: true, name: true } } } },
          },
        })

        await prisma.chat.update({
          where: { id: data.chatId },
          data: { updatedAt: new Date() },
        })

        io.to(`chat:${data.chatId}`).emit('message:new', message)

        // Notify chat list updates
        const members = await prisma.chatMember.findMany({
          where: { chatId: data.chatId },
        })
        for (const m of members) {
          const unreadCount = await prisma.message.count({
            where: {
              chatId: data.chatId,
              createdAt: { gt: m.lastRead },
              senderId: { not: m.userId },
            },
          })
          io.to(`user:${m.userId}`).emit('chat:updated', {
            chatId: data.chatId,
            lastMessage: message,
            unreadCount,
          })
        }
      } catch (error) {
        logger.error('Socket message:send error', { error, userId })
      }
    })

    socket.on('message:read', async (data: { chatId: string; messageId: string }) => {
      try {
        await prisma.chatMember.update({
          where: { chatId_userId: { chatId: data.chatId, userId } },
          data: { lastRead: new Date() },
        })
        await prisma.message.update({
          where: { id: data.messageId },
          data: { readAt: new Date(), deliveredAt: new Date() },
        })
        socket.to(`chat:${data.chatId}`).emit('message:read', {
          messageId: data.messageId,
          readAt: new Date().toISOString(),
          deliveredAt: new Date().toISOString()
        })
      } catch (error) {
        logger.error('Socket message:read error', { error, userId })
      }
    })

    socket.on('chat:read', async (data: { chatId: string }) => {
      try {
        const now = new Date()
        const nowStr = now.toISOString()
        
        await prisma.chatMember.update({
          where: { chatId_userId: { chatId: data.chatId, userId } },
          data: { lastRead: now },
        })

        const unreadMsgs = await prisma.message.findMany({
          where: {
            chatId: data.chatId,
            senderId: { not: userId },
            readAt: null
          },
          select: { id: true }
        })

        if (unreadMsgs.length > 0) {
          const ids = unreadMsgs.map(m => m.id)
          await prisma.message.updateMany({
            where: { id: { in: ids } },
            data: { readAt: now, deliveredAt: now }
          })
          
          for (const msg of unreadMsgs) {
            socket.to(`chat:${data.chatId}`).emit('message:read', {
              messageId: msg.id,
              readAt: nowStr,
              deliveredAt: nowStr
            })
          }
        }
      } catch (error) {
        logger.error('Socket chat:read error', { error, userId })
      }
    })

    socket.on('message:react', async (data: { messageId: string; emoji: string }) => {
      try {
        const existing = await prisma.messageReaction.findUnique({
          where: { messageId_userId: { messageId: data.messageId, userId } },
        })
        if (existing && existing.emoji === data.emoji) {
          await prisma.messageReaction.delete({ where: { id: existing.id } })
        } else if (existing) {
          await prisma.messageReaction.update({
            where: { id: existing.id },
            data: { emoji: data.emoji },
          })
        } else {
          await prisma.messageReaction.create({
            data: { messageId: data.messageId, userId, emoji: data.emoji },
          })
        }
        // Broadcast updated reactions
        const message = await prisma.message.findUnique({
          where: { id: data.messageId },
          include: { reactions: true },
        })
        if (message) {
          io.to(`chat:${message.chatId}`).emit('message:reacted', {
            messageId: data.messageId,
            reactions: message.reactions,
          })
        }
      } catch (error) {
        logger.error('Socket message:react error', { error, userId })
      }
    })

    // ─── Typing ─────────────────────────────────────
    socket.on('typing:start', ({ chatId }: { chatId: string }) => {
      socket.to(`chat:${chatId}`).emit('typing:indicator', { chatId, userId, isTyping: true })
    })

    socket.on('typing:stop', ({ chatId }: { chatId: string }) => {
      socket.to(`chat:${chatId}`).emit('typing:indicator', { chatId, userId, isTyping: false })
    })

    // ─── Presence ───────────────────────────────────
    socket.on('presence:ping', () => {
      prisma.user.update({
        where: { id: userId },
        data: { lastSeen: new Date() },
      }).catch(err => logger.error('Presence ping error', { error: err }))
    })

    // ─── Disconnect ─────────────────────────────────
    socket.on('disconnect', async () => {
      logger.info('Socket disconnected', { userId, socketId: socket.id })
      // Wait 30s before marking offline (handles page refreshes)
      setTimeout(async () => {
        const sessions = await io.in(`user:${userId}`).fetchSockets()
        if (sessions.length === 0) {
          await prisma.user.update({
            where: { id: userId },
            data: { isOnline: false, lastSeen: new Date() },
          })
          await broadcastPresence(io, userId, false)
        }
      }, 30000)
    })
  })
}
