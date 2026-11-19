import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isReplay = res.getHeader('X-Idempotent-Replay') ? ' [IDEMPOTENT REPLAY]' : '';
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms${isReplay}`);
  });
  next();
}
