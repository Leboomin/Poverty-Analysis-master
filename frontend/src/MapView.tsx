import React from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Globe2, MapPinned, Map as MapIcon, TrendingUp } from 'lucide-react';
import type { MapResponse } from '../../shared/api';
import { fetchMapData } from './lib/api';
import { Layout } from './components/Layout';
import { Card, Headline, Label } from './components/UI';

type MapFeature = {
  type: string;
  properties: {
    shapeName?: string;
    [key: string]: unknown;
  };
  geometry: Record<string, unknown>;
};

const excludedRegions = new Set(['AgalÃƒÂ©ga', 'AgalÃ©ga', 'Agalega', 'Agaléga', 'St. Brandon', 'Rodrigues']);

function normalizeDistrictName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function interpolateColor(start: string, end: string, ratio: number) {
  const normalizedRatio = Math.max(0, Math.min(1, ratio));
  const startValue = Number.parseInt(start.slice(1), 16);
  const endValue = Number.parseInt(end.slice(1), 16);
  const red = Math.round(((startValue >> 16) & 255) + ((((endValue >> 16) & 255) - ((startValue >> 16) & 255)) * normalizedRatio));
  const green = Math.round((((startValue >> 8) & 255) + ((((endValue >> 8) & 255) - ((startValue >> 8) & 255)) * normalizedRatio)));
  const blue = Math.round(((startValue & 255) + (((endValue & 255) - (startValue & 255)) * normalizedRatio)));
  return `rgb(${red}, ${green}, ${blue})`;
}

function colorForRdi(value: number | null | undefined, min: number, max: number) {
  if (value === null || value === undefined) {
    return 'rgba(148, 163, 184, 0.25)';
  }

  const spread = max - min || 1;
  return interpolateColor('#d8c4a8', '#0b4dbb', (value - min) / spread);
}

