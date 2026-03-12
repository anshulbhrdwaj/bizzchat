import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { cache } from '../lib/redis';
import { verifyAccessToken } from '../lib/jwt';

interface AuthSocket extends Socket {
  userId?: string;
  phone?: string;
}

export function setupSocketHandlers(io: Server): void {
  // Auth middleware
  io.use(async (socket: AuthSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      socket.phone = payload.phone;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log(`Socket connected: ${userId}`);

    // Join personal room
    socket.join(`user:${userId}`);

    // Join all user's chat rooms
    const participations = await prisma.chatParticipant.findMany({
      where: { userId },
      select: { chatId: true },
    });
    participations.forEach(p => socket.join(`chat:${p.chatId}`));

    // Mark online
    await prisma.user.update({ where: { id: userId }, data: { isOnline: true } }).catch(() => {});
    await cache.set(`user:online:${userId}`, '1', 30);

    // Notify contacts
    const contacts = await prisma.contact.findMany({ where: { contactId: userId }, select: { userId: true } });
    contacts.forEach(c => io.to(`user:${c.userId}`).emit('user_online', { userId }));

    // ── JOIN / LEAVE CHAT ──────────────────────────────
    socket.on('join_chat', (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('leave_chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    // ── SEND MESSAGE ───────────────────────────────────
    socket.on('send_message', async (payload: {
      chatId: string;
      type: string;
      content?: string;
      replyToId?: string;
      tempId?: string;
    }) => {
      try {
        const { chatId, type, content, replyToId, tempId } = payload;

        // Verify member
        const participant = await prisma.chatParticipant.findUnique({
          where: { chatId_userId: { chatId, userId } },
        });
        if (!participant) return;

        const message = await prisma.message.create({
          data: { chatId, senderId: userId, type: type as any, content, replyToId, sentAt: new Date() },
          include: {
            sender: { select: { id: true, name: true, avatarUrl: true } },
            replyTo: { select: { id: true, content: true, type: true, sender: { select: { id: true, name: true } } } },
            reactions: true,
            statuses: true,
          },
        });

        await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });

        // Emit to all in room
        io.to(`chat:${chatId}`).emit('new_message', { ...message, tempId });
      } catch (err) {
        console.error('send_message error:', err);
      }
    });

    // ── TYPING ─────────────────────────────────────────
    socket.on('typing_start', async (chatId: string) => {
      await cache.set(`typing:${chatId}:${userId}`, '1', 3);
      socket.to(`chat:${chatId}`).emit('user_typing', { chatId, userId });
    });

    socket.on('typing_stop', async (chatId: string) => {
      await cache.del(`typing:${chatId}:${userId}`);
      socket.to(`chat:${chatId}`).emit('user_stop_typing', { chatId, userId });
    });

    // ── READ RECEIPTS ──────────────────────────────────
    socket.on('message_read', async (messageIds: string[]) => {
      if (!messageIds?.length) return;
      // Update statuses
      await prisma.messageStatus.updateMany({
        where: { messageId: { in: messageIds }, userId, status: { not: 'READ' } },
        data: { status: 'READ' },
      }).catch(() => {});

      // Get chat to notify sender
      const msg = await prisma.message.findFirst({
        where: { id: messageIds[0] },
        select: { chatId: true, senderId: true },
      });
      if (msg) {
        io.to(`user:${msg.senderId}`).emit('message_status_updated', {
          messageIds,
          status: 'READ',
          userId,
          chatId: msg.chatId,
        });
      }
    });

    socket.on('message_delivered', async (messageId: string) => {
      await prisma.messageStatus.upsert({
        where: { messageId_userId: { messageId, userId } },
        create: { messageId, userId, status: 'DELIVERED' },
        update: { status: 'DELIVERED' },
      }).catch(() => {});
    });

    // ── REACTIONS ─────────────────────────────────────
    socket.on('add_reaction', async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const existing = await prisma.reaction.findUnique({
        where: { messageId_userId_emoji: { messageId, userId, emoji } },
      });
      if (existing) {
        await prisma.reaction.delete({ where: { id: existing.id } });
      } else {
        await prisma.reaction.create({ data: { messageId, userId, emoji } });
      }
      const reactions = await prisma.reaction.findMany({ where: { messageId } });
      const msg = await prisma.message.findUnique({ where: { id: messageId }, select: { chatId: true } });
      if (msg) io.to(`chat:${msg.chatId}`).emit('reaction_updated', { messageId, reactions });
    });

    // ── CALLS (WebRTC Signaling) ───────────────────────
    socket.on('call_initiate', async ({ targetUserId, type }: { targetUserId: string; type: string }) => {
      const call = await prisma.call.create({
        data: {
          type: type as any,
          status: 'RINGING',
          participants: {
            create: [{ userId }, { userId: targetUserId }],
          },
        },
      });
      io.to(`user:${targetUserId}`).emit('call_incoming', {
        callId: call.id,
        callerId: userId,
        type,
      });
      socket.emit('call_initiated', { callId: call.id });
    });

    socket.on('call_accept', async (callId: string) => {
      await prisma.call.update({ where: { id: callId }, data: { status: 'ONGOING' } });
      socket.join(`call:${callId}`);
      socket.to(`call:${callId}`).emit('call_accepted', { callId, userId });
    });

    socket.on('call_decline', async (callId: string) => {
      await prisma.call.update({ where: { id: callId }, data: { status: 'DECLINED', endedAt: new Date() } });
      io.to(`call:${callId}`).emit('call_ended', { callId, reason: 'declined' });
    });

    socket.on('call_end', async (callId: string) => {
      await prisma.call.update({ where: { id: callId }, data: { status: 'ENDED', endedAt: new Date() } });
      io.to(`call:${callId}`).emit('call_ended', { callId, reason: 'ended' });
    });

    socket.on('ice_candidate', ({ callId, candidate }: { callId: string; candidate: unknown }) => {
      socket.to(`call:${callId}`).emit('ice_candidate', { callId, candidate, from: userId });
    });

    socket.on('sdp_offer', ({ callId, sdp }: { callId: string; sdp: unknown }) => {
      socket.join(`call:${callId}`);
      socket.to(`call:${callId}`).emit('sdp_offer', { callId, sdp, from: userId });
    });

    socket.on('sdp_answer', ({ callId, sdp }: { callId: string; sdp: unknown }) => {
      socket.to(`call:${callId}`).emit('sdp_answer', { callId, sdp, from: userId });
    });

    // ── HEARTBEAT ─────────────────────────────────────
    socket.on('heartbeat', async () => {
      await cache.set(`user:online:${userId}`, '1', 30);
    });

    // ── DISCONNECT ────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${userId}`);
      await cache.del(`user:online:${userId}`);
      const lastSeen = new Date();
      await prisma.user.update({ where: { id: userId }, data: { isOnline: false, lastSeen } }).catch(() => {});

      contacts.forEach(c =>
        io.to(`user:${c.userId}`).emit('user_offline', { userId, lastSeen }),
      );
    });
  });
}
