import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import { uploadFile } from '../lib/storage';
import { prisma } from '../lib/prisma';
import { getIO } from '../index';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

router.post('/upload', authenticate, upload.single('file'), async (req: any, res, next) => {
  try {
    const { chatId } = req.query;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file provided' });
    if (!chatId) return res.status(400).json({ error: 'chatId required' });

    // Verify membership
    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId: chatId as string, userId: req.userId } },
    });
    if (!participant) return res.status(403).json({ error: 'Not a participant' });

    const mediaUrl = await uploadFile(file.buffer, file.originalname, file.mimetype);
    const mediaType = file.mimetype;

    // Determine message type from mime
    const msgType = mediaType.startsWith('image/') ? 'IMAGE'
      : mediaType.startsWith('video/') ? 'VIDEO'
      : mediaType.startsWith('audio/') ? 'AUDIO'
      : 'DOCUMENT';

    const message = await prisma.message.create({
      data: {
        chatId: chatId as string,
        senderId: req.userId,
        type: msgType as any,
        mediaUrl,
        mediaType,
        mediaSize: file.size,
        fileName: file.originalname,
        sentAt: new Date(),
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        reactions: true,
        statuses: true,
      },
    });

    await prisma.chat.update({ where: { id: chatId as string }, data: { updatedAt: new Date() } });

    // Emit to chat room
    try {
      const io = getIO();
      io.to(`chat:${chatId}`).emit('new_message', message);
    } catch {}

    res.json({ url: mediaUrl, message });
  } catch (err) {
    next(err);
  }
});

export default router;
