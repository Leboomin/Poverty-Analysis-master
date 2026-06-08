import { z } from 'zod';

const trendDirectionSchema = z.enum(['up', 'down', 'stable']);

export const headlineMetricSchema = z.object({
  label: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  delta: z.number(),
  trend: trendDirectionSchema,
  year: z.number().int(),
});

export const relativePovertyTrendPointSchema = z.object({
  period: z.string().min(1),
  percentage: z.number(),
  number: z.number(),
});

export const dashboardSupportMetricSchema = z.object({
  label: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  year: z.number().int(),
  context: z.string().min(1),
});

export const dashboardDerivedInsightSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  context: z.string().min(1),
});

export const demographicGroupSchema = z.object({
  group: z.string().min(1),
  value: z.number(),
});

export const demographicBreakdownSchema = z.object({
  category: z.string().min(1),
  year: z.number().int(),
  groups: z.array(demographicGroupSchema),
});

export const dashboardRegionSnapshotSchema = z.object({
  region: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  year: z.number().int(),
  note: z.string().min(1),
  rank: z.number().int().positive(),
});

export const publicationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
  date: z.string().min(1),
  category: z.string().min(1),
  excerpt: z.string().min(1),
});

export const dashboardResponseSchema = z.object({
  headlineMetric: headlineMetricSchema,
  supportingMetrics: z.array(dashboardSupportMetricSchema),
  derivedInsights: z.array(dashboardDerivedInsightSchema),
  relativePovertyTrend: z.array(relativePovertyTrendPointSchema),
  demographicHighlights: z.array(demographicBreakdownSchema),
  regionalStats: z.array(dashboardRegionSnapshotSchema),
  publications: z.array(publicationSchema),
  keyFindings: z.array(z.string().min(1)),
});
