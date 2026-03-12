import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();
router.use(authenticate);

const profileSchema = z.object({
  businessName: z.string().min(1).max(100),
  category: z.string().min(1),
  description: z.string().max(500).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  greetingMsg: z.string().optional(),
  awayMsg: z.string().optional(),
  workingHours: z.record(z.any()).optional(),
});

// GET /api/v1/business/profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  const profile = await prisma.businessProfile.findUnique({
    where: { userId: req.userId },
    include: { products: true, quickReplies: true, labels: true, templates: true },
  });
  if (!profile) { res.json(null); return; }
  res.json(profile);
});

// GET /api/v1/business/user/:userId/public
router.get('/user/:userId/public', async (req: AuthRequest, res: Response) => {
  const profile = await prisma.businessProfile.findUnique({
    where: { userId: req.params.userId },
    include: { 
      products: { where: { isAvailable: true }, orderBy: { createdAt: 'desc' } }
    },
  });
  if (!profile) { res.status(404).json({ error: 'Business profile not found' }); return; }
  res.json(profile);
});

// POST /api/v1/business/profile
router.post('/profile', validate(profileSchema), async (req: AuthRequest, res: Response) => {
  const profile = await prisma.businessProfile.upsert({
    where: { userId: req.userId },
    create: { userId: req.userId!, ...req.body },
    update: req.body,
  });
  await prisma.user.update({ where: { id: req.userId }, data: { isVerifiedBusiness: true } });
  res.json(profile);
});

// PATCH /api/v1/business/profile
router.patch('/profile', validate(profileSchema.partial()), async (req: AuthRequest, res: Response) => {
  const profile = await prisma.businessProfile.update({
    where: { userId: req.userId },
    data: req.body,
  });
  res.json(profile);
});

// ─── PRODUCTS ─────────────────────────────────────────
const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().optional(),
  currency: z.string().default('INR'),
  link: z.string().url().optional(),
  isAvailable: z.boolean().default(true),
  collectionId: z.string().optional(),
});

router.get('/products', async (req: AuthRequest, res: Response) => {
  const bp = await prisma.businessProfile.findUnique({ where: { userId: req.userId } });
  if (!bp) { res.json([]); return; }
  const products = await prisma.product.findMany({ where: { businessId: bp.id }, orderBy: { createdAt: 'desc' } });
  res.json(products);
});

router.post('/products', validate(productSchema), async (req: AuthRequest, res: Response) => {
  const bp = await prisma.businessProfile.findUnique({ where: { userId: req.userId } });
  if (!bp) { res.status(400).json({ error: 'No business profile' }); return; }
  const product = await prisma.product.create({ data: { businessId: bp.id, ...req.body } });
  res.status(201).json(product);
});

router.patch('/products/:id', validate(productSchema.partial()), async (req: AuthRequest, res: Response) => {
  const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
  res.json(product);
});

router.post('/products/:id/image', upload.single('image'), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file' }); return; }
  const imageUrl = `/uploads/${req.file.filename}`;
  await prisma.product.update({ where: { id: req.params.id }, data: { imageUrl } });
  res.json({ imageUrl });
});

router.delete('/products/:id', async (req: AuthRequest, res: Response) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// ─── QUICK REPLIES ─────────────────────────────────────
const qrSchema = z.object({ shortcut: z.string().min(1), message: z.string().min(1) });

router.get('/quick-replies', async (req: AuthRequest, res: Response) => {
  const bp = await prisma.businessProfile.findUnique({ where: { userId: req.userId } });
  if (!bp) { res.json([]); return; }
  res.json(await prisma.quickReply.findMany({ where: { businessId: bp.id } }));
});

router.post('/quick-replies', validate(qrSchema), async (req: AuthRequest, res: Response) => {
  const bp = await prisma.businessProfile.findUnique({ where: { userId: req.userId } });
  if (!bp) { res.status(400).json({ error: 'No business profile' }); return; }
  const qr = await prisma.quickReply.upsert({
    where: { businessId_shortcut: { businessId: bp.id, shortcut: req.body.shortcut } },
    create: { businessId: bp.id, ...req.body },
    update: { message: req.body.message },
  });
  res.json(qr);
});

router.delete('/quick-replies/:id', async (_req, res: Response) => {
  await prisma.quickReply.delete({ where: { id: _req.params.id } });
  res.json({ success: true });
});

// ─── LABELS ─────────────────────────────────────────────
const labelSchema = z.object({ name: z.string().min(1), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) });

router.get('/labels', async (req: AuthRequest, res: Response) => {
  const bp = await prisma.businessProfile.findUnique({ where: { userId: req.userId } });
  if (!bp) { res.json([]); return; }
  res.json(await prisma.label.findMany({ where: { businessId: bp.id } }));
});

router.post('/labels', validate(labelSchema), async (req: AuthRequest, res: Response) => {
  const bp = await prisma.businessProfile.findUnique({ where: { userId: req.userId } });
  if (!bp) { res.status(400).json({ error: 'No business profile' }); return; }
  res.status(201).json(await prisma.label.create({ data: { businessId: bp.id, ...req.body } }));
});

router.delete('/labels/:id', async (_req, res: Response) => {
  await prisma.label.delete({ where: { id: _req.params.id } });
  res.json({ success: true });
});

// ─── STATS ─────────────────────────────────────────────
router.get('/stats', async (req: AuthRequest, res: Response) => {
  const bp = await prisma.businessProfile.findUnique({ where: { userId: req.userId } });
  if (!bp) { res.json([]); return; }
  const stats = await prisma.businessStats.findMany({
    where: { businessId: bp.id },
    orderBy: { date: 'desc' },
    take: 30,
  });
  res.json(stats);
});

export default router;
