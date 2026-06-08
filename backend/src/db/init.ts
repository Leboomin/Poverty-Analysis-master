import { applySchema, ensureSchemaVersion } from './schema.ts';
import { seedDatabase } from './seed.ts';

export function initializeDatabase(options?: { forceSeed?: boolean }) {
  applySchema();
  ensureSchemaVersion();
  seedDatabase(options?.forceSeed ?? false);
}
