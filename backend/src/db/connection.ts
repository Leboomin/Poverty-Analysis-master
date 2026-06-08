import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { env } from '../config/env.ts';

let database: DatabaseSync | null = null;

export function getDatabase() {
  if (!database) {
    fs.mkdirSync(env.paths.database, { recursive: true });
    database = new DatabaseSync(env.paths.sqlite);
    database.exec('PRAGMA foreign_keys = ON;');
    database.exec('PRAGMA journal_mode = WAL;');
  }

  return database;
}
