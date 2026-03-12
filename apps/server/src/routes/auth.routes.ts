import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { cache } from '../lib/redis';
import { validate } from '../middleware/validate.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

const sendOtpSchema = z.object({
  phone: z.string().min(7).max(20),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(7).max(20),
  code: z.string().length(6),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100),
  username: z.string().min(3).max(30).optional(),
  about: z.string().max(500).optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

// POST /api/v1/auth/send-otp
router.post('/send-otp', validate(sendOtpSchema), async (req, res: Response) => {
  const { phone } = req.body as { phone: string };

  const isStatic = process.env.STATIC_OTP === 'true';
  const code = isStatic
    ? (process.env.STATIC_OTP_CODE || '123456')
    : Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP (expire in 10 min)
  await cache.set(`otp:${phone}`, code, 600);

  // Also save to DB for audit
  await prisma.otpCode.create({
    data: {
      phone,
      code: isStatic ? code : await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  if (!isStatic) {
    // TODO: send SMS via Twilio
    console.log(`OTP for ${phone}: ${code}`);
  } else {
    console.log(`[DEV] Static OTP for ${phone}: ${code}`);
  }

  res.json({ success: true, message: 'OTP sent', ...(isStatic && { code }) });
});

// POST /api/v1/auth/verify-otp
router.post('/verify-otp', validate(verifyOtpSchema), async (req, res: Response) => {
  const { phone, code } = req.body as { phone: string; code: string };

  const storedCode = await cache.get(`otp:${phone}`);
  if (!storedCode || storedCode !== code) {
    res.status(400).json({ error: 'Invalid or expired OTP' });
    return;
  }

  // Clear OTP
  await cache.del(`otp:${phone}`);

  // Find or create user
  let user = await prisma.user.findUnique({ where: { phone } });
  const isNewUser = !user;

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        name: phone, // placeholder until profile setup
        privacy: { create: {} },
      },
    });
  }

  const payload = { userId: user.id, phone: user.phone };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Store refresh token
  await cache.set(`refresh:${user.id}`, refreshToken, 7 * 24 * 3600);

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      username: user.username,
      avatarUrl: user.avatarUrl,
      isNewUser,
    },
  });
});

// POST /api/v1/auth/refresh
router.post('/refresh', validate(refreshSchema), async (req, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };
  try {
    const payload = verifyRefreshToken(refreshToken);
    const stored = await cache.get(`refresh:${payload.userId}`);
    if (!stored || stored !== refreshToken) {
      res.status(401).json({ error: 'Refresh token invalid' });
      return;
    }
    const accessToken = signAccessToken({ userId: payload.userId, phone: payload.phone });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  await cache.del(`refresh:${req.userId}`);
  // Mark offline
  await prisma.user.update({
    where: { id: req.userId },
    data: { isOnline: false, lastSeen: new Date() },
  }).catch(() => {});
  res.json({ success: true });
});

// PATCH /api/v1/auth/profile
router.patch('/profile', authenticate, validate(updateProfileSchema), async (req: AuthRequest, res: Response) => {
  const { name, username, about } = req.body as { name: string; username?: string; about?: string };

  if (username) {
    const existing = await prisma.user.findFirst({
      where: { username, NOT: { id: req.userId } },
    });
    if (existing) {
      res.status(409).json({ error: 'Username taken' });
      return;
    }
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { name, username, about },
    select: { id: true, phone: true, name: true, username: true, about: true, avatarUrl: true },
  });
  res.json(user);
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true, phone: true, name: true, username: true, about: true,
      avatarUrl: true, isOnline: true, lastSeen: true, isVerifiedBusiness: true,
    },
  });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json(user);
});

export default router;
