import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import authRouter from './routes/auth.routes';
import usersRouter from './routes/users.routes';
import chatsRouter from './routes/chats.routes';
import messagesRouter from './routes/messages.routes';
import groupsRouter from './routes/groups.routes';
import businessRouter from './routes/business.routes';
import mediaRouter from './routes/media.routes';
import callsRouter from './routes/calls.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Body parsing
app.use(compression() as any);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static file serving for local uploads
app.use('/uploads', express.static(path.resolve(process.cwd(), process.env.UPLOADS_DIR || 'uploads')));

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/chats', chatsRouter);
app.use('/api/v1/messages', messagesRouter);
app.use('/api/v1/groups', groupsRouter);
app.use('/api/v1/business', businessRouter);
app.use('/api/v1/media', mediaRouter);
app.use('/api/v1/calls', callsRouter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use(errorHandler);

export default app;
