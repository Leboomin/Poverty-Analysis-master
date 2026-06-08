import { getDatabase } from './connection.ts';

export const DATABASE_SCHEMA_VERSION = 1;

export function applySchema() {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS poverty_trend (
      period TEXT PRIMARY KEY,
      percentage REAL NOT NULL,
      number REAL NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS support_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      year INTEGER NOT NULL,
      context TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS demographic_breakdowns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      year INTEGER NOT NULL,
      group_name TEXT NOT NULL,
      value REAL NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS regional_stats (
      region TEXT PRIMARY KEY,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      year INTEGER NOT NULL,
      note TEXT NOT NULL,
      rank INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS publications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      excerpt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS regression_series (
      period TEXT PRIMARY KEY,
      poverty_rate REAL NOT NULL,
      gdp REAL NOT NULL,
      unemployment REAL NOT NULL,
      inflation REAL NOT NULL,
      gini REAL NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prediction_series (
      period TEXT PRIMARY KEY,
      poverty_rate REAL NOT NULL,
      rolling_average REAL NOT NULL,
      trend_change REAL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dataset_catalog (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      format TEXT NOT NULL,
      records INTEGER NOT NULL,
      last_updated TEXT NOT NULL,
      source TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dataset_preview_columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id TEXT NOT NULL,
      column_key TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dataset_preview_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id TEXT NOT NULL,
      row_json TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS map_regions (
      region TEXT PRIMARY KEY,
      map_key TEXT NOT NULL,
      rdi REAL NOT NULL,
      change REAL,
      rank INTEGER NOT NULL,
      year INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS map_area_highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      highlight_type TEXT NOT NULL,
      area TEXT NOT NULL,
      area_type TEXT NOT NULL,
      rdi_2022 REAL NOT NULL,
      rdi_2011 REAL,
      change REAL
    );
  `);
}

export function ensureSchemaVersion() {
  const db = getDatabase();
  const existing = db
    .prepare('SELECT version FROM schema_migrations WHERE version = ?')
    .get(DATABASE_SCHEMA_VERSION) as { version: number } | undefined;

  if (!existing) {
    db.prepare(
      'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)',
    ).run(
      DATABASE_SCHEMA_VERSION,
      'initial_sqlite_schema',
      new Date().toISOString(),
    );
  }
}

export function getSchemaVersion() {
  const db = getDatabase();
  const row = db
    .prepare('SELECT MAX(version) AS version FROM schema_migrations')
    .get() as unknown as { version: number | null };

  return row.version ?? 0;
}

export function getMigrationHistory() {
  const db = getDatabase();
  return db
    .prepare('SELECT version, name, applied_at AS appliedAt FROM schema_migrations ORDER BY version')
    .all() as unknown as Array<{ version: number; name: string; appliedAt: string }>;
}
