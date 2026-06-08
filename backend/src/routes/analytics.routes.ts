import { Router } from 'express';
import { getAnalyticsHandler, getAnalyticsPredictionHandler } from '../handlers/analytics.handler.ts';

const router = Router();

router.get('/', getAnalyticsHandler);
router.get('/prediction', getAnalyticsPredictionHandler);

export default router;
