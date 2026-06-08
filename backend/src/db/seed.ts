import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import type {
  DashboardRegionSnapshot,
  DashboardSupportMetric,
  DatasetPreviewResponse,
  DemographicBreakdown,
  Publication,
  RelativePovertyTrendPoint,
} from '../../../shared/api/index.ts';
import { env } from '../config/env.ts';
import { getDatabase } from './connection.ts';
import { getProcessedDataPath, getRawGeospatialPath, getRawSpreadsheetPath, getRawWorldBankPath } from '../utils/data-paths.utils.ts';
import { readJsonFile, readTextFile, readWorkbookRows } from '../utils/file.utils.ts';

type DatasetCatalogRow = {
  id: string;
  name: string;
  format: string;
  records: number;
  lastUpdated: string;
  source: string;
  description: string;
};

type RegressionObservationRow = {
  Year: string | null;
  Poverty_Rate: number | null;
  GDP: number | null;
  Unemployment: number | null;
  Inflation: number | null;
  Gini: number | null;
};

type PredictionRow = {
  Year: string | null;
  Poverty_Rate: number | null;
  Trend_Change: number | null;
  Rolling_Avg: number | null;
};

type LongFormatRow = {
  Year: string | number | null;
  Category: string | null;
  Group: string | null;
  Value: number | null;
};

type DistrictRdiRow = {
  district_clean: string;
  rdi: string;
};

type RdiAreaRow = {
  area_name: string | null;
  area_type: string | null;
  rdi: number | null;
};

type RdiComparisonRow = {
  Area: string | null;
  'RDI 2022': number | null;
  'RDI 2011': number | null;
  Change: number | null;
};

const advancedWorkbookPath = getRawSpreadsheetPath('mauritius_poverty_ADVANCED.xlsx');
const rdiWorkbookPath = getRawSpreadsheetPath('rdi_2022_clean_final.xlsx');
const rdiComparisonWorkbookPath = getRawSpreadsheetPath('rdi_comparison_clean.xlsx');
const districtRdiCsvPath = getRawGeospatialPath('rdi_district_aggregated_mauritius_rodrigues.csv');
const householdPovertySurveyPath = getRawSpreadsheetPath('HS_Poverty_Jun23_210623.xlsx');
const fullRawWorkbookPath = getRawSpreadsheetPath('mauritius_poverty_FULL_raw.xlsx');
const extractedWorkbookPath = getRawSpreadsheetPath('mauritius_relative_poverty_extracted_workbook.xlsx');
const rdi2011WorkbookPath = getRawSpreadsheetPath('RDI2011.xlsx');
const povertyMusCsvPath = getRawSpreadsheetPath('poverty_mus.csv');
const worldBankCountryMetadataPath = getRawWorldBankPath('Metadata_Country_API_MUS_DS2_en_csv_v2_26053.csv');
const worldBankIndicatorMetadataPath = getRawWorldBankPath('Metadata_Indicator_API_MUS_DS2_en_csv_v2_26053.csv');
const mauritiusDistrictsGeoJsonPath = getRawGeospatialPath('mauritius_districts.geojson');

const publicationCatalog: Publication[] = [
  {
    id: 'poverty-2023',
    title: 'Poverty Analysis Report 2023',
    author: 'Statistics Mauritius',
    date: '2023-12-01',
    category: 'Official Report',
    excerpt: 'Latest survey-based update covering the 2023 relative poverty rate and the number of persons living in relative poverty.',
  },
  {
    id: 'poverty-2017',
    title: 'Poverty Analysis Report 2017',
    author: 'Statistics Mauritius',
    date: '2019-01-01',
    category: 'Official Report',
    excerpt: 'Reference report for the 2017 household survey and the pre-2023 peak in the relative poverty series.',
  },
  {
    id: 'rdi-2022',
    title: 'Relative Development Index 2022',
    author: 'Statistics Mauritius',
    date: '2022-12-01',
    category: 'Regional Index',
    excerpt: 'District, ward, and village council area measurements used to compare spatial development outcomes across Mauritius.',
  },
  {
    id: 'poverty-2012',
    title: 'Poverty Analysis Report 2012',
    author: 'Statistics Mauritius',
    date: '2014-01-01',
    category: 'Official Report',
    excerpt: 'Historic benchmark for the rise in relative poverty before the 2017 and 2023 updates.',
  },
];

