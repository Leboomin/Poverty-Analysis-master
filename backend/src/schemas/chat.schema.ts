import { z } from 'zod';

export const chatHistoryEntrySchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string().min(1),
});

export const chatRequestSchema = z.object({
  question: z.string().trim().min(1),
  history: z.array(chatHistoryEntrySchema).optional(),
});

export const chatSourceSchema = z.object({
  title: z.string().min(1),
  file: z.string().optional(),
  uri: z.string().optional(),
  page: z.number().int().optional(),
});

export const chatResponseSchema = z.object({
  answer: z.string().min(1),
  sources: z.array(chatSourceSchema),
  dataPoints: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).optional(),
});
