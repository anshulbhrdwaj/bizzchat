import { Router } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import prisma from '../lib/prisma'
import logger from '../lib/logger'
import { requireAuth, requireBusinessOwner, AuthRequest } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import {
  createCollectionSchema, updateCollectionSchema, reorderCollectionsSchema,
  createProductSchema, updateProductSchema, reorderImagesSchema,
  createVariantGroupSchema, updateVariantValueSchema,
} from '@bizchat/shared'
import { processImage } from '../lib/imageProcessor'

const router: Router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

const uploadDir = process.env.UPLOAD_DIR || './uploads'

function ensureUploadDir(subdir: string) {
  const dir = path.join(uploadDir, subdir)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

// ─── Collections ─────────────────────────────────────────

// GET /manager — get all collections with products for the currently authenticated business
router.get('/manager', requireAuth, requireBusinessOwner, async (req: AuthRequest, res) => {
  try {
    const [collections, allProducts] = await Promise.all([
      prisma.catalogCollection.findMany({
        where: { businessId: req.businessId },
        orderBy: { sortOrder: 'asc' },
        include: {
          productCollections: {
            include: {
              product: {
                include: {
                  images: { orderBy: { sortOrder: 'asc' } },
                  variantGroups: { include: { values: true } },
                }
              }
            }
          }
        }
      }),
      // Fetch ALL active products for this business (for standalone display)
      prisma.product.findMany({
        where: { businessId: req.businessId, isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          variantGroups: { include: { values: true } },
          collections: { select: { collectionId: true } },
        },
      }),
    ])

    // Map productCollections back to products array
    const mapped = collections.map(c => ({
      ...c,
      products: c.productCollections.map(pc => pc.product)
    }))

    // Identify products not in any collection (standalone)
    const collectionLinkedIds = new Set(
      allProducts.flatMap((p: any) => p.collections.map((c: any) => p.id))
    )
    // Use a cleaner approach: products where collections is empty
    const standaloneProducts = allProducts
      .filter((p: any) => p.collections.length === 0)
      .map((p: any) => { const { collections: _, ...rest } = p; return rest })

    res.json({ collections: mapped, standaloneProducts })
  } catch (error) {
    logger.error('Get catalog manager error', { error })
    res.status(500).json({ error: 'Failed to fetch catalog' })
  }
})


// GET /business/:id/collections — public
router.get('/business/:id/collections', async (req, res) => {
  try {
    const collections = await prisma.catalogCollection.findMany({
      where: { businessId: req.params.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { productCollections: true } } },
    })
    res.json(collections.map(c => ({ ...c, productCount: c._count.productCollections })))
  } catch (error) {
    logger.error('Get collections error', { error })
    res.status(500).json({ error: 'Failed to fetch collections' })
  }
})

