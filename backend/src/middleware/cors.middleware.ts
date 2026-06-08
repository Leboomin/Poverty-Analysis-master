import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.ts';

function isAllowedOrigin(origin: string) {
  return env.corsOrigins.includes(origin);
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  if (!origin) {
    next();
    return;
  }

  if (isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(isAllowedOrigin(origin) ? 204 : 403);
    return;
  }

  next();
}
