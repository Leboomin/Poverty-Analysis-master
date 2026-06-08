import type { Request, Response } from 'express';
import { mapResponseSchema } from '../schemas/map.schema.ts';
import { getMapData } from '../services/map.service.ts';
import { validateResponse } from '../utils/validation.utils.ts';

export function getMapHandler(_req: Request, res: Response) {
  res.json(validateResponse(mapResponseSchema, getMapData(), 'INVALID_MAP_RESPONSE'));
}