const datasetCatalog: DatasetCatalogRow[] = [
  {
    id: 'relative-poverty-series',
    name: 'Relative Poverty Time Series',
    format: 'json',
    records: 6,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius',
    description: 'Processed time series used for the dashboard poverty trend and headline analysis.',
  },
  {
    id: 'poverty-indicators-cleaned',
    name: 'Relative Poverty Indicators (Cleaned)',
    format: 'xlsx',
    records: 5,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius',
    description: 'Cleaned indicator workbook containing poverty rate, household counts, poverty line values, and annual support estimates.',
  },
  {
    id: 'household-poverty-survey-2023',
    name: 'Household Poverty Survey June 2023',
    format: 'xlsx',
    records: 6,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius',
    description: 'Supporting workbook related to the June 2023 household poverty update.',
  },
  {
    id: 'mauritius-poverty-dataset',
    name: 'Mauritius Poverty Dataset',
    format: 'xlsx',
    records: 6,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius',
    description: 'Compiled poverty indicators workbook used as one of the main structured sources in the project.',
  },
  {
    id: 'mauritius-poverty-advanced',
    name: 'Mauritius Poverty Advanced Workbook',
    format: 'xlsx',
    records: 6,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius',
    description: 'Advanced cleaned workbook containing regression, prediction, and demographic breakdown sheets.',
  },
  {
    id: 'mauritius-poverty-full-raw',
    name: 'Mauritius Poverty Full Raw Workbook',
    format: 'xlsx',
    records: 6,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius',
    description: 'Full raw poverty workbook retained as an unrefined reference source before cleaning and transformation.',
  },
  {
    id: 'relative-poverty-extracted-workbook',
    name: 'Mauritius Relative Poverty Extracted Workbook',
    format: 'xlsx',
    records: 6,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius',
    description: 'Structured extracted workbook with overview, wide, long, and interval-based poverty trend sheets.',
  },
  {
    id: 'poverty-analysis-2001-02',
    name: 'Poverty Analysis Report 2001/02',
    format: 'pdf',
    records: 4,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius',
    description: 'Official report covering the 2001/02 poverty survey results.',
  },
  {
    id: 'poverty-analysis-2012',
    name: 'Poverty Analysis Report 2012',
    format: 'pdf',
    records: 4,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius',
    description: 'Official report documenting the 2012 poverty analysis benchmark.',
  },
  {
    id: 'poverty-analysis-2017',
    name: 'Poverty Analysis Report 2017',
    format: 'pdf',
    records: 4,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius',
    description: 'Official report for the 2017 poverty survey used as a recent pre-2023 benchmark.',
  },
  {
    id: 'poverty-analysis-2023',
    name: 'Poverty Analysis Report 2023',
    format: 'pdf',
    records: 4,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius',
    description: 'Official poverty analysis report with the latest survey findings.',
  },
  {
    id: 'relative-development-index-1990',
    name: 'Relative Development Index 1990',
    format: 'pdf',
    records: 4,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius',
    description: 'Historic RDI publication used as a long-run regional development reference.',
  },
  {
    id: 'relative-development-index-2022',
    name: 'Relative Development Index 2022',
    format: 'pdf',
    records: 4,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius',
    description: 'Official RDI publication used to support the district vulnerability analysis.',
  },
  {
    id: 'imf-selected-issues-2025',
    name: 'Mauritius: Selected Issues (IMF 2025)',
    format: 'pdf',
    records: 4,
    lastUpdated: '2026-03-30',
    source: 'International Monetary Fund',
    description: 'IMF Selected Issues paper used as a supporting source for poverty, inequality, and fiscal policy interpretation.',
  },
  {
    id: 'rdi-2011-workbook',
    name: 'RDI 2011 Workbook',
    format: 'xlsx',
    records: 6,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius',
    description: 'Workbook containing 2011 relative development index inputs.',
  },
  {
    id: 'rdi-2022-clean-workbook',
    name: 'RDI 2022 Clean Workbook',
    format: 'xlsx',
    records: 6,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius',
    description: 'Cleaned 2022 RDI workbook used for district, ward, and VCA comparisons.',
  },
  {
    id: 'rdi-comparison-workbook',
    name: 'RDI Comparison Workbook',
    format: 'xlsx',
    records: 6,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius',
    description: 'Comparison workbook used to measure changes between earlier and later RDI values.',
  },
  {
    id: 'mauritius-district-boundaries',
    name: 'Mauritius District Boundaries',
    format: 'geojson',
    records: 9,
    lastUpdated: '2026-03-26',
    source: 'Statistics Mauritius / Project geospatial assets',
    description: 'GeoJSON boundary file used to render the interactive district map.',
  },
  {
    id: 'district-rdi-aggregated',
    name: 'District RDI Aggregated Table',
    format: 'csv',
    records: 10,
    lastUpdated: '2026-03-26',
    source: 'Project aggregation from Statistics Mauritius inputs',
    description: 'Aggregated district-level RDI table used to join regional values to the map.',
  },
  {
    id: 'poverty-mus-csv',
    name: 'Mauritius Poverty CSV',
    format: 'csv',
    records: 6,
    lastUpdated: '2026-03-26',
    source: 'Project source data',
    description: 'CSV-form poverty dataset retained as a lightweight tabular source.',
  },
  {
    id: 'world-bank-indicators',
    name: 'World Bank Indicators for Mauritius',
    format: 'csv',
    records: 1456,
    lastUpdated: '2026-03-26',
    source: 'World Bank',
    description: 'Indicator time series for Mauritius exported from the World Bank data portal.',
  },
  {
    id: 'world-bank-country-metadata',
    name: 'World Bank Country Metadata',
    format: 'csv',
    records: 1,
    lastUpdated: '2026-03-26',
    source: 'World Bank',
    description: 'Country-level metadata file accompanying the World Bank indicator export.',
  },
  {
    id: 'world-bank-indicator-metadata',
    name: 'World Bank Indicator Metadata',
    format: 'csv',
    records: 1456,
    lastUpdated: '2026-03-26',
    source: 'World Bank',
    description: 'Indicator definitions and metadata accompanying the World Bank Mauritius extract.',
  },
];

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function readPovertyTrendRows() {
  return readJsonFile<RelativePovertyTrendPoint[]>(getProcessedDataPath('poverty_trend.json'));
}

