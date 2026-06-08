import type { Request, Response } from 'express';
import { getDashboardData } from '../services/dashboard.service.ts';
import { dashboardResponseSchema } from '../schemas/dashboard.schema.ts';
import { validateResponse } from '../utils/validation.utils.ts';

export function getDashboardHandler(_req: Request, res: Response) {
  res.json(validateResponse(dashboardResponseSchema, getDashboardData(), 'INVALID_DASHBOARD_RESPONSE'));
}
