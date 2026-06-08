import { readTextFile } from '../utils/file.utils.ts';
import { getRawGeospatialPath } from '../utils/data-paths.utils.ts';
import { getDatabase } from '../db/connection.ts';
import type { MapAreaHighlight, MapRegion, MapResponse } from '../../../shared/api/index.ts';

const geoJsonPath = getRawGeospatialPath('mauritius_districts.geojson');

type GeoFeature = {
  type: string;
  properties: Record<string, unknown>;
  geometry: Record<string, unknown>;
};

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

export function readMapData(): MapResponse {
  const db = getDatabase();
  const geo = JSON.parse(readTextFile(geoJsonPath)) as { type: string; features: GeoFeature[] };
  const regions = db
    .prepare(
      'SELECT region, map_key AS mapKey, rdi, change, rank, year FROM map_regions ORDER BY rank',
    )
    .all() as unknown as MapRegion[];
  const regionByKey = new Map(regions.map((region) => [region.mapKey, region]));
  const topAreas = db
    .prepare(
      "SELECT area, area_type AS areaType, rdi_2022 AS rdi2022, rdi_2011 AS rdi2011, change FROM map_area_highlights WHERE highlight_type = 'top' ORDER BY rdi_2022 DESC",
    )
    .all() as unknown as MapAreaHighlight[];
  const bottomAreas = db
    .prepare(
      "SELECT area, area_type AS areaType, rdi_2022 AS rdi2022, rdi_2011 AS rdi2011, change FROM map_area_highlights WHERE highlight_type = 'bottom' ORDER BY rdi_2022 ASC",
    )
    .all() as unknown as MapAreaHighlight[];
  const improvingAreas = db
    .prepare(
      "SELECT area, area_type AS areaType, rdi_2022 AS rdi2022, rdi_2011 AS rdi2011, change FROM map_area_highlights WHERE highlight_type = 'improving' ORDER BY change DESC",
    )
    .all() as unknown as MapAreaHighlight[];
  const rankedRegions = regions.filter((region) => region.rdi !== null && region.region !== 'Rodrigues');

  return {
    geo: {
      type: geo.type,
      features: geo.features.map((feature) => {
        const shapeName = typeof feature.properties.shapeName === 'string' ? feature.properties.shapeName : '';
        const region = regionByKey.get(normalizeName(shapeName));

        return {
          ...feature,
          properties: {
            ...feature.properties,
            rdi: region?.rdi ?? null,
            rank: region?.rank ?? null,
            year: region?.year ?? 2022,
          },
        };
      }),
    },
    regions,
    topAreas,
    bottomAreas,
    improvingAreas,
    overview: {
      bestRegion: rankedRegions[0]?.region ?? 'Unavailable',
      bestRegionValue: rankedRegions[0]?.rdi ?? 0,
      lowestRegion: rankedRegions.at(-1)?.region ?? 'Unavailable',
      lowestRegionValue: rankedRegions.at(-1)?.rdi ?? 0,
      featureCount: geo.features.length,
    },
  };
}
