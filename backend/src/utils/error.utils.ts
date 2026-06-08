import type { ApiError } from '../../../shared/api/index.ts';

export class AppError extends Error {
  statusCode: number;
  code: string;
  expose: boolean;

  constructor(statusCode: number, code: string, message: string, options?: { expose?: boolean }) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.expose = options?.expose ?? true;
  }
}

export function createApiError(code: string, message: string): ApiError {
  return {
    error: {
      code,
      message,
    },
  };
}