function readSupportMetrics(): DashboardSupportMetric[] {
  const rows = readWorkbookRows<{
    Year: number | null;
    'Relative poverty line per adult equivalent per month': number | null;
    'Estimated number of households in relative poverty': number | null;
    'Annual amount required to move people out of relative poverty(Rs Million)': number | null;
  }>(getRawSpreadsheetPath('data_indicators-of-relative-poverty-republic-of-mauritius.xlsx'));
  const latest = rows.at(-1);

  if (!latest || latest.Year === null) {
    return [];
  }

  return [
    {
      label: 'Relative poverty line',
      value: Number(latest['Relative poverty line per adult equivalent per month'] ?? 0),
      unit: 'Rs/month',
      year: Number(latest.Year),
      context: 'Per adult equivalent per month',
    },
    {
      label: 'Households in relative poverty',
      value: Number(latest['Estimated number of households in relative poverty'] ?? 0),
      unit: 'households',
      year: Number(latest.Year),
      context: 'Latest household count in the cleaned series',
    },
    {
      label: 'Annual amount needed',
      value: Number(latest['Annual amount required to move people out of relative poverty(Rs Million)'] ?? 0),
      unit: 'Rs Mn',
      year: Number(latest.Year),
      context: 'Estimated annual amount required to move people out of relative poverty',
    },
  ];
}

