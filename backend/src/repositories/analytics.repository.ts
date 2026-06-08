import type {
  DistrictPovertyProfile,
  DashboardRegionSnapshot,
  DemographicBreakdown,
  LocalPovertyArea,
  PredictionPoint,
  RegressionObservation,
  RelativePovertyTrendPoint,
} from '../../../shared/api/index.ts';
import { getDatabase } from '../db/connection.ts';
import { getProcessedDataPath } from '../utils/data-paths.utils.ts';
import { readJsonFile } from '../utils/file.utils.ts';

export function readRegressionSeries(): RegressionObservation[] {
  const db = getDatabase();
  return db
    .prepare(
      'SELECT period, poverty_rate AS povertyRate, gdp, unemployment, inflation, gini FROM regression_series ORDER BY sort_order',
    )
    .all() as unknown as RegressionObservation[];
}

export function readPredictionSeries(): PredictionPoint[] {
  const db = getDatabase();
  return db
    .prepare(
      'SELECT period, poverty_rate AS povertyRate, rolling_average AS rollingAverage, trend_change AS trendChange FROM prediction_series ORDER BY sort_order',
    )
    .all() as unknown as PredictionPoint[];
}

export function readDemographicBreakdowns(): DemographicBreakdown[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      'SELECT category, year, group_name AS groupName, value, sort_order FROM demographic_breakdowns ORDER BY category, sort_order',
    )
    .all() as Array<{ category: string; year: number; groupName: string; value: number }>;

  const sections = new Map<string, DemographicBreakdown>();

  rows.forEach((row) => {
    if (!sections.has(row.category)) {
      sections.set(row.category, {
        category: row.category,
        year: row.year,
        groups: [],
      });
    }

    sections.get(row.category)?.groups.push({
      group: row.groupName,
      value: row.value,
    });
  });

  return [...sections.values()];
}

export function readHistoricalPovertyTrend(): RelativePovertyTrendPoint[] {
  const db = getDatabase();
  return db
    .prepare('SELECT period, percentage, number FROM poverty_trend ORDER BY sort_order')
    .all() as unknown as RelativePovertyTrendPoint[];
}

export function readRegionalAnalyticsSeries(): DashboardRegionSnapshot[] {
  const db = getDatabase();
  return db
    .prepare('SELECT region, value, unit, year, note, rank FROM regional_stats ORDER BY rank')
    .all() as unknown as DashboardRegionSnapshot[];
}

export function readLocalPovertyAreaSeries(): LocalPovertyArea[] {
  return readJsonFile<LocalPovertyArea[]>(getProcessedDataPath('local_poverty_gini_200607.json'));
}

export function readDistrictPovertyProfiles(): DistrictPovertyProfile[] {
  return readJsonFile<DistrictPovertyProfile[]>(getProcessedDataPath('district_poverty_200607.json'));
}
