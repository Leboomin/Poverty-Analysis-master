import type { NextFunction, Request, Response } from 'express';
import { logInfo } from '../utils/logger.utils.ts';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;

    logInfo(`${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
}
