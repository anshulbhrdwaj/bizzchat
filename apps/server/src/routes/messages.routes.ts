import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();
router.use(authenticate);

// GET /api/v1/messages/:chatId
router.get('/:chatId', async (req: AuthRequest, res: Response) => {
  const { chatId } = req.params;
  const cursor = req.query.cursor as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string || '50'), 100);

  // Verify membership
  const participant = await prisma.chatParticipant.findUnique({
    where: { chatId_userId: { chatId, userId: req.userId! } },
  });
  if (!participant) { res.status(403).json({ error: 'Not a member' }); return; }

  const messages = await prisma.message.findMany({
    where: { chatId, isDeleted: false },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      replyTo: {
        select: { id: true, content: true, type: true, sender: { select: { id: true, name: true } } },
      },
      reactions: true,
      statuses: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  // Mark messages as read
  await prisma.chatParticipant.update({
    where: { chatId_userId: { chatId, userId: req.userId! } },
    data: { lastReadAt: new Date() },
  });

  res.json({
    messages: messages.reverse(),
    nextCursor: messages.length === limit ? messages[0]?.id : null,
  });
});

// POST /api/v1/messages/:chatId — send text message
const sendSchema = z.object({
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'VOICE', 'DOCUMENT', 'LOCATION', 'STICKER', 'GIF']).default('TEXT'),
  content: z.string().max(4096).optional(),
  replyToId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationName: z.string().optional(),
});

router.post('/:chatId', validate(sendSchema), async (req: AuthRequest, res: Response) => {
  const { chatId } = req.params;
  const { type, content, replyToId, latitude, longitude, locationName } = req.body as z.infer<typeof sendSchema>;

  // Verify membership
  const participant = await prisma.chatParticipant.findUnique({
    where: { chatId_userId: { chatId, userId: req.userId! } },
  });
  if (!participant) { res.status(403).json({ error: 'Not a member' }); return; }

  const message = await prisma.message.create({
    data: {
      chatId,
      senderId: req.userId!,
      type: type as any,
      content,
      replyToId,
      latitude,
      longitude,
      locationName,
      sentAt: new Date(),
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      replyTo: { select: { id: true, content: true, type: true, sender: { select: { id: true, name: true } } } },
      reactions: true,
      statuses: true,
    },
  });

  // Update chat updatedAt
  await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });

  res.status(201).json(message);
});

// POST /api/v1/messages/:chatId/media — send media message
router.post('/:chatId/media', upload.single('file'), async (req: AuthRequest, res: Response) => {
  const { chatId } = req.params;
  if (!req.file) { res.status(400).json({ error: 'No file provided' }); return; }

  const participant = await prisma.chatParticipant.findUnique({
    where: { chatId_userId: { chatId, userId: req.userId! } },
  });
  if (!participant) { res.status(403).json({ error: 'Not a member' }); return; }

  const mediaUrl = `/uploads/${req.file.filename}`;
  const mimeType = req.file.mimetype;

  let type = 'DOCUMENT';
  if (mimeType.startsWith('image/')) type = 'IMAGE';
  else if (mimeType.startsWith('video/')) type = 'VIDEO';
  else if (mimeType.startsWith('audio/')) type = 'AUDIO';

  const message = await prisma.message.create({
    data: {
      chatId,
      senderId: req.userId!,
      type: type as any,
      mediaUrl,
      mediaType: mimeType,
      mediaSize: req.file.size,
      fileName: req.file.originalname,
      sentAt: new Date(),
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      reactions: true,
      statuses: true,
    },
  });

  await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
  res.status(201).json(message);
});

// PATCH /api/v1/messages/:id — edit message
const editSchema = z.object({ content: z.string().min(1).max(4096) });
router.patch('/:id', validate(editSchema), async (req: AuthRequest, res: Response) => {
  const message = await prisma.message.findUnique({ where: { id: req.params.id } });
  if (!message || message.senderId !== req.userId) { res.status(403).json({ error: 'Forbidden' }); return; }

  const updated = await prisma.message.update({
    where: { id: req.params.id },
    data: {
      content: req.body.content,
      isEdited: true,
      editHistory: [...(message.editHistory as any[] || []), { content: message.content, editedAt: new Date() }],
    },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } }, reactions: true, statuses: true },
  });
  res.json(updated);
});

// DELETE /api/v1/messages/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { forEveryone } = req.query;
  const message = await prisma.message.findUnique({ where: { id: req.params.id } });
  if (!message) { res.status(404).json({ error: 'Not found' }); return; }

  if (forEveryone === 'true' && message.senderId === req.userId) {
    await prisma.message.update({
      where: { id: req.params.id },
      data: { isDeleted: true, deletedAt: new Date(), content: null },
    });
  } else {
    await prisma.message.update({
      where: { id: req.params.id },
      data: { deletedFor: { push: req.userId! } },
    });
  }
  res.json({ success: true });
});

// POST /api/v1/messages/:id/react
const reactSchema = z.object({ emoji: z.string().min(1).max(10) });
router.post('/:id/react', validate(reactSchema), async (req: AuthRequest, res: Response) => {
  const { emoji } = req.body as { emoji: string };
  const existing = await prisma.reaction.findUnique({
    where: { messageId_userId_emoji: { messageId: req.params.id, userId: req.userId!, emoji } },
  });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { messageId: req.params.id, userId: req.userId!, emoji } });
  }
  const reactions = await prisma.reaction.findMany({ where: { messageId: req.params.id } });
  res.json(reactions);
});

// POST /api/v1/messages/:id/star
router.post('/:id/star', async (req: AuthRequest, res: Response) => {
  await prisma.starredMessage.upsert({
    where: { userId_messageId: { userId: req.userId!, messageId: req.params.id } },
    create: { userId: req.userId!, messageId: req.params.id },
    update: {},
  });
  res.json({ success: true });
});

// DELETE /api/v1/messages/:id/star
router.delete('/:id/star', async (req: AuthRequest, res: Response) => {
  await prisma.starredMessage.deleteMany({ where: { userId: req.userId, messageId: req.params.id } });
  res.json({ success: true });
});

// POST /api/v1/messages/:chatId/read
router.post('/:chatId/read', async (req: AuthRequest, res: Response) => {
  const { chatId } = req.params;
  await prisma.chatParticipant.update({
    where: { chatId_userId: { chatId, userId: req.userId! } },
    data: { lastReadAt: new Date() },
  });
  res.json({ success: true });
});

export default router;
