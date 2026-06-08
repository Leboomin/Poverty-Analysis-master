import { z } from 'zod';

export const datasetListItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  format: z.string().min(1),
  size: z.string().min(1),
  records: z.number().int().nonnegative(),
  lastUpdated: z.string().min(1),
  source: z.string().min(1),
  description: z.string().min(1),
});

export const datasetListResponseSchema = z.object({
  datasets: z.array(datasetListItemSchema),
});

export const datasetPreviewParamsSchema = z.object({
  id: z.string().min(1),
});

export const datasetColumnSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['string', 'number', 'integer']),
});

export const datasetPreviewResponseSchema = z.object({
  dataset: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    format: z.string().min(1),
    description: z.string().min(1),
    source: z.string().min(1),
  }),
  columns: z.array(datasetColumnSchema),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))),
});