function readDemographicBreakdowns() {
  const sections = new Map<string, DemographicBreakdown>();

  for (const row of readWorkbookRows<LongFormatRow>(advancedWorkbookPath, 'Long_Format')) {
    if (!row.Category || !row.Group || row.Year === null || row.Value === null) {
      continue;
    }

    const category = String(row.Category);
    if (!sections.has(category)) {
      sections.set(category, {
        category,
        year: Number(row.Year),
        groups: [],
      });
    }

    sections.get(category)?.groups.push({
      group: String(row.Group),
      value: Number(row.Value),
    });
  }

  return [...sections.values()];
}

function readRegressionSeries() {
  return readWorkbookRows<RegressionObservationRow>(advancedWorkbookPath, 'Regression_Dataset')
    .filter((row) => row.Year && row.Poverty_Rate !== null && row.GDP !== null && row.Unemployment !== null && row.Inflation !== null && row.Gini !== null)
    .map((row) => ({
      period: String(row.Year),
      povertyRate: Number(row.Poverty_Rate),
      gdp: Number(row.GDP),
      unemployment: Number(row.Unemployment),
      inflation: Number(row.Inflation),
      gini: Number(row.Gini),
    }));
}

function readPredictionSeries() {
  return readWorkbookRows<PredictionRow>(advancedWorkbookPath, 'Prediction_Dataset')
    .filter((row) => row.Year && row.Poverty_Rate !== null && row.Rolling_Avg !== null)
    .map((row) => ({
      period: String(row.Year),
      povertyRate: Number(row.Poverty_Rate),
      rollingAverage: Number(Number(row.Rolling_Avg).toFixed(2)),
      trendChange: row.Trend_Change === null ? null : Number(Number(row.Trend_Change).toFixed(2)),
    }));
}

function readRegionalStats(): DashboardRegionSnapshot[] {
  const rows = parse(readTextFile(districtRdiCsvPath), {
    columns: true,
    skip_empty_lines: true,
  }) as DistrictRdiRow[];

  return rows
    .filter((row) => row.district_clean !== 'rodrigues')
    .map((row) => ({
      region: row.district_clean.replace(/\b\w/g, (character) => character.toUpperCase()),
      value: Number((Number(row.rdi) * 100).toFixed(1)),
      unit: 'RDI',
      year: 2022,
      note: 'District mean Relative Development Index',
      rank: 0,
    }))
    .sort((left, right) => right.value - left.value)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      region: row.region === 'Riviere Du Rempart' ? 'Riviere du Rempart' : row.region,
    }));
}

function readAreaHighlightRows() {
  const topAreas = readWorkbookRows<RdiAreaRow>(rdiWorkbookPath)
    .filter((row) => row.area_name && row.area_type && row.rdi !== null)
    .map((row) => ({
      highlightType: 'top',
      area: String(row.area_name),
      areaType: String(row.area_type),
      rdi2022: Number(Number(row.rdi).toFixed(4)),
      rdi2011: null,
      change: null,
    }))
    .sort((left, right) => right.rdi2022 - left.rdi2022)
    .slice(0, 8);

  const bottomAreas = readWorkbookRows<RdiAreaRow>(rdiWorkbookPath)
    .filter((row) => row.area_name && row.area_type && row.rdi !== null)
    .map((row) => ({
      highlightType: 'bottom',
      area: String(row.area_name),
      areaType: String(row.area_type),
      rdi2022: Number(Number(row.rdi).toFixed(4)),
      rdi2011: null,
      change: null,
    }))
    .sort((left, right) => left.rdi2022 - right.rdi2022)
    .slice(0, 8);

  const improvingAreas = readWorkbookRows<RdiComparisonRow>(rdiComparisonWorkbookPath)
    .filter((row) => row.Area && row['RDI 2022'] !== null)
    .map((row) => ({
      highlightType: 'improving',
      area: String(row.Area),
      areaType: String(row.Area).includes('Ward') ? 'Ward' : String(row.Area).includes('VCA') ? 'VCA' : 'Area',
      rdi2022: Number(Number(row['RDI 2022']).toFixed(4)),
      rdi2011: row['RDI 2011'] === null ? null : Number(Number(row['RDI 2011']).toFixed(4)),
      change: row.Change === null ? null : Number(Number(row.Change).toFixed(4)),
    }))
    .filter((row) => row.change !== null)
    .sort((left, right) => (right.change ?? 0) - (left.change ?? 0))
    .slice(0, 8);

  return [...topAreas, ...bottomAreas, ...improvingAreas];
}

