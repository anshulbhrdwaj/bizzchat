import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();
router.use(authenticate);

// GET /api/v1/users/search?q=
router.get('/search', async (req: AuthRequest, res: Response) => {
  let q = (req.query.q as string) || '';
  // If the frontend passed +91... it might be parsed as ' 91...' depending on the client.
  // We should enforce replacing leading spaces with + for phone number queries, 
  // or generally strip spaces for phone number searches.
  if (q.startsWith(' ')) {
    q = '+' + q.trimStart();
  }
  if (q.length < 2) { res.json([]); return; }
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { phone: { contains: q } },
        { username: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
      NOT: { id: req.userId },
    },
    select: { id: true, name: true, phone: true, username: true, avatarUrl: true, isOnline: true, lastSeen: true, isVerifiedBusiness: true },
    take: 20,
  });
  res.json(users);
});

// GET /api/v1/users/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, username: true, phone: true, about: true,
      avatarUrl: true, isOnline: true, lastSeen: true, isVerifiedBusiness: true,
    },
  });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json(user);
});

// POST /api/v1/users/avatar
router.post('/avatar', upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const avatarUrl = `/uploads/${req.file.filename}`;
  await prisma.user.update({ where: { id: req.userId }, data: { avatarUrl } });
  res.json({ avatarUrl });
});

// GET /api/v1/users/contacts/list
router.get('/contacts/list', async (req: AuthRequest, res: Response) => {
  const contacts = await prisma.contact.findMany({
    where: { userId: req.userId },
    include: {
      contact: {
        select: { id: true, name: true, username: true, avatarUrl: true, isOnline: true, lastSeen: true, isVerifiedBusiness: true },
      },
    },
  });
  res.json(contacts.map(c => ({ ...c.contact, nickname: c.nickname, isFavorite: c.isFavorite })));
});

// POST /api/v1/users/contacts
const addContactSchema = z.object({ contactId: z.string(), nickname: z.string().optional() });
router.post('/contacts', validate(addContactSchema), async (req: AuthRequest, res: Response) => {
  const { contactId, nickname } = req.body as { contactId: string; nickname?: string };
  const contact = await prisma.contact.upsert({
    where: { userId_contactId: { userId: req.userId!, contactId } },
    create: { userId: req.userId!, contactId, nickname },
    update: { nickname },
  });
  res.json(contact);
});

// POST /api/v1/users/block
const blockSchema = z.object({ userId: z.string() });
router.post('/block', validate(blockSchema), async (req: AuthRequest, res: Response) => {
  const { userId } = req.body as { userId: string };
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: req.userId!, blockedId: userId } },
    create: { blockerId: req.userId!, blockedId: userId },
    update: {},
  });
  res.json({ success: true });
});

// DELETE /api/v1/users/block/:userId
router.delete('/block/:userId', async (req: AuthRequest, res: Response) => {
  await prisma.block.deleteMany({
    where: { blockerId: req.userId, blockedId: req.params.userId },
  });
  res.json({ success: true });
});

// PATCH /api/v1/users/privacy
const privacySchema = z.object({
  lastSeen: z.enum(['EVERYONE', 'CONTACTS', 'NOBODY']).optional(),
  profilePhoto: z.enum(['EVERYONE', 'CONTACTS', 'NOBODY']).optional(),
  about: z.enum(['EVERYONE', 'CONTACTS', 'NOBODY']).optional(),
  readReceipts: z.boolean().optional(),
  onlineStatus: z.enum(['EVERYONE', 'CONTACTS', 'NOBODY']).optional(),
});
router.patch('/privacy', validate(privacySchema), async (req: AuthRequest, res: Response) => {
  const privacy = await prisma.userPrivacy.upsert({
    where: { userId: req.userId },
    create: { userId: req.userId!, ...req.body },
    update: req.body,
  });
  res.json(privacy);
});

// PATCH /api/v1/users/profile
const profileSchema = z.object({
  name: z.string().optional(),
  about: z.string().optional(),
  avatarUrl: z.string().optional(),
});
router.patch('/profile', validate(profileSchema), async (req: AuthRequest, res: Response) => {
  const updatedUser = await prisma.user.update({
    where: { id: req.userId },
    data: req.body,
    select: {
      id: true, name: true, phone: true, username: true,
      about: true, avatarUrl: true, isOnline: true, lastSeen: true,
      isVerifiedBusiness: true,
    },
  });
  res.json(updatedUser);
});

export default router;
