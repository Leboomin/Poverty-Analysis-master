export type TrendDirection = 'up' | 'down' | 'stable';

export interface HeadlineMetric {
  label: string;
  value: number;
  unit: string;
  delta: number;
  trend: TrendDirection;
  year: number;
}

export interface RelativePovertyTrendPoint {
  period: string;
  percentage: number;
  number: number;
}

export interface DashboardSupportMetric {
  label: string;
  value: number;
  unit: string;
  year: number;
  context: string;
}

export interface DashboardDerivedInsight {
  label: string;
  value: string;
  context: string;
}

export interface DemographicGroup {
  group: string;
  value: number;
}

export interface DemographicBreakdown {
  category: string;
  year: number;
  groups: DemographicGroup[];
}

export interface DashboardRegionSnapshot {
  region: string;
  value: number;
  unit: string;
  year: number;
  note: string;
  rank: number;
}

export interface Publication {
  id: string;
  title: string;
  author: string;
  date: string;
  category: string;
  excerpt: string;
}

export interface DashboardResponse {
  headlineMetric: HeadlineMetric;
  supportingMetrics: DashboardSupportMetric[];
  derivedInsights: DashboardDerivedInsight[];
  relativePovertyTrend: RelativePovertyTrendPoint[];
  demographicHighlights: DemographicBreakdown[];
  regionalStats: DashboardRegionSnapshot[];
  publications: Publication[];
  keyFindings: string[];
}
