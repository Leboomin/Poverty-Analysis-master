export interface DatasetListItem {
  id: string;
  name: string;
  format: string;
  size: string;
  records: number;
  lastUpdated: string;
  source: string;
  description: string;
}

export interface DatasetListResponse {
  datasets: DatasetListItem[];
}

export type DatasetColumnType = 'string' | 'number' | 'integer';

export interface DatasetPreviewColumn {
  key: string;
  label: string;
  type: DatasetColumnType;
}

export interface DatasetPreviewResponse {
  dataset: {
    id: string;
    name: string;
    format: string;
    description: string;
    source: string;
  };
  columns: DatasetPreviewColumn[];
  rows: Array<Record<string, string | number | null>>;
}