// GET /business/:id/products — all active products for a business (powers "All Items" virtual collection)
router.get('/business/:id/products', async (req, res) => {
  try {
    const { cursor, limit = '20', q } = req.query
    const take = Math.min(parseInt(limit as string, 10), 50)
    
    const whereClause: any = { businessId: req.params.id, isActive: true }
    if (q && typeof q === 'string') {
      whereClause.name = { contains: q, mode: 'insensitive' }
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor as string }, skip: 1 } : {}),
      orderBy: { sortOrder: 'asc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { variantGroups: true } }
      },
    })
    const hasMore = products.length > take
    if (hasMore) products.pop()

    const mappedProducts = products.map((p: any) => ({
      ...p,
      hasVariants: p._count.variantGroups > 0
    }))

    res.json({
      data: mappedProducts,
      cursor: products.length > 0 ? products[products.length - 1].id : null,
      hasMore,
    })
  } catch (error) {
    logger.error('Get all business products error', { error })
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// GET /collections/:id/products — paginated
router.get('/collections/:id/products', async (req, res) => {
  try {
    const { cursor, limit = '20', q } = req.query
    const take = Math.min(parseInt(limit as string, 10), 50)
    
    const whereClause: any = {
      collections: { some: { collectionId: req.params.id } },
      isActive: true,
    }
    if (q && typeof q === 'string') {
      whereClause.name = { contains: q, mode: 'insensitive' }
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor as string }, skip: 1 } : {}),
      orderBy: { sortOrder: 'asc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { variantGroups: true } }
      },
    })
    const hasMore = products.length > take
    if (hasMore) products.pop()

    const mappedProducts = products.map((p: any) => ({
      ...p,
      hasVariants: p._count.variantGroups > 0
    }))

    res.json({
      data: mappedProducts,
      cursor: products.length > 0 ? products[products.length - 1].id : null,
      hasMore,
    })
  } catch (error) {
    logger.error('Get collection products error', { error })
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// POST /collections/:id/products — link product(s) to collection
router.post('/collections/:id/products', requireAuth, requireBusinessOwner, async (req: AuthRequest, res) => {
  try {
    const { productId, productIds } = req.body
    
    // Verify collection ownership
    const collection = await prisma.catalogCollection.findFirst({
      where: { id: req.params.id, businessId: req.businessId }
    })
    if (!collection) {
      res.status(404).json({ error: 'Collection not found' })
      return
    }

    if (productIds && Array.isArray(productIds)) {
      // Bulk insert ignoring duplicates
      await prisma.productCollection.createMany({
        data: productIds.map(id => ({ collectionId: req.params.id, productId: id })),
        skipDuplicates: true,
      })
      res.status(201).json({ success: true, count: productIds.length })
    } else if (productId) {
      // Single insert
      const pc = await prisma.productCollection.create({
        data: { collectionId: req.params.id, productId }
      })
      res.status(201).json(pc)
    } else {
      res.status(400).json({ error: 'productId or productIds required' })
    }
  } catch (error) {
    logger.error('Link product to collection error', { error })
    res.status(500).json({ error: 'Failed to link product' })
  }
})

// POST /collections — create (business owner)
router.post('/collections', requireAuth, requireBusinessOwner, validateBody(createCollectionSchema), async (req: AuthRequest, res) => {
  try {
    const maxSort = await prisma.catalogCollection.aggregate({
      where: { businessId: req.businessId },
      _max: { sortOrder: true },
    })
    const collection = await prisma.catalogCollection.create({
      data: {
        ...req.body,
        businessId: req.businessId!,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    })
    res.status(201).json(collection)
  } catch (error) {
    logger.error('Create collection error', { error })
    res.status(500).json({ error: 'Failed to create collection' })
  }
})

// PUT /collections/:id — update
router.put('/collections/:id', requireAuth, requireBusinessOwner, validateBody(updateCollectionSchema), async (req: AuthRequest, res) => {
  try {
    const collection = await prisma.catalogCollection.findFirst({
      where: { id: req.params.id, businessId: req.businessId },
    })
    if (!collection) {
      res.status(404).json({ error: 'Collection not found' })
      return
    }
    const updated = await prisma.catalogCollection.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(updated)
  } catch (error) {
    logger.error('Update collection error', { error })
    res.status(500).json({ error: 'Failed to update collection' })
  }
})

// DELETE /collections/:id
router.delete('/collections/:id', requireAuth, requireBusinessOwner, async (req: AuthRequest, res) => {
  try {
    const collection = await prisma.catalogCollection.findFirst({
      where: { id: req.params.id, businessId: req.businessId },
    })
    if (!collection) {
      res.status(404).json({ error: 'Collection not found' })
      return
    }
    await prisma.catalogCollection.delete({ where: { id: req.params.id } })
    res.json({ message: 'Collection deleted' })
  } catch (error) {
    logger.error('Delete collection error', { error })
    res.status(500).json({ error: 'Failed to delete collection' })
  }
})

// PATCH /collections/reorder
router.patch('/collections/reorder', requireAuth, requireBusinessOwner, validateBody(reorderCollectionsSchema), async (req: AuthRequest, res) => {
  try {
    await prisma.$transaction(
      req.body.items.map((item: { id: string; sortOrder: number }) =>
        prisma.catalogCollection.updateMany({
          where: { id: item.id, businessId: req.businessId },
          data: { sortOrder: item.sortOrder },
        })
      )
    )
    res.json({ message: 'Reordered' })
  } catch (error) {
    logger.error('Reorder collections error', { error })
    res.status(500).json({ error: 'Failed to reorder' })
  }
})

// ─── Products ────────────────────────────────────────────

// GET /products/:id — public product details
router.get('/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id, isActive: true },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variantGroups: { include: { values: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }
    res.json(product)
  } catch (error) {
    logger.error('Get product error', { error })
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})

// POST /products — create
router.post('/products', requireAuth, requireBusinessOwner, validateBody(createProductSchema), async (req: AuthRequest, res) => {
  try {
    const product = await prisma.product.create({
      data: { ...req.body, businessId: req.businessId! },
    })
    res.status(201).json(product)
  } catch (error) {
    logger.error('Create product error', { error })
    res.status(500).json({ error: 'Failed to create product' })
  }
})

// PUT /products/:id — update
router.put('/products/:id', requireAuth, requireBusinessOwner, validateBody(updateProductSchema), async (req: AuthRequest, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, businessId: req.businessId },
    })
    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
      include: { images: true, variantGroups: { include: { values: true } } },
    })
    res.json(updated)
  } catch (error) {
    logger.error('Update product error', { error })
    res.status(500).json({ error: 'Failed to update product' })
  }
})