function toPreviewValue(value: unknown): string | number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? Number(value.toFixed(4)) : null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  return JSON.stringify(value);
}

function inferColumnType(values: Array<string | number | null>): 'string' | 'number' | 'integer' {
  const filtered = values.filter((value) => value !== null);

  if (filtered.length > 0 && filtered.every((value) => typeof value === 'number' && Number.isInteger(value))) {
    return 'integer';
  }

  if (filtered.length > 0 && filtered.every((value) => typeof value === 'number')) {
    return 'number';
  }

  return 'string';
}

function buildTabularPreview(
  dataset: DatasetCatalogRow,
  rows: Array<Record<string, unknown>>,
  preferredKeys?: string[],
): DatasetPreviewResponse {
  const sample = rows.slice(0, 6).map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, toPreviewValue(value)]),
    ) as Record<string, string | number | null>,
  );
  const keys =
    preferredKeys?.filter((key) => sample.some((row) => key in row)) ??
    Array.from(new Set(sample.flatMap((row) => Object.keys(row)))).slice(0, 8);

  return {
    dataset: {
      id: dataset.id,
      name: dataset.name,
      format: dataset.format,
      description: dataset.description,
      source: dataset.source,
    },
    columns: keys.map((key) => ({
      key,
      label: key,
      type: inferColumnType(sample.map((row) => row[key] ?? null)),
    })),
    rows: sample.map((row) => Object.fromEntries(keys.map((key) => [key, row[key] ?? null]))),
  };
}

function buildPdfPreview(
  dataset: DatasetCatalogRow,
  rows: Array<{ section: string; summary: string }>,
): DatasetPreviewResponse {
  return {
    dataset: {
      id: dataset.id,
      name: dataset.name,
      format: dataset.format,
      description: dataset.description,
      source: dataset.source,
    },
    columns: [
      { key: 'section', label: 'Section', type: 'string' },
      { key: 'summary', label: 'Summary', type: 'string' },
    ],
    rows,
  };
}

