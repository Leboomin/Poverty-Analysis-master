import type { Request, Response, NextFunction } from 'express';
import { createApiError } from '../utils/error.utils.ts';
import { logWarn } from '../utils/logger.utils.ts';

export function notFoundMiddleware(req: Request, res: Response, _next: NextFunction) {
  logWarn('Route not found.', {
    method: req.method,
    url: req.originalUrl,
  });
  res.status(404).json(
    createApiError('ROUTE_NOT_FOUND', `No route matched ${req.method} ${req.originalUrl}.`),
  );
}
