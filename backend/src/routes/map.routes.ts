import { Router } from 'express';
import { getMapHandler } from '../handlers/map.handler.ts';

const router = Router();

router.get('/', getMapHandler);

export default router;