function readDatasetPreviews(): DatasetPreviewResponse[] {
  const povertyTrend = readPovertyTrendRows();
  const worldBankCsvPath = getRawWorldBankPath('API_MUS_DS2_en_csv_v2_26053.csv');
  const worldBankRecords = parse(fs.readFileSync(worldBankCsvPath, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as Array<Record<string, string>>;

  const worldBankCountryMetadataRecords = parse(fs.readFileSync(worldBankCountryMetadataPath, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as Array<Record<string, string>>;
  const worldBankIndicatorMetadataRecords = parse(fs.readFileSync(worldBankIndicatorMetadataPath, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as Array<Record<string, string>>;
  const povertyMusRecords = parse(fs.readFileSync(povertyMusCsvPath, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as Array<Record<string, string>>;
  const districtRdiRecords = parse(fs.readFileSync(districtRdiCsvPath, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as Array<Record<string, string>>;
  const geoJson = JSON.parse(readTextFile(mauritiusDistrictsGeoJsonPath)) as {
    features: Array<{ properties?: Record<string, unknown>; geometry?: { type?: string } }>;
  };
  const catalogById = new Map(datasetCatalog.map((dataset) => [dataset.id, dataset]));

  return [
    buildTabularPreview(catalogById.get('relative-poverty-series')!, povertyTrend as unknown as Array<Record<string, unknown>>, [
      'period',
      'percentage',
      'number',
    ]),
    buildTabularPreview(
      catalogById.get('poverty-indicators-cleaned')!,
      readWorkbookRows<Record<string, unknown>>(getRawSpreadsheetPath('data_indicators-of-relative-poverty-republic-of-mauritius.xlsx')),
    ),
    buildTabularPreview(
      catalogById.get('household-poverty-survey-2023')!,
      readWorkbookRows<Record<string, unknown>>(householdPovertySurveyPath),
    ),
    buildTabularPreview(
      catalogById.get('mauritius-poverty-dataset')!,
      readWorkbookRows<Record<string, unknown>>(getRawSpreadsheetPath('mauritius_poverty_dataset.xlsx')),
    ),
    buildTabularPreview(
      catalogById.get('mauritius-poverty-advanced')!,
      readWorkbookRows<Record<string, unknown>>(advancedWorkbookPath, 'Regression_Dataset'),
    ),
    buildTabularPreview(
      catalogById.get('mauritius-poverty-full-raw')!,
      readWorkbookRows<Record<string, unknown>>(fullRawWorkbookPath),
    ),
    buildTabularPreview(
      catalogById.get('relative-poverty-extracted-workbook')!,
      readWorkbookRows<Record<string, unknown>>(extractedWorkbookPath, 'Indicators_Long'),
    ),
    buildPdfPreview(catalogById.get('poverty-analysis-2001-02')!, [
      { section: 'Coverage', summary: 'Official report for the 2001/02 poverty survey period.' },
      { section: 'Use in project', summary: 'Used as an early benchmark in the long-run poverty trend discussion.' },
      { section: 'Type', summary: 'Historical report document.' },
      { section: 'Source', summary: 'Statistics Mauritius.' },
    ]),
    buildPdfPreview(catalogById.get('poverty-analysis-2012')!, [
      { section: 'Coverage', summary: 'Official report documenting the 2012 poverty benchmark.' },
      { section: 'Use in project', summary: 'Used to compare the rise in poverty before 2017 and 2023.' },
      { section: 'Type', summary: 'Historical report document.' },
      { section: 'Source', summary: 'Statistics Mauritius.' },
    ]),
    buildPdfPreview(catalogById.get('poverty-analysis-2017')!, [
      { section: 'Coverage', summary: 'Official report documenting the 2017 poverty survey findings.' },
      { section: 'Use in project', summary: 'Supports recent pre-2023 poverty comparisons.' },
      { section: 'Type', summary: 'Historical report document.' },
      { section: 'Source', summary: 'Statistics Mauritius.' },
    ]),
    buildPdfPreview(catalogById.get('poverty-analysis-2023')!, [
      { section: 'Coverage', summary: 'Official report documenting the 2023 poverty update.' },
      { section: 'Relative poverty', summary: 'Relative poverty rate decreased from 10.4% in 2017 to 8.4% in 2023.' },
      { section: 'Persons in poverty', summary: 'Estimated number of persons in relative poverty declined from 127.8 thousand in 2017 to 101.9 thousand in 2023.' },
      { section: 'Use in project', summary: 'Supports dashboard, analytics, and methodology explanations.' },
    ]),
    buildPdfPreview(catalogById.get('relative-development-index-1990')!, [
      { section: 'Coverage', summary: 'Historic RDI publication used as a long-run regional reference.' },
      { section: 'Use in project', summary: 'Provides background for regional development comparisons over time.' },
      { section: 'Type', summary: 'Regional development report.' },
      { section: 'Source', summary: 'Statistics Mauritius.' },
    ]),
    buildPdfPreview(catalogById.get('relative-development-index-2022')!, [
      { section: 'Coverage', summary: 'Official 2022 RDI publication.' },
      { section: 'Use in project', summary: 'Supports district vulnerability, map, and regional ranking analysis.' },
      { section: 'Type', summary: 'Regional development report.' },
      { section: 'Source', summary: 'Statistics Mauritius.' },
    ]),
    buildPdfPreview(catalogById.get('imf-selected-issues-2025')!, [
      { section: 'Coverage', summary: 'IMF country report section focused on Mauritius poverty and inequality issues.' },
      { section: 'Use in project', summary: 'Used as a supporting policy and interpretation source for poverty, inequality, and fiscal policy discussion.' },
      { section: 'Relevant themes', summary: 'Includes recent trends in poverty and inequality and discussion of addressing poverty through fiscal policy.' },
      { section: 'Source', summary: 'International Monetary Fund.' },
    ]),
    buildTabularPreview(
      catalogById.get('rdi-2011-workbook')!,
      readWorkbookRows<Record<string, unknown>>(rdi2011WorkbookPath),
    ),
    buildTabularPreview(
      catalogById.get('rdi-2022-clean-workbook')!,
      readWorkbookRows<Record<string, unknown>>(rdiWorkbookPath),
    ),
    buildTabularPreview(
      catalogById.get('rdi-comparison-workbook')!,
      readWorkbookRows<Record<string, unknown>>(rdiComparisonWorkbookPath),
    ),
    buildTabularPreview(
      catalogById.get('mauritius-district-boundaries')!,
      geoJson.features.map((feature) => ({
        shapeName: feature.properties?.shapeName ?? null,
        shapeISO: feature.properties?.shapeISO ?? null,
        geometryType: feature.geometry?.type ?? null,
      })),
    ),
    buildTabularPreview(catalogById.get('district-rdi-aggregated')!, districtRdiRecords),
    buildTabularPreview(catalogById.get('poverty-mus-csv')!, povertyMusRecords),
    buildTabularPreview(catalogById.get('world-bank-indicators')!, worldBankRecords, [
      'Country Name',
      'Country Code',
      'Indicator Name',
      'Indicator Code',
      '2020',
      '2021',
      '2022',
      '2023',
      '2024',
    ]),
    buildTabularPreview(catalogById.get('world-bank-country-metadata')!, worldBankCountryMetadataRecords),
    buildTabularPreview(catalogById.get('world-bank-indicator-metadata')!, worldBankIndicatorMetadataRecords),
  ];
}

export function seedDatabase(force = false) {
  const db = getDatabase();
  const statementMap = {
    insertPovertyTrend: db.prepare('INSERT INTO poverty_trend (period, percentage, number, sort_order) VALUES (?, ?, ?, ?)'),
    insertSupportMetric: db.prepare('INSERT INTO support_metrics (label, value, unit, year, context, sort_order) VALUES (?, ?, ?, ?, ?, ?)'),
    insertDemographic: db.prepare('INSERT INTO demographic_breakdowns (category, year, group_name, value, sort_order) VALUES (?, ?, ?, ?, ?)'),
    insertRegionalStat: db.prepare('INSERT INTO regional_stats (region, value, unit, year, note, rank) VALUES (?, ?, ?, ?, ?, ?)'),
    insertPublication: db.prepare('INSERT INTO publications (id, title, author, date, category, excerpt) VALUES (?, ?, ?, ?, ?, ?)'),
    insertRegression: db.prepare('INSERT INTO regression_series (period, poverty_rate, gdp, unemployment, inflation, gini, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    insertPrediction: db.prepare('INSERT INTO prediction_series (period, poverty_rate, rolling_average, trend_change, sort_order) VALUES (?, ?, ?, ?, ?)'),
    insertDataset: db.prepare('INSERT INTO dataset_catalog (id, name, format, records, last_updated, source, description) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    insertDatasetPreviewColumn: db.prepare('INSERT INTO dataset_preview_columns (dataset_id, column_key, label, type, sort_order) VALUES (?, ?, ?, ?, ?)'),
    insertDatasetPreviewRow: db.prepare('INSERT INTO dataset_preview_rows (dataset_id, row_json, sort_order) VALUES (?, ?, ?)'),
    insertMapRegion: db.prepare('INSERT INTO map_regions (region, map_key, rdi, change, rank, year) VALUES (?, ?, ?, ?, ?, ?)'),
    insertMapArea: db.prepare('INSERT INTO map_area_highlights (highlight_type, area, area_type, rdi_2022, rdi_2011, change) VALUES (?, ?, ?, ?, ?, ?)'),
  };

  const povertyTrend = readPovertyTrendRows();
  const supportMetrics = readSupportMetrics();
  const demographicBreakdowns = readDemographicBreakdowns();
  const regionalStats = readRegionalStats();
  const regressionSeries = readRegressionSeries();
  const predictionSeries = readPredictionSeries();
  const datasetPreviews = readDatasetPreviews();
  const mapAreaHighlights = readAreaHighlightRows();

  const seedAll = () => {
    db.exec('BEGIN');
    try {
    db.exec(`
      DELETE FROM poverty_trend;
      DELETE FROM support_metrics;
      DELETE FROM demographic_breakdowns;
      DELETE FROM regional_stats;
      DELETE FROM publications;
      DELETE FROM regression_series;
      DELETE FROM prediction_series;
      DELETE FROM dataset_catalog;
      DELETE FROM dataset_preview_columns;
      DELETE FROM dataset_preview_rows;
      DELETE FROM map_regions;
      DELETE FROM map_area_highlights;
    `);

    povertyTrend.forEach((row, index) => {
      statementMap.insertPovertyTrend.run(row.period, row.percentage, row.number, index + 1);
    });

    supportMetrics.forEach((row, index) => {
      statementMap.insertSupportMetric.run(row.label, row.value, row.unit, row.year, row.context, index + 1);
    });

    demographicBreakdowns.forEach((section) => {
      section.groups.forEach((group, index) => {
        statementMap.insertDemographic.run(section.category, section.year, group.group, group.value, index + 1);
      });
    });

    regionalStats.forEach((row) => {
      statementMap.insertRegionalStat.run(row.region, row.value, row.unit, row.year, row.note, row.rank);
      statementMap.insertMapRegion.run(row.region, normalizeName(row.region), Number((row.value / 100).toFixed(4)), null, row.rank, row.year);
    });

    publicationCatalog.forEach((row) => {
      statementMap.insertPublication.run(row.id, row.title, row.author, row.date, row.category, row.excerpt);
    });

    regressionSeries.forEach((row, index) => {
      statementMap.insertRegression.run(
        row.period,
        row.povertyRate,
        row.gdp,
        row.unemployment,
        row.inflation,
        row.gini,
        index + 1,
      );
    });

    predictionSeries.forEach((row, index) => {
      statementMap.insertPrediction.run(row.period, row.povertyRate, row.rollingAverage, row.trendChange, index + 1);
    });

    datasetCatalog.forEach((row) => {
      statementMap.insertDataset.run(row.id, row.name, row.format, row.records, row.lastUpdated, row.source, row.description);
    });

    datasetPreviews.forEach((preview) => {
      preview.columns.forEach((column, index) => {
        statementMap.insertDatasetPreviewColumn.run(
          preview.dataset.id,
          column.key,
          column.label,
          column.type,
          index + 1,
        );
      });

      preview.rows.forEach((row, index) => {
        statementMap.insertDatasetPreviewRow.run(preview.dataset.id, JSON.stringify(row), index + 1);
      });
    });

    mapAreaHighlights.forEach((row) => {
      statementMap.insertMapArea.run(row.highlightType, row.area, row.areaType, row.rdi2022, row.rdi2011, row.change);
    });
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };

  const shouldSeed =
    !fs.existsSync(env.paths.sqlite) ||
    (db.prepare('SELECT COUNT(*) AS count FROM poverty_trend').get() as unknown as { count: number }).count === 0 ||
    (db.prepare('SELECT COUNT(*) AS count FROM dataset_preview_rows').get() as unknown as { count: number }).count === 0 ||
    (db.prepare('SELECT COUNT(*) AS count FROM dataset_catalog').get() as unknown as { count: number }).count < datasetCatalog.length;

  if (force || shouldSeed) {
    seedAll();
  }
}
