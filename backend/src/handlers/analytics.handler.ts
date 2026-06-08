import type { Request, Response } from 'express';
import { analyticsResponseSchema, povertyPredictionResponseSchema } from '../schemas/analytics.schema.ts';
import { getAnalyticsPrediction, getAnalyticsSummary } from '../services/analytics.service.ts';
import { validateResponse } from '../utils/validation.utils.ts';

export function getAnalyticsHandler(_req: Request, res: Response) {
  res.json(validateResponse(analyticsResponseSchema, getAnalyticsSummary(), 'INVALID_ANALYTICS_RESPONSE'));
}

export function getAnalyticsPredictionHandler(_req: Request, res: Response) {
  res.json(
    validateResponse(
      povertyPredictionResponseSchema,
      getAnalyticsPrediction(),
      'INVALID_ANALYTICS_PREDICTION_RESPONSE',
    ),
  );
}
