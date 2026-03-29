import express, { Express } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import logger from './lib/logger'

// Routes
import authRoutes from './routes/auth.routes'
import businessRoutes from './routes/business.routes'
import catalogRoutes from './routes/catalog.routes'
import cartRoutes from './routes/cart.routes'
import sharedCartRoutes from './routes/sharedCart.routes'
import orderRoutes from './routes/order.routes'
import businessOrderRoutes from './routes/businessOrder.routes'
import chatRoutes from './routes/chat.routes'
import userRoutes from './routes/user.routes'
import contactRoutes from './routes/contact.routes'

const app: Express = express()

// ─── Middleware Stack (exact order per CLAUDE.md) ────────
app.use(helmet())
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

// Request logger
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  })
  next()
})

// Global rate limit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', apiLimiter)

// Static uploads
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'))

// ─── Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/business', businessRoutes)
app.use('/api/catalog', catalogRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/shared-carts', sharedCartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/business/orders', businessOrderRoutes)
app.use('/api/chats', chatRoutes)
app.use('/api/users', userRoutes)
app.use('/api/contacts', contactRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({ error: 'Internal server error' })
})

export default app
