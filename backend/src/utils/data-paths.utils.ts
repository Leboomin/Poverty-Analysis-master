import path from 'node:path';
import { env } from '../config/env.ts';

export function getProcessedDataPath(...segments: string[]) {
  return path.join(env.paths.processed, ...segments);
}

export function getDatabasePath(...segments: string[]) {
  return path.join(env.paths.database, ...segments);
}

export function getRawSpreadsheetPath(...segments: string[]) {
  return path.join(env.paths.spreadsheets, ...segments);
}

export function getRawGeospatialPath(...segments: string[]) {
  return path.join(env.paths.geospatial, ...segments);
}

export function getRawPovertyReportPath(...segments: string[]) {
  return path.join(env.paths.povertyReports, ...segments);
}

export function getRawWorldBankPath(...segments: string[]) {
  return path.join(env.paths.worldBank, ...segments);
}
