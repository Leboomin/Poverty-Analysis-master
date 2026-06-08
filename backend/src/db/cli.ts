import fs from 'node:fs';
import { env } from '../config/env.ts';
import { initializeDatabase } from './init.ts';
import { getDatabase } from './connection.ts';
import { getMigrationHistory, getSchemaVersion } from './schema.ts';

function printUsage() {
  console.log('Usage: node --experimental-strip-types src/db/cli.ts <init|reset|status>');
}

function getCount(tableName: string) {
  const db = getDatabase();
  return (db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get() as unknown as { count: number }).count;
}

function initDatabaseCommand() {
  initializeDatabase();
  console.log(`Initialized SQLite database at ${env.paths.sqlite}`);
}

function resetDatabaseCommand() {
  if (fs.existsSync(env.paths.sqlite)) {
    try {
      fs.rmSync(env.paths.sqlite, { force: true });
    } catch {
      initializeDatabase({ forceSeed: true });
      console.log(`Reseeded SQLite database in place at ${env.paths.sqlite}`);
      return;
    }
  }

  initializeDatabase({ forceSeed: true });
  console.log(`Reset and reseeded SQLite database at ${env.paths.sqlite}`);
}

function statusDatabaseCommand() {
  initializeDatabase();

  const summary = {
    sqlitePath: env.paths.sqlite,
    exists: fs.existsSync(env.paths.sqlite),
    schemaVersion: getSchemaVersion(),
    migrations: getMigrationHistory(),
    tables: {
      povertyTrend: getCount('poverty_trend'),
      supportMetrics: getCount('support_metrics'),
      demographicBreakdowns: getCount('demographic_breakdowns'),
      regionalStats: getCount('regional_stats'),
      publications: getCount('publications'),
      regressionSeries: getCount('regression_series'),
      predictionSeries: getCount('prediction_series'),
      datasetCatalog: getCount('dataset_catalog'),
      mapRegions: getCount('map_regions'),
      mapAreaHighlights: getCount('map_area_highlights'),
    },
  };

  console.log(JSON.stringify(summary, null, 2));
}

const command = process.argv[2];

switch (command) {
  case 'init':
    initDatabaseCommand();
    break;
  case 'reset':
    resetDatabaseCommand();
    break;
  case 'status':
    statusDatabaseCommand();
    break;
  default:
    printUsage();
    process.exitCode = 1;
}
