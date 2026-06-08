import { z } from 'zod';
import { demographicBreakdownSchema } from './dashboard.schema.ts';

const clusterCategorySchema = z.enum(['Low', 'Medium', 'High']);
const trendExtremePointSchema = z.object({
  period: z.string().min(1),
  value: z.number(),
});

export const povertyPredictionResponseSchema = z.object({
  title: z.string().min(1),
  method: z.string().min(1),
  explanation: z.string().min(1),
  slope: z.number(),
  intercept: z.number(),
  latestHistoricalYear: z.number().int(),
  forecastYears: z.array(z.number().int()),
  chartSeries: z.array(
    z.object({
      year: z.number().int(),
      label: z.string().min(1),
      historical: z.number().nullable(),
      predicted: z.number().nullable(),
    }),
  ),
  forecast: z.array(
    z.object({
      year: z.number().int(),
      povertyRate: z.number(),
    }),
  ),
});

export const analyticsResponseSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  variables: z.array(z.string().min(1)),
  modelScore: z.number(),
  regressionOverview: z.object({
    specification: z.string().min(1),
    interpretation: z.string().min(1),
    strongestDriver: z.string().min(1),
  }),
  keyFindings: z.array(z.string().min(1)),
  correlations: z.array(
    z.object({
      variable: z.string().min(1),
      correlation: z.number(),
      direction: z.enum(['positive', 'negative']),
      strength: z.enum(['weak', 'moderate', 'strong']),
    }),
  ),
  coefficients: z.array(
    z.object({
      variable: z.string().min(1),
      coefficient: z.number(),
    }),
  ),
  regressionSeries: z.array(
    z.object({
      period: z.string().min(1),
      povertyRate: z.number(),
      gdp: z.number(),
      unemployment: z.number(),
      inflation: z.number(),
      gini: z.number(),
    }),
  ),
  predictionSeries: z.array(
    z.object({
      period: z.string().min(1),
      povertyRate: z.number(),
      rollingAverage: z.number(),
      trendChange: z.number().nullable(),
    }),
  ),
  actualPredictedSeries: z.array(
    z.object({
      period: z.string().min(1),
      actual: z.number(),
      predicted: z.number(),
    }),
  ),
  correlationMatrix: z.array(
    z.object({
      row: z.string().min(1),
      column: z.string().min(1),
      value: z.number(),
    }),
  ),
  scatterSeries: z.array(
    z.object({
      variable: z.string().min(1),
      label: z.string().min(1),
      unit: z.string().min(1),
      points: z.array(
        z.object({
          x: z.number(),
          y: z.number(),
          period: z.string().min(1),
        }),
      ),
      interpolatedPoints: z.array(
        z.object({
          x: z.number(),
          y: z.number(),
          period: z.string().min(1),
        }),
      ),
      trendLine: z.array(
        z.object({
          x: z.number(),
          y: z.number(),
        }),
      ),
    }),
  ),
  trendInsights: z.object({
    overallDirection: z.enum(['increasing', 'decreasing', 'stable']),
    overallChange: z.number(),
    overallPercentChange: z.number(),
    averageRate: z.number(),
    minPoint: trendExtremePointSchema,
    maxPoint: trendExtremePointSchema,
    consecutiveChanges: z.array(
      z.object({
        fromPeriod: z.string().min(1),
        toPeriod: z.string().min(1),
        fromValue: z.number(),
        toValue: z.number(),
        change: z.number(),
        percentChange: z.number(),
      }),
    ),
    summary: z.string().min(1),
  }),
  regionalInsights: z.object({
    explanation: z.string().min(1),
    topDistricts: z.array(
      z.object({
        region: z.string().min(1),
        value: z.number(),
        year: z.number().int(),
        rank: z.number().int(),
      }),
    ),
    bottomDistricts: z.array(
      z.object({
        region: z.string().min(1),
        value: z.number(),
        year: z.number().int(),
        rank: z.number().int(),
      }),
    ),
    gapValue: z.number(),
    gapPercent: z.number(),
    summary: z.string().min(1),
  }),
  povertyGrouping: z.object({
    title: z.string().min(1),
    basis: z.string().min(1),
    explanation: z.string().min(1),
    records: z.array(
      z.object({
        region: z.string().min(1),
        value: z.number(),
        unit: z.string().min(1),
        year: z.number().int(),
        rank: z.number().int(),
        category: clusterCategorySchema,
        interpretation: z.string().min(1),
      }),
    ),
    summary: z.array(
      z.object({
        category: clusterCategorySchema,
        count: z.number().int(),
        interpretation: z.string().min(1),
      }),
    ),
  }),
  localPovertyEvidence: z.object({
    title: z.string().min(1),
    explanation: z.string().min(1),
    districtProfiles: z.array(
      z.object({
        district: z.string().min(1),
        areaCount: z.number().int(),
        averagePovertyRate: z.number(),
        averageGini: z.number(),
        minPovertyRate: z.number(),
        maxPovertyRate: z.number(),
      }),
    ),
    highestPovertyDistricts: z.array(
      z.object({
        district: z.string().min(1),
        areaCount: z.number().int(),
        averagePovertyRate: z.number(),
        averageGini: z.number(),
        minPovertyRate: z.number(),
        maxPovertyRate: z.number(),
      }),
    ),
    lowestPovertyDistricts: z.array(
      z.object({
        district: z.string().min(1),
        areaCount: z.number().int(),
        averagePovertyRate: z.number(),
        averageGini: z.number(),
        minPovertyRate: z.number(),
        maxPovertyRate: z.number(),
      }),
    ),
    localExtremes: z.array(
      z.object({
        area: z.string().min(1),
        district: z.string().min(1),
        rank: z.number().int(),
        povertyRate: z.number(),
        gini: z.number(),
      }),
    ),
    povertyGap: z.number(),
    povertyGiniCorrelation: z.number(),
    interpretation: z.string().min(1),
    supportingPublication: z.object({
      title: z.string().min(1),
      href: z.string().min(1),
      note: z.string().min(1),
    }),
  }),
  demographicBreakdowns: z.array(demographicBreakdownSchema),
  legacyCharts: z.array(
    z.object({
      title: z.string().min(1),
      imagePath: z.string().min(1),
      caption: z.string().min(1),
    }),
  ),
});