const MapView = () => {
  const [data, setData] = React.useState<MapResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedRegionName, setSelectedRegionName] = React.useState<string | null>(null);
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.innerWidth < 768;
  });
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const geoJsonLayerRef = React.useRef<L.GeoJSON | null>(null);
  const regionByNameRef = React.useRef<Map<string, MapResponse['regions'][number]>>(new Map());

  React.useEffect(() => {
    let isMounted = true;

    fetchMapData()
      .then((response) => {
        if (isMounted) {
          setData(response);
          setSelectedRegionName(response.overview.bestRegion);
        }
      })
      .catch((requestError: Error) => {
        if (isMounted) {
          setError(requestError.message);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const mauritiusRegions = React.useMemo(
    () => data?.regions.filter((region) => !excludedRegions.has(region.region)) ?? [],
    [data],
  );

  const visibleFeatures = React.useMemo(
    () =>
      ((data?.geo.features as MapFeature[] | undefined) ?? []).filter((feature) => {
        const shapeName = feature.properties.shapeName;
        return typeof shapeName === 'string' && !excludedRegions.has(shapeName);
      }),
    [data],
  );

  const values = React.useMemo(
    () => mauritiusRegions.map((region) => region.rdi).filter((value): value is number => value !== null),
    [mauritiusRegions],
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      mapRef.current?.invalidateSize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (!mapContainerRef.current || !data || visibleFeatures.length === 0) {
      return;
    }

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: false,
        keyboard: false,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        maxBoundsViscosity: 1,
      });
    }

    const map = mapRef.current;

    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.remove();
      geoJsonLayerRef.current = null;
    }

    const minRdi = values.length > 0 ? Math.min(...values) : 0;
    const maxRdi = values.length > 0 ? Math.max(...values) : 1;
    const regionByName = new Map<string, MapResponse['regions'][number]>(
      mauritiusRegions.map((region) => [normalizeDistrictName(region.region), region]),
    );
    regionByNameRef.current = regionByName;

    const featureCollection = {
      type: 'FeatureCollection' as const,
      features: visibleFeatures,
    };

    const geoJsonLayer = L.geoJSON(featureCollection as never, {
      style: (feature) => {
        const typedFeature = feature as MapFeature;
        const shapeName = typedFeature.properties.shapeName ?? '';
        const region = regionByName.get(normalizeDistrictName(shapeName));

        return {
          color: 'rgba(255,255,255,0.95)',
          weight: 1.6,
          lineJoin: 'round',
          fillColor: colorForRdi(region?.rdi, minRdi, maxRdi),
          fillOpacity: 0.92,
        };
      },
      onEachFeature: (feature, layer) => {
        const typedFeature = feature as MapFeature;
        const shapeName = typedFeature.properties.shapeName ?? 'Unknown district';
        const region = regionByName.get(normalizeDistrictName(shapeName));
        const tooltip = region
          ? `${shapeName}<br/>RDI: ${region.rdi?.toFixed(3) ?? 'N/A'}`
          : `${shapeName}<br/>No district RDI available`;

        layer.bindTooltip(tooltip, { sticky: true });
        layer.on({
          mouseover: () => setSelectedRegionName(shapeName),
          click: () => setSelectedRegionName(shapeName),
        });
      },
    }).addTo(map);

    geoJsonLayerRef.current = geoJsonLayer;

    const bounds = geoJsonLayer.getBounds();
    window.setTimeout(() => {
      map.invalidateSize();

      if (bounds.isValid()) {
        const mauritiusBounds = bounds.pad(0.12);
        map.setMinZoom(isMobile ? 8.75 : 10.1);
        map.setMaxBounds(mauritiusBounds.pad(isMobile ? 0.14 : 0.06));
        map.fitBounds(mauritiusBounds, {
          paddingTopLeft: isMobile ? [16, 16] : [24, 24],
          paddingBottomRight: isMobile ? [16, 16] : [72, 24],
          maxZoom: isMobile ? 9.9 : 11.35,
          animate: false,
        });
      } else {
        map.setView([-20.23, 57.53], isMobile ? 9.25 : 10.9, { animate: false });
      }

      geoJsonLayer.bringToFront();
    }, 0);

    return () => {
      geoJsonLayer.remove();
      geoJsonLayerRef.current = null;
    };
  }, [data, isMobile, mauritiusRegions, values, visibleFeatures]);

  React.useEffect(() => {
    const geoJsonLayer = geoJsonLayerRef.current;
    if (!geoJsonLayer) {
      return;
    }

    const minRdi = values.length > 0 ? Math.min(...values) : 0;
    const maxRdi = values.length > 0 ? Math.max(...values) : 1;

    geoJsonLayer.eachLayer((layer) => {
      const feature = (layer as L.Path & { feature?: MapFeature }).feature;
      const shapeName = feature?.properties?.shapeName ?? '';
      const region = regionByNameRef.current.get(normalizeDistrictName(shapeName));
      const isSelected = selectedRegionName === shapeName;

      if (layer instanceof L.Path) {
        layer.setStyle({
          color: isSelected ? '#0f172a' : 'rgba(255,255,255,0.95)',
          weight: isSelected ? 3 : 1.6,
          lineJoin: 'round',
          fillColor: colorForRdi(region?.rdi, minRdi, maxRdi),
          fillOpacity: 0.92,
        });

        if (isSelected) {
          layer.bringToFront();
        }
      }
    });
  }, [selectedRegionName, values]);

  React.useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const selectedRegion =
    selectedRegionName === null
      ? null
      : mauritiusRegions.find(
          (region) => normalizeDistrictName(region.region) === normalizeDistrictName(selectedRegionName),
        ) ?? null;

  return (
    <Layout>
      <div className="space-y-10">
        <section className="max-w-4xl">
          <Label className="mb-3 block">Geospatial View</Label>
          <Headline level={1} className="mb-4">Mauritius District Development Map</Headline>
          <p className="text-on-surface/60 text-lg leading-relaxed">
            This map is now deliberately Mauritius-only. The camera, bounds, and district layer all focus on Mauritius so the page opens on the island instead of trying to include other territories.
          </p>
        </section>

        {error && (
          <Card className="border border-error/30">
            <Headline level={3} className="mb-2">Map data unavailable</Headline>
            <p className="text-sm text-on-surface/60">{error}</p>
          </Card>
        )}

        {data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <Globe2 size={20} />
                  <Label className="text-primary/70">Mauritius Districts</Label>
                </div>
                <p className="text-2xl font-display font-bold text-primary">{visibleFeatures.length}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <MapPinned size={20} />
                  <Label className="text-primary/70">Best District</Label>
                </div>
                <p className="text-2xl font-display font-bold text-primary">{data.overview.bestRegion}</p>
                <p className="mt-2 text-sm text-on-surface/55">RDI {data.overview.bestRegionValue.toFixed(3)}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <MapIcon size={20} />
                  <Label className="text-primary/70">Lowest District</Label>
                </div>
                <p className="text-2xl font-display font-bold text-primary">{data.overview.lowestRegion}</p>
                <p className="mt-2 text-sm text-on-surface/55">RDI {data.overview.lowestRegionValue.toFixed(3)}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <TrendingUp size={20} />
                  <Label className="text-primary/70">Improvement Rows</Label>
                </div>
                <p className="text-2xl font-display font-bold text-primary">{data.improvingAreas.length}</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.85fr] gap-8">
              <Card className="p-6 xl:p-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <Headline level={2}>Mauritius-Only Choropleth</Headline>
                    <p className="mt-2 text-sm text-on-surface/50">
                      Use the built-in controls to zoom around Mauritius only.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-on-surface/55">
                    <span>Lower RDI</span>
                    <div className="h-3 w-28 rounded-full" style={{ background: 'linear-gradient(90deg, #d8c4a8 0%, #0b4dbb 100%)' }} />
                    <span>Higher RDI</span>
                  </div>
                </div>

                <div
                  ref={mapContainerRef}
                  className="h-[420px] md:h-[620px] overflow-hidden rounded-[28px] border border-outline-variant bg-surface-container-low"
                />
                <p className="mt-4 text-xs text-on-surface/45">
                  Rodrigues and the outer islands are excluded from this view on purpose so the map stays centered on Mauritius.
                </p>
              </Card>

              <Card className="p-8">
                <Headline level={2} className="mb-4">Selected District</Headline>
                {selectedRegion ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-5">
                      <p className="text-xs uppercase tracking-wider text-on-surface/45">Region</p>
                      <p className="mt-2 text-2xl font-display font-bold text-primary">{selectedRegion.region}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4">
                        <p className="text-xs uppercase tracking-wider text-on-surface/45">RDI</p>
                        <p className="mt-2 text-2xl font-display font-bold text-primary">
                          {selectedRegion.rdi !== null ? selectedRegion.rdi.toFixed(3) : 'N/A'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4">
                        <p className="text-xs uppercase tracking-wider text-on-surface/45">Rank</p>
                        <p className="mt-2 text-2xl font-display font-bold text-primary">
                          {selectedRegion.rank ?? 'N/A'}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-on-surface/60">
                      District summaries come from the aggregated RDI output, while detailed area rankings below come from the cleaned 2022 and comparison workbooks.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-on-surface/50">Hover or click a district to inspect it.</p>
                )}
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <Card className="p-8">
                <Headline level={2} className="mb-6">Top 2022 Areas</Headline>
                <div className="space-y-3">
                  {data.topAreas.map((area) => (
                    <div key={area.area} className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium">{area.area}</span>
                        <span className="text-sm font-display font-bold text-primary">{area.rdi2022.toFixed(4)}</span>
                      </div>
                      <p className="mt-2 text-xs text-on-surface/45">{area.areaType}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-8">
                <Headline level={2} className="mb-6">Lowest 2022 Areas</Headline>
                <div className="space-y-3">
                  {data.bottomAreas.map((area) => (
                    <div key={area.area} className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium">{area.area}</span>
                        <span className="text-sm font-display font-bold text-primary">{area.rdi2022.toFixed(4)}</span>
                      </div>
                      <p className="mt-2 text-xs text-on-surface/45">{area.areaType}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-8">
                <Headline level={2} className="mb-6">Largest Improvements</Headline>
                <div className="space-y-3">
                  {data.improvingAreas.map((area) => (
                    <div key={area.area} className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium">{area.area}</span>
                        <span className="text-sm font-display font-bold text-primary">
                          {area.change !== null ? `+${area.change.toFixed(4)}` : 'N/A'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-on-surface/45">
                        {area.areaType} | 2022 RDI {area.rdi2022.toFixed(4)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        ) : (
          !error && (
            <Card className="p-8">
              <p className="text-sm text-on-surface/50">Loading map data...</p>
            </Card>
          )
        )}
      </div>
    </Layout>
  );
};

export default MapView;
