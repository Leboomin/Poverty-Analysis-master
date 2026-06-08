import { ZodError, type ZodType } from 'zod';

export class SchemaValidationError extends Error {
  statusCode: number;
  code: string;
  details: string[];

  constructor(statusCode: number, code: string, message: string, details: string[]) {
    super(message);
    this.name = 'SchemaValidationError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function formatIssues(error: ZodError) {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
    return `${path}: ${issue.message}`;
  });
}

export function validateRequest<T>(schema: ZodType<T>, payload: unknown, code = 'INVALID_REQUEST') {
  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new SchemaValidationError(400, code, 'Request validation failed.', formatIssues(error));
    }

    throw error;
  }
}

export function validateResponse<T>(schema: ZodType<T>, payload: unknown, code = 'INVALID_RESPONSE') {
  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new SchemaValidationError(500, code, 'Response validation failed.', formatIssues(error));
    }

    throw error;
  }
}
