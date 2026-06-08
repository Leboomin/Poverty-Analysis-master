import { Router } from 'express';
import { getDatasetPreviewHandler, getDatasetsHandler } from '../handlers/dataset.handler.ts';

const router = Router();

router.get('/', getDatasetsHandler);
router.get('/:id/preview', getDatasetPreviewHandler);

export default router;
