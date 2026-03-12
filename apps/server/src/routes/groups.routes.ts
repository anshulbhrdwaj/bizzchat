import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();
router.use(authenticate);

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  memberIds: z.array(z.string()).min(1),
});

// POST /api/v1/groups
router.post('/', validate(createGroupSchema), async (req: AuthRequest, res: Response) => {
  const { name, description, memberIds } = req.body as z.infer<typeof createGroupSchema>;
  const allMembers = [...new Set([req.userId!, ...memberIds])];

  const chat = await prisma.chat.create({
    data: {
      type: 'GROUP',
      participants: { create: allMembers.map(id => ({ userId: id })) },
      group: {
        create: {
          name,
          description,
          createdById: req.userId!,
          inviteLink: uuidv4(),
          members: {
            create: allMembers.map(id => ({
              userId: id,
              role: id === req.userId ? 'OWNER' : 'MEMBER',
            })),
          },
        },
      },
    },
    include: {
      group: { include: { members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } } },
      participants: true,
    },
  });

  res.status(201).json(chat);
});

// GET /api/v1/groups/:chatId
router.get('/:chatId', async (req: AuthRequest, res: Response) => {
  const group = await prisma.group.findFirst({
    where: {
      chatId: req.params.chatId,
      members: { some: { userId: req.userId } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, avatarUrl: true, isOnline: true } } },
        orderBy: { role: 'asc' },
      },
    },
  });
  if (!group) { res.status(404).json({ error: 'Group not found' }); return; }
  res.json(group);
});

// PATCH /api/v1/groups/:chatId
const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});
router.patch('/:chatId', validate(updateGroupSchema), async (req: AuthRequest, res: Response) => {
  // Check admin/owner
  const member = await prisma.groupMember.findFirst({
    where: { group: { chatId: req.params.chatId }, userId: req.userId, role: { in: ['OWNER', 'ADMIN'] } },
  });
  if (!member) { res.status(403).json({ error: 'Admin required' }); return; }

  const group = await prisma.group.update({
    where: { chatId: req.params.chatId },
    data: req.body,
  });
  res.json(group);
});

// POST /api/v1/groups/:chatId/avatar
router.post('/:chatId/avatar', upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file' }); return; }
  const avatarUrl = `/uploads/${req.file.filename}`;
  await prisma.group.update({ where: { chatId: req.params.chatId }, data: { avatarUrl } });
  res.json({ avatarUrl });
});

// POST /api/v1/groups/:chatId/members
const addMemberSchema = z.object({ userId: z.string() });
router.post('/:chatId/members', validate(addMemberSchema), async (req: AuthRequest, res: Response) => {
  const { userId } = req.body as { userId: string };
  const group = await prisma.group.findUnique({ where: { chatId: req.params.chatId } });
  if (!group) { res.status(404).json({ error: 'Group not found' }); return; }

  await prisma.$transaction([
    prisma.chatParticipant.upsert({
      where: { chatId_userId: { chatId: req.params.chatId, userId } },
      create: { chatId: req.params.chatId, userId },
      update: {},
    }),
    prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: group.id, userId } },
      create: { groupId: group.id, userId, addedById: req.userId },
      update: {},
    }),
  ]);
  res.json({ success: true });
});

// DELETE /api/v1/groups/:chatId/members/:userId
router.delete('/:chatId/members/:userId', async (req: AuthRequest, res: Response) => {
  const group = await prisma.group.findUnique({ where: { chatId: req.params.chatId } });
  if (!group) { res.status(404).json({ error: 'Not found' }); return; }

  const isSelf = req.params.userId === req.userId;
  if (!isSelf) {
    const admin = await prisma.groupMember.findFirst({
      where: { groupId: group.id, userId: req.userId, role: { in: ['OWNER', 'ADMIN'] } },
    });
    if (!admin) { res.status(403).json({ error: 'Admin required' }); return; }
  }

  await prisma.$transaction([
    prisma.groupMember.deleteMany({ where: { groupId: group.id, userId: req.params.userId } }),
    prisma.chatParticipant.deleteMany({ where: { chatId: req.params.chatId, userId: req.params.userId } }),
  ]);
  res.json({ success: true });
});

// PATCH /api/v1/groups/:chatId/members/:userId/role
const roleSchema = z.object({ role: z.enum(['ADMIN', 'MEMBER']) });
router.patch('/:chatId/members/:userId/role', validate(roleSchema), async (req: AuthRequest, res: Response) => {
  const group = await prisma.group.findUnique({ where: { chatId: req.params.chatId } });
  if (!group) { res.status(404).json({ error: 'Not found' }); return; }

  const me = await prisma.groupMember.findFirst({
    where: { groupId: group.id, userId: req.userId, role: { in: ['OWNER', 'ADMIN'] } },
  });
  if (!me) { res.status(403).json({ error: 'Admin required' }); return; }

  await prisma.groupMember.updateMany({
    where: { groupId: group.id, userId: req.params.userId },
    data: { role: req.body.role },
  });
  res.json({ success: true });
});

// GET /api/v1/groups/:chatId/invite-link
router.get('/:chatId/invite-link', async (req: AuthRequest, res: Response) => {
  const group = await prisma.group.findUnique({ where: { chatId: req.params.chatId }, select: { inviteLink: true } });
  if (!group) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ link: `${process.env.CLIENT_ORIGIN}/join/${group.inviteLink}` });
});

// POST /api/v1/groups/join/:inviteLink
router.post('/join/:inviteLink', async (req: AuthRequest, res: Response) => {
  const group = await prisma.group.findUnique({ where: { inviteLink: req.params.inviteLink } });
  if (!group) { res.status(404).json({ error: 'Invalid invite link' }); return; }

  await prisma.$transaction([
    prisma.chatParticipant.upsert({
      where: { chatId_userId: { chatId: group.chatId, userId: req.userId! } },
      create: { chatId: group.chatId, userId: req.userId! },
      update: {},
    }),
    prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: group.id, userId: req.userId! } },
      create: { groupId: group.id, userId: req.userId! },
      update: {},
    }),
  ]);
  res.json({ chatId: group.chatId });
});

export default router;
