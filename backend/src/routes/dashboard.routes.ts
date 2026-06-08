import { Router } from 'express';
import { getDashboardHandler } from '../handlers/dashboard.handler.ts';

const router = Router();

router.get('/', getDashboardHandler);

export default router;