// DELETE /products/:id
router.delete('/products/:id', requireAuth, requireBusinessOwner, async (req: AuthRequest, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, businessId: req.businessId },
    })
    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }
    await prisma.product.delete({ where: { id: req.params.id } })
    res.json({ message: 'Product deleted' })
  } catch (error) {
    logger.error('Delete product error', { error })
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

// POST /products/:id/images — upload product image (multer → sharp WebP)
router.post('/products/:id/images', requireAuth, requireBusinessOwner, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, businessId: req.businessId },
    })
    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }
    const { fullBuffer, thumbBuffer } = await processImage(req.file.buffer, 'product')
    const dir = ensureUploadDir('products')
    const timestamp = Date.now()
    const fullFilename = `${req.params.id}-${timestamp}.webp`
    const thumbFilename = `${req.params.id}-${timestamp}-thumb.webp`
    fs.writeFileSync(path.join(dir, fullFilename), fullBuffer)
    fs.writeFileSync(path.join(dir, thumbFilename), thumbBuffer)

    const maxSort = await prisma.productImage.aggregate({
      where: { productId: req.params.id },
      _max: { sortOrder: true },
    })
    const image = await prisma.productImage.create({
      data: {
        productId: req.params.id,
        url: `/uploads/products/${fullFilename}`,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    })
    res.status(201).json(image)
  } catch (error) {
    logger.error('Upload product image error', { error })
    res.status(500).json({ error: 'Failed to upload image' })
  }
})

// PATCH /products/:id/images/reorder — update sortOrder
router.patch('/products/:id/images/reorder', requireAuth, requireBusinessOwner, validateBody(reorderImagesSchema), async (req: AuthRequest, res) => {
  try {
    await prisma.$transaction(
      req.body.items.map((item: { id: string; sortOrder: number }) =>
        prisma.productImage.updateMany({
          where: { id: item.id, productId: req.params.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    )
    res.json({ message: 'Images reordered' })
  } catch (error) {
    logger.error('Reorder images error', { error })
    res.status(500).json({ error: 'Failed to reorder images' })
  }
})

// ─── Variants ────────────────────────────────────────────

// POST /products/:id/variants — create group + values
router.post('/products/:id/variants', requireAuth, requireBusinessOwner, validateBody(createVariantGroupSchema), async (req: AuthRequest, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, businessId: req.businessId },
    })
    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }
    const group = await prisma.variantGroup.create({
      data: {
        productId: req.params.id,
        name: req.body.name,
        values: {
          create: req.body.values.map((v: any, i: number) => ({
            label: v.label,
            priceOverride: v.priceOverride,
            stock: v.stock ?? 0,
            sku: v.sku,
            sortOrder: i,
          })),
        },
      },
      include: { values: true },
    })
    res.status(201).json(group)
  } catch (error) {
    logger.error('Create variant group error', { error })
    res.status(500).json({ error: 'Failed to create variants' })
  }
})

// PUT /variants/:groupId — update group name
router.put('/variants/:groupId', requireAuth, requireBusinessOwner, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Name is required' })
      return
    }
    const updated = await prisma.variantGroup.update({
      where: { id: req.params.groupId },
      data: { name },
      include: { values: true },
    })
    res.json(updated)
  } catch (error) {
    logger.error('Update variant group error', { error })
    res.status(500).json({ error: 'Failed to update variant group' })
  }
})

// POST /variants/:groupId/values — add value to existing group
router.post('/variants/:groupId/values', requireAuth, requireBusinessOwner, validateBody(updateVariantValueSchema), async (req: AuthRequest, res) => {
  try {
    const group = await prisma.variantGroup.findUnique({ where: { id: req.params.groupId } })
    if (!group) {
      res.status(404).json({ error: 'Variant group not found' })
      return
    }
    const maxSort = await prisma.variantValue.aggregate({
      where: { groupId: req.params.groupId },
      _max: { sortOrder: true },
    })
    const value = await prisma.variantValue.create({
      data: {
        groupId: req.params.groupId,
        label: req.body.label!,
        priceOverride: req.body.priceOverride,
        stock: req.body.stock ?? 0,
        sku: req.body.sku,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    })
    res.status(201).json(value)
  } catch (error) {
    logger.error('Add variant value error', { error })
    res.status(500).json({ error: 'Failed to add variant value' })
  }
})

// PUT /variants/values/:valueId — update value
router.put('/variants/values/:valueId', requireAuth, requireBusinessOwner, validateBody(updateVariantValueSchema), async (req: AuthRequest, res) => {
  try {
    const updated = await prisma.variantValue.update({
      where: { id: req.params.valueId },
      data: req.body,
    })
    res.json(updated)
  } catch (error) {
    logger.error('Update variant value error', { error })
    res.status(500).json({ error: 'Failed to update variant' })
  }
})

// DELETE /variants/:groupId — remove group + cascade values
router.delete('/variants/:groupId', requireAuth, requireBusinessOwner, async (req: AuthRequest, res) => {
  try {
    await prisma.variantGroup.delete({ where: { id: req.params.groupId } })
    res.json({ message: 'Variant group deleted' })
  } catch (error) {
    logger.error('Delete variant group error', { error })
    res.status(500).json({ error: 'Failed to delete variant group' })
  }
})

export default router

