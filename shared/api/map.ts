export interface MapRegion {
  region: string;
  mapKey: string;
  rdi: number | null;
  change: number | null;
  rank: number | null;
  year: number;
}

export interface MapAreaHighlight {
  area: string;
  areaType: string;
  rdi2022: number;
  rdi2011: number | null;
  change: number | null;
}

export interface MapOverview {
  bestRegion: string;
  bestRegionValue: number;
  lowestRegion: string;
  lowestRegionValue: number;
  featureCount: number;
}

export interface MapResponse {
  geo: {
    type: string;
    features: Array<Record<string, unknown>>;
  };
  regions: MapRegion[];
  topAreas: MapAreaHighlight[];
  bottomAreas: MapAreaHighlight[];
  improvingAreas: MapAreaHighlight[];
  overview: MapOverview;
}
