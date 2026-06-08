import type { DashboardDerivedInsight, DashboardResponse } from '../../../shared/api/index.ts';
import {
  readDemographicHighlights,
  readKeyFindings,
  readPovertyTrend,
  readPublications,
  readRegionalStats,
  readSupportingMetrics,
} from '../repositories/dashboard.repository.ts';

export function getDashboardData(): DashboardResponse {
  const relativePovertyTrend = readPovertyTrend();
  const regionalStats = readRegionalStats();
  const supportingMetrics = readSupportingMetrics();
  const demographicHighlights = readDemographicHighlights();
  const publications = readPublications();
  const keyFindings = readKeyFindings();

  const latestPoint = relativePovertyTrend[relativePovertyTrend.length - 1];
  const previousPoint = relativePovertyTrend[relativePovertyTrend.length - 2];
  const firstPoint = relativePovertyTrend[0];
  const bestRegion = regionalStats[0];
  const lowestRegion = [...regionalStats].sort((left, right) => left.value - right.value)[0];
  const derivedInsights: DashboardDerivedInsight[] = [
    {
      label: 'Overall Poverty Change',
      value: `${(latestPoint.percentage - firstPoint.percentage).toFixed(1)} pts`,
      context: `From ${firstPoint.period} (${firstPoint.percentage}%) to ${latestPoint.period} (${latestPoint.percentage}%)`,
    },
    {
      label: 'Regional Development Gap',
      value: `${(bestRegion.value - lowestRegion.value).toFixed(1)} RDI`,
      context: `${lowestRegion.region} to ${bestRegion.region} in the 2022 district ranking`,
    },
  ];

  return {
    headlineMetric: {
      label: 'Relative poverty rate',
      value: latestPoint.percentage,
      unit: '%',
      delta: Number((latestPoint.percentage - previousPoint.percentage).toFixed(1)),
      trend: latestPoint.percentage < previousPoint.percentage ? 'down' : latestPoint.percentage > previousPoint.percentage ? 'up' : 'stable',
      year: 2023,
    },
    supportingMetrics,
    derivedInsights,
    relativePovertyTrend,
    demographicHighlights,
    regionalStats,
    publications,
    keyFindings,
  };
}
