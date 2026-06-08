import type { DemographicBreakdown } from './dashboard.ts';

export interface CorrelationInsight {
  variable: string;
  correlation: number;
  direction: 'positive' | 'negative';
  strength: 'weak' | 'moderate' | 'strong';
}

export type PovertyClusterCategory = 'Low' | 'Medium' | 'High';

export interface RegressionCoefficient {
  variable: string;
  coefficient: number;
}

export interface RegressionObservation {
  period: string;
  povertyRate: number;
  gdp: number;
  unemployment: number;
  inflation: number;
  gini: number;
}

export interface PredictionPoint {
  period: string;
  povertyRate: number;
  rollingAverage: number;
  trendChange: number | null;
}

export interface AnalyticsChartAsset {
  title: string;
  imagePath: string;
  caption: string;
}

export interface RegressionOverview {
  specification: string;
  interpretation: string;
  strongestDriver: string;
}

export interface CorrelationMatrixCell {
  row: string;
  column: string;
  value: number;
}

export interface ScatterPoint {
  x: number;
  y: number;
  period: string;
}

export interface TrendLinePoint {
  x: number;
  y: number;
}

export interface ScatterSeries {
  variable: string;
  label: string;
  unit: string;
  points: ScatterPoint[];
  interpolatedPoints: ScatterPoint[];
  trendLine: TrendLinePoint[];
}

export interface ActualPredictedPoint {
  period: string;
  actual: number;
  predicted: number;
}

export interface PovertyClusterRecord {
  region: string;
  value: number;
  unit: string;
  year: number;
  rank: number;
  category: PovertyClusterCategory;
  interpretation: string;
}

export interface PovertyClusterSummary {
  category: PovertyClusterCategory;
  count: number;
  interpretation: string;
}

export interface PovertyGrouping {
  title: string;
  basis: string;
  explanation: string;
  records: PovertyClusterRecord[];
  summary: PovertyClusterSummary[];
}

export interface PovertyPredictionChartPoint {
  year: number;
  label: string;
  historical: number | null;
  predicted: number | null;
}

export interface PovertyPredictionValue {
  year: number;
  povertyRate: number;
}

export interface TrendExtremePoint {
  period: string;
  value: number;
}

export interface ConsecutiveTrendChange {
  fromPeriod: string;
  toPeriod: string;
  fromValue: number;
  toValue: number;
  change: number;
  percentChange: number;
}

export interface TrendInsights {
  overallDirection: 'increasing' | 'decreasing' | 'stable';
  overallChange: number;
  overallPercentChange: number;
  averageRate: number;
  minPoint: TrendExtremePoint;
  maxPoint: TrendExtremePoint;
  consecutiveChanges: ConsecutiveTrendChange[];
  summary: string;
}

export interface RegionalInsightDistrict {
  region: string;
  value: number;
  year: number;
  rank: number;
}

export interface RegionalInsights {
  explanation: string;
  topDistricts: RegionalInsightDistrict[];
  bottomDistricts: RegionalInsightDistrict[];
  gapValue: number;
  gapPercent: number;
  summary: string;
}

export interface LocalPovertyArea {
  area: string;
  district: string;
  rank: number;
  povertyRate: number;
  gini: number;
}

export interface DistrictPovertyProfile {
  district: string;
  areaCount: number;
  averagePovertyRate: number;
  averageGini: number;
  minPovertyRate: number;
  maxPovertyRate: number;
}

export interface LocalPovertyEvidence {
  title: string;
  explanation: string;
  districtProfiles: DistrictPovertyProfile[];
  highestPovertyDistricts: DistrictPovertyProfile[];
  lowestPovertyDistricts: DistrictPovertyProfile[];
  localExtremes: LocalPovertyArea[];
  povertyGap: number;
  povertyGiniCorrelation: number;
  interpretation: string;
  supportingPublication: {
    title: string;
    href: string;
    note: string;
  };
}

export interface PovertyPredictionResponse {
  title: string;
  method: string;
  explanation: string;
  slope: number;
  intercept: number;
  latestHistoricalYear: number;
  forecastYears: number[];
  chartSeries: PovertyPredictionChartPoint[];
  forecast: PovertyPredictionValue[];
}

export interface AnalyticsResponse {
  title: string;
  summary: string;
  variables: string[];
  modelScore: number;
  regressionOverview: RegressionOverview;
  keyFindings: string[];
  correlations: CorrelationInsight[];
  coefficients: RegressionCoefficient[];
  regressionSeries: RegressionObservation[];
  predictionSeries: PredictionPoint[];
  actualPredictedSeries: ActualPredictedPoint[];
  correlationMatrix: CorrelationMatrixCell[];
  scatterSeries: ScatterSeries[];
  trendInsights: TrendInsights;
  regionalInsights: RegionalInsights;
  povertyGrouping: PovertyGrouping;
  localPovertyEvidence: LocalPovertyEvidence;
  demographicBreakdowns: DemographicBreakdown[];
  legacyCharts: AnalyticsChartAsset[];
}
