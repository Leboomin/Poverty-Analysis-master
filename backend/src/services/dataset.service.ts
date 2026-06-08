import { readDatasetCatalog, readDatasetPreview } from '../repositories/dataset.repository.ts';

export function getDatasetList() {
  return readDatasetCatalog();
}

export function getDatasetPreview(datasetId: string) {
  return readDatasetPreview(datasetId);
}
