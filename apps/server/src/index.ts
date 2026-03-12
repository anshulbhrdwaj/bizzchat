import http from 'http';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import { connectRedis } from './lib/redis';
import { setupSocketHandlers } from './socket/handlers';

let _io: SocketServer | null = null;
export function getIO(): SocketServer {
  if (!_io) throw new Error('Socket.io not initialized');
  return _io;
}

const PORT = parseInt(process.env.PORT || '3001', 10);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

async function main() {
  // Connect Redis (graceful — won't crash if unavailable)
  await connectRedis();

  const server = http.createServer(app);

  // Socket.io
  const io = new SocketServer(server, {
    cors: {
      origin: CLIENT_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  _io = io;
  setupSocketHandlers(io);

  server.listen(PORT, () => {
    console.log(`🚀 NexChat server running on http://localhost:${PORT}`);
    console.log(`   Socket.io ready`);
    console.log(`   Static OTP: ${process.env.STATIC_OTP === 'true' ? '✅ ' + process.env.STATIC_OTP_CODE : '❌'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
