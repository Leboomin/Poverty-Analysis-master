import { z } from 'zod';

export const geoFeatureSchema = z.record(z.string(), z.unknown());
export const mapRegionSchema = z.object({
  region: z.string().min(1),
  mapKey: z.string().min(1),
  rdi: z.number().nullable(),
  change: z.number().nullable(),
  rank: z.number().int().positive().nullable(),
  year: z.number().int(),
});

export const mapAreaHighlightSchema = z.object({
  area: z.string().min(1),
  areaType: z.string().min(1),
  rdi2022: z.number(),
  rdi2011: z.number().nullable(),
  change: z.number().nullable(),
});

export const mapResponseSchema = z.object({
  geo: z.object({
    type: z.string().min(1),
    features: z.array(geoFeatureSchema),
  }),
  regions: z.array(mapRegionSchema),
  topAreas: z.array(mapAreaHighlightSchema),
  bottomAreas: z.array(mapAreaHighlightSchema),
  improvingAreas: z.array(mapAreaHighlightSchema),
  overview: z.object({
    bestRegion: z.string().min(1),
    bestRegionValue: z.number(),
    lowestRegion: z.string().min(1),
    lowestRegionValue: z.number(),
    featureCount: z.number().int().nonnegative(),
  }),
});
