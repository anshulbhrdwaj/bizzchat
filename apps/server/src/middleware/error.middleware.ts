import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error('Error:', err.message);
  if (res.headersSent) { next(err); return; }
  res.status(500).json({ error: err.message || 'Internal server error' });
}
