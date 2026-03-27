import http from 'http'
import { Server as SocketServer } from 'socket.io'
import dotenv from 'dotenv'

dotenv.config()

import { serverEnvSchema } from '@bizchat/shared'
import app from './app'
import { setupSocketHandlers } from './socket/handlers'
import logger from './lib/logger'

// Validate env vars at startup — crash if missing
const envResult = serverEnvSchema.safeParse(process.env)
if (!envResult.success) {
  console.error('❌ Invalid environment variables:', envResult.error.format())
  process.exit(1)
}

const env = envResult.data

let _io: SocketServer | null = null
export function getIO(): SocketServer {
  if (!_io) throw new Error('Socket.io not initialized')
  return _io
}

async function main() {
  const server = http.createServer(app)

  // Socket.io
  const io = new SocketServer(server, {
    cors: {
      origin: env.ALLOWED_ORIGINS.split(','),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 25000,
  })

  _io = io
  setupSocketHandlers(io)

  server.listen(env.PORT, () => {
    logger.info(`🚀 BizChat server running on http://localhost:${env.PORT}`)
    logger.info(`   Socket.io ready`)
    logger.info(`   Environment: ${env.NODE_ENV}`)
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down...')
    server.close(() => process.exit(0))
  })
}

main().catch(err => {
  logger.error('Fatal error:', err)
  process.exit(1)
})
