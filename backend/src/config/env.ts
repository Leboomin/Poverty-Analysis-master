import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

function toPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const srcDirectory = path.resolve(currentDirectory, '..');
const backendRoot = path.resolve(srcDirectory, '..');
const dataDirectory = path.join(backendRoot, 'data');
const databaseDirectory = process.env.DATABASE_DIR
  ? path.resolve(process.env.DATABASE_DIR)
  : path.join(dataDirectory, 'database');
const sqlitePath = process.env.SQLITE_PATH
  ? path.resolve(process.env.SQLITE_PATH)
  : path.join(databaseDirectory, 'poverty-insights.sqlite');
const defaultCorsOrigins = ['http://localhost:3000', 'http://localhost:5173'];
const corsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  mode: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? process.env.API_PORT ?? 3001),
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  requestBodyLimit: process.env.REQUEST_BODY_LIMIT ?? '100kb',
  corsOrigins: corsOrigins.length > 0 ? corsOrigins : defaultCorsOrigins,
  chatRateLimitWindowMs: toPositiveInteger(process.env.CHAT_RATE_LIMIT_WINDOW_MS, 60_000),
  chatRateLimitMaxRequests: toPositiveInteger(process.env.CHAT_RATE_LIMIT_MAX_REQUESTS, 20),
  paths: {
    backendRoot,
    data: dataDirectory,
    database: databaseDirectory,
    sqlite: sqlitePath,
    raw: path.join(dataDirectory, 'raw'),
    processed: path.join(dataDirectory, 'processed'),
    spreadsheets: path.join(dataDirectory, 'raw', 'spreadsheets'),
    geospatial: path.join(dataDirectory, 'raw', 'geospatial'),
    povertyReports: path.join(dataDirectory, 'raw', 'poverty_reports'),
    worldBank: path.join(dataDirectory, 'raw', 'world_bank'),
  },
} as const;
