import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();
router.use(authenticate);

// Helper to get chat for user with last message
async function getChatsForUser(userId: string) {
  const participants = await prisma.chatParticipant.findMany({
    where: { userId, archivedAt: null },
    include: {
      chat: {
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true, isOnline: true, lastSeen: true, isVerifiedBusiness: true } },
            },
          },
          group: { select: { id: true, name: true, avatarUrl: true, description: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { sender: { select: { id: true, name: true } } },
          },
        },
      },
    },
    orderBy: { chat: { updatedAt: 'desc' } },
  });

  return participants.map(p => {
    const chat = p.chat;
    const lastMessage = chat.messages[0] || null;
    const otherParticipant = chat.type === 'DIRECT'
      ? chat.participants.find(cp => cp.userId !== userId)?.user
      : null;

    // Unread count
    const unread = 0; // computed separately if needed

    return {
      id: chat.id,
      type: chat.type,
      updatedAt: chat.updatedAt,
      group: chat.group,
      otherUser: otherParticipant,
      participants: chat.participants.map(cp => cp.user),
      lastMessage,
      unreadCount: unread,
      mutedUntil: p.mutedUntil,
      wallpaper: p.wallpaper,
      lastReadAt: p.lastReadAt,
    };
  });
}

// GET /api/v1/chats
router.get('/', async (req: AuthRequest, res: Response) => {
  const chats = await getChatsForUser(req.userId!);
  res.json(chats);
});

// POST /api/v1/chats/direct — start or get direct chat
const directSchema = z.object({ userId: z.string() });
router.post('/direct', validate(directSchema), async (req: AuthRequest, res: Response) => {
  const { userId } = req.body as { userId: string };
  const myId = req.userId!;

  // Check if direct chat already exists between the two users
  const existing = await prisma.chat.findFirst({
    where: {
      type: 'DIRECT',
      AND: [
        { participants: { some: { userId: myId } } },
        { participants: { some: { userId } } },
      ],
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, avatarUrl: true, isOnline: true, lastSeen: true } } },
      },
    },
  });

  if (existing) { res.json(existing); return; }

  // Create new chat
  const chat = await prisma.chat.create({
    data: {
      type: 'DIRECT',
      participants: {
        create: [{ userId: myId }, { userId }],
      },
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, avatarUrl: true, isOnline: true, lastSeen: true } } },
      },
    },
  });
  res.status(201).json(chat);
});

// GET /api/v1/chats/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const chat = await prisma.chat.findFirst({
    where: {
      id: req.params.id,
      participants: { some: { userId: req.userId } },
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, avatarUrl: true, isOnline: true, lastSeen: true } } },
      },
      group: true,
      pinnedMessages: {
        include: { message: { include: { sender: { select: { id: true, name: true } } } } },
        orderBy: { pinnedAt: 'desc' },
      },
    },
  });
  if (!chat) { res.status(404).json({ error: 'Chat not found' }); return; }

  const mappedChat = {
    ...chat,
    participants: chat.participants.map(p => p.user),
    otherUser: chat.type === 'DIRECT' ? chat.participants.find(p => p.userId !== req.userId)?.user : undefined,
  };

  res.json(mappedChat);
});

// PATCH /api/v1/chats/:id/mute
const muteSchema = z.object({ until: z.string().datetime().nullable() });
router.patch('/:id/mute', validate(muteSchema), async (req: AuthRequest, res: Response) => {
  const { until } = req.body as { until: string | null };
  await prisma.chatParticipant.update({
    where: { chatId_userId: { chatId: req.params.id, userId: req.userId! } },
    data: { mutedUntil: until ? new Date(until) : null },
  });
  res.json({ success: true });
});

// PATCH /api/v1/chats/:id/archive
router.patch('/:id/archive', async (req: AuthRequest, res: Response) => {
  const { archive } = req.body as { archive: boolean };
  await prisma.chatParticipant.update({
    where: { chatId_userId: { chatId: req.params.id, userId: req.userId! } },
    data: { archivedAt: archive ? new Date() : null },
  });
  res.json({ success: true });
});

// GET /api/v1/chats/archived/list
router.get('/archived/list', async (req: AuthRequest, res: Response) => {
  const participants = await prisma.chatParticipant.findMany({
    where: { userId: req.userId, archivedAt: { not: null } },
    include: { chat: { include: { participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } }, group: true, messages: { take: 1, orderBy: { createdAt: 'desc' } } } } },
  });
  res.json(participants.map(p => p.chat));
});

export default router;
