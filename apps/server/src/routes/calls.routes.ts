import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/v1/calls/history
router.get('/history', authenticate, async (req: any, res, next) => {
  try {
    const calls = await prisma.callParticipant.findMany({
      where: { userId: req.userId },
      include: {
        call: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
              },
            },
          },
        },
      },
      orderBy: { call: { startedAt: 'desc' } },
      take: 50,
    });

    const result = calls.map(cp => ({
      ...cp.call,
      isOutgoing: cp.call.participants[0]?.userId === req.userId,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
