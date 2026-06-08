import fs from 'node:fs';
import type { DatasetListItem, DatasetPreviewResponse } from '../../../shared/api/index.ts';
import { getDatabase } from '../db/connection.ts';
import {
  getProcessedDataPath,
  getRawGeospatialPath,
  getRawPovertyReportPath,
  getRawSpreadsheetPath,
  getRawWorldBankPath,
} from '../utils/data-paths.utils.ts';

const worldBankCsvPath = getRawWorldBankPath('API_MUS_DS2_en_csv_v2_26053.csv');

const filePathByDatasetId: Record<string, string | null> = {
  'relative-poverty-series': getProcessedDataPath('poverty_trend.json'),
  'poverty-indicators-cleaned': getRawSpreadsheetPath('data_indicators-of-relative-poverty-republic-of-mauritius.xlsx'),
  'household-poverty-survey-2023': getRawSpreadsheetPath('HS_Poverty_Jun23_210623.xlsx'),
  'mauritius-poverty-dataset': getRawSpreadsheetPath('mauritius_poverty_dataset.xlsx'),
  'mauritius-poverty-advanced': getRawSpreadsheetPath('mauritius_poverty_ADVANCED.xlsx'),
  'mauritius-poverty-full-raw': getRawSpreadsheetPath('mauritius_poverty_FULL_raw.xlsx'),
  'relative-poverty-extracted-workbook': getRawSpreadsheetPath('mauritius_relative_poverty_extracted_workbook.xlsx'),
  'poverty-analysis-2001-02': getRawPovertyReportPath('Poverty Analysis report 200102.pdf'),
  'poverty-analysis-2012': getRawPovertyReportPath('Poverty Analysis 2012.pdf'),
  'poverty-analysis-2017': getRawPovertyReportPath('Poverty_Analysis_Rep_2017.pdf'),
  'poverty-analysis-2023': getRawPovertyReportPath('Poverty_Analysis_Report _2023.pdf'),
  'relative-development-index-1990': getRawPovertyReportPath('Relative Development Index 1990.pdf'),
  'relative-development-index-2022': getRawPovertyReportPath('Relative Development Index 2022.pdf'),
  'imf-selected-issues-2025': null,
  'rdi-2011-workbook': getRawSpreadsheetPath('RDI2011.xlsx'),
  'rdi-2022-clean-workbook': getRawSpreadsheetPath('rdi_2022_clean_final.xlsx'),
  'rdi-comparison-workbook': getRawSpreadsheetPath('rdi_comparison_clean.xlsx'),
  'mauritius-district-boundaries': getRawGeospatialPath('mauritius_districts.geojson'),
  'district-rdi-aggregated': getRawGeospatialPath('rdi_district_aggregated_mauritius_rodrigues.csv'),
  'poverty-mus-csv': getRawSpreadsheetPath('poverty_mus.csv'),
  'world-bank-indicators': worldBankCsvPath,
  'world-bank-country-metadata': getRawWorldBankPath('Metadata_Country_API_MUS_DS2_en_csv_v2_26053.csv'),
  'world-bank-indicator-metadata': getRawWorldBankPath('Metadata_Indicator_API_MUS_DS2_en_csv_v2_26053.csv'),
};

function formatSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(1)} ${units[index]}`;
}

export function readDatasetCatalog(): DatasetListItem[] {
  const db = getDatabase();
  const catalog = db
    .prepare(
      'SELECT id, name, format, records, last_updated AS lastUpdated, source, description FROM dataset_catalog ORDER BY name',
    )
    .all() as Omit<DatasetListItem, 'size'>[];

  return catalog.map((dataset) => {
    const filePath = filePathByDatasetId[dataset.id];
    const size = filePath && fs.existsSync(filePath) ? formatSize(fs.statSync(filePath).size) : 'N/A';

    return {
      ...dataset,
      size,
    };
  });
}

function getDatabasePreview(datasetId: string): DatasetPreviewResponse | null {
  const db = getDatabase();
  const dataset = db
    .prepare(
      'SELECT id, name, format, description, source FROM dataset_catalog WHERE id = ?',
    )
    .get(datasetId) as
    | {
        id: string;
        name: string;
        format: string;
        description: string;
        source: string;
      }
    | undefined;

  if (!dataset) {
    return null;
  }

  const columns = db
    .prepare(
      'SELECT column_key AS key, label, type FROM dataset_preview_columns WHERE dataset_id = ? ORDER BY sort_order',
    )
    .all(datasetId) as unknown as DatasetPreviewResponse['columns'];
  const rows = db
    .prepare('SELECT row_json AS rowJson FROM dataset_preview_rows WHERE dataset_id = ? ORDER BY sort_order')
    .all(datasetId) as Array<{ rowJson: string }>;

  if (!columns.length && !rows.length) {
    return null;
  }

  return {
    dataset,
    columns,
    rows: rows.map((row) => JSON.parse(row.rowJson) as Record<string, string | number | null>),
  };
}

export function readDatasetPreview(datasetId: string) {
  return getDatabasePreview(datasetId);
}
