import type { Request, Response } from 'express';
import { createApiError } from '../utils/error.utils.ts';
import {
  datasetListResponseSchema,
  datasetPreviewParamsSchema,
  datasetPreviewResponseSchema,
} from '../schemas/dataset.schema.ts';
import { getDatasetList, getDatasetPreview } from '../services/dataset.service.ts';
import { validateRequest, validateResponse } from '../utils/validation.utils.ts';

export function getDatasetsHandler(_req: Request, res: Response) {
  res.json(
    validateResponse(
      datasetListResponseSchema,
      { datasets: getDatasetList() },
      'INVALID_DATASET_LIST_RESPONSE',
    ),
  );
}

export function getDatasetPreviewHandler(req: Request, res: Response) {
  const { id } = validateRequest(datasetPreviewParamsSchema, req.params, 'INVALID_DATASET_PARAMS');
  const preview = getDatasetPreview(id);

  if (!preview) {
    res.status(404).json(createApiError('DATASET_NOT_FOUND', `Dataset '${id}' was not found.`));
    return;
  }

  res.json(validateResponse(datasetPreviewResponseSchema, preview, 'INVALID_DATASET_PREVIEW_RESPONSE'));
}
