import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.ts';
import { AppError, createApiError } from '../utils/error.utils.ts';
import { logError } from '../utils/logger.utils.ts';
import { SchemaValidationError } from '../utils/validation.utils.ts';

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof SchemaValidationError) {
    logError('Schema validation failed.', {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    });
    res.status(error.statusCode).json(createApiError(error.code, `${error.message} ${error.details.join(' | ')}`));
    return;
  }

  if (error instanceof AppError) {
    logError('Handled application error.', {
      code: error.code,
      statusCode: error.statusCode,
      message: error.message,
    });
    res.status(error.statusCode).json(createApiError(error.code, error.message));
    return;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  ) {
    res.status(413).json(createApiError('PAYLOAD_TOO_LARGE', 'The request body is too large.'));
    return;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.parse.failed'
  ) {
    res.status(400).json(createApiError('INVALID_JSON', 'The request body could not be parsed as JSON.'));
    return;
  }

  logError('Unhandled backend error.', error);

  const message = env.mode === 'production'
    ? 'An unexpected server error occurred.'
    : error instanceof Error
      ? error.message
      : 'An unexpected backend error occurred.';

  res.status(500).json(createApiError('INTERNAL_SERVER_ERROR', message));
}
