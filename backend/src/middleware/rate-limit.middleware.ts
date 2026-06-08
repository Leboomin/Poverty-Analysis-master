import type { NextFunction, Request, Response } from 'express';
import { createApiError } from '../utils/error.utils.ts';

type Entry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Entry>();

function getClientKey(req: Request) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? req.ip;
  }

  return req.ip;
}

export function createRateLimitMiddleware(options: {
  windowMs: number;
  maxRequests: number;
  code: string;
  message: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `${req.path}:${getClientKey(req)}`;
    const existing = store.get(key);

    if (!existing || existing.resetAt <= now) {
      store.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      next();
      return;
    }

    if (existing.count >= options.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json(createApiError(options.code, options.message));
      return;
    }

    existing.count += 1;
    next();
  };
}
