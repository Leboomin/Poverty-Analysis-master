import type {
  DashboardRegionSnapshot,
  DashboardSupportMetric,
  DemographicBreakdown,
  Publication,
  RelativePovertyTrendPoint,
} from '../../../shared/api/index.ts';
import { getDatabase } from '../db/connection.ts';

export function readPovertyTrend(): RelativePovertyTrendPoint[] {
  const db = getDatabase();
  return db
    .prepare('SELECT period, percentage, number FROM poverty_trend ORDER BY sort_order')
    .all() as unknown as RelativePovertyTrendPoint[];
}

export function readSupportingMetrics(): DashboardSupportMetric[] {
  const db = getDatabase();
  return db
    .prepare('SELECT label, value, unit, year, context FROM support_metrics ORDER BY sort_order')
    .all() as unknown as DashboardSupportMetric[];
}

export function readDemographicHighlights(): DemographicBreakdown[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      'SELECT category, year, group_name AS groupName, value, sort_order FROM demographic_breakdowns ORDER BY category, sort_order',
    )
    .all() as Array<{ category: string; year: number; groupName: string; value: number }>;

  const grouped = new Map<string, DemographicBreakdown>();

  rows.forEach((row) => {
    if (!grouped.has(row.category)) {
      grouped.set(row.category, {
        category: row.category,
        year: row.year,
        groups: [],
      });
    }

    grouped.get(row.category)?.groups.push({
      group: row.groupName,
      value: row.value,
    });
  });

  return [...grouped.values()];
}

export function readRegionalStats(): DashboardRegionSnapshot[] {
  const db = getDatabase();
  return db
    .prepare('SELECT region, value, unit, year, note, rank FROM regional_stats ORDER BY rank LIMIT 6')
    .all() as unknown as DashboardRegionSnapshot[];
}

export function readPublications() {
  const db = getDatabase();
  return db
    .prepare('SELECT id, title, author, date, category, excerpt FROM publications ORDER BY date DESC')
    .all() as unknown as Publication[];
}

export function readKeyFindings() {
  const trend = readPovertyTrend();
  const ageBreakdown = readDemographicHighlights().find((section) => section.category.toLowerCase() === 'age');
  const activityBreakdown = readDemographicHighlights().find((section) => section.category.toLowerCase() === 'activity');
  const latest = trend.at(-1);
  const previous = trend.at(-2);
  const highestAgeGroup = ageBreakdown?.groups.reduce((best, current) => (current.value > best.value ? current : best));
  const highestActivityGroup = activityBreakdown?.groups.reduce((best, current) => (current.value > best.value ? current : best));

  return [
    latest && previous
      ? `Relative poverty fell by ${Math.abs(Number((latest.percentage - previous.percentage).toFixed(1)))} percentage points between ${previous.period} and ${latest.period}.`
      : 'Relative poverty remains the core indicator tracked across survey years.',
    highestAgeGroup ? `${highestAgeGroup.group} recorded the highest poverty rate among age groups in 2023 at ${highestAgeGroup.value}%.` : 'Age-group comparisons highlight unequal exposure to poverty.',
    highestActivityGroup ? `${highestActivityGroup.group} people recorded the highest poverty rate by activity status in 2023 at ${highestActivityGroup.value}%.` : 'Activity status remains a useful segmentation for poverty analysis.',
  ];
}
