import React from 'react';
import { Eye } from 'lucide-react';
import type { DatasetListItem, DatasetPreviewResponse } from '../../shared/api';
import { fetchDatasetPreview, fetchDatasets } from './lib/api';
import { Layout } from './components/Layout';
import { Headline, Card, Label } from './components/UI';

function getUsageLabel(datasetId: string) {
  if (datasetId.includes('rdi') || datasetId.includes('district') || datasetId.includes('boundaries')) {
    return 'Regional Analysis / Map Analysis';
  }

  if (datasetId.includes('world-bank') || datasetId.includes('advanced') || datasetId.includes('poverty-mus')) {
    return 'Correlation Analysis / Regression Analysis';
  }

  if (datasetId.includes('poverty-analysis') || datasetId.includes('poverty-indicators') || datasetId.includes('relative-poverty')) {
    return 'Trend Analysis / Poverty Reporting';
  }

  return 'Supporting Dataset';
}

const DatasetExplorer = () => {
  const [datasets, setDatasets] = React.useState<DatasetListItem[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingDatasets, setIsLoadingDatasets] = React.useState(true);
  const [preview, setPreview] = React.useState<DatasetPreviewResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    fetchDatasets()
      .then((response) => {
        if (isMounted) {
          setDatasets(response.datasets);
          setIsLoadingDatasets(false);
        }
      })
      .catch((requestError: Error) => {
        if (isMounted) {
          setError(requestError.message);
          setIsLoadingDatasets(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedDataset = datasets.find((dataset) => dataset.id === selectedDatasetId);

  const handleDatasetChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = event.target.value;
    setSelectedDatasetId(id);
    setPreview(null);
    setError(null);

    if (!id) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetchDatasetPreview(id);
      setPreview(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load dataset preview.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <section>
          <Label className="mb-2 block">Structured Data Layer</Label>
          <Headline level={1} className="mb-4">Datasets</Headline>
          <p className="text-on-surface/60 max-w-2xl">
            This section provides an overview of the structured datasets used in the analysis. It supports transparency and reproducibility by showing the table structure and a small on-screen sample derived from the source publications.
          </p>
          {!isLoadingDatasets && datasets.length > 0 && (
            <p className="mt-3 text-sm text-on-surface/50">
              {datasets.length} structured datasets are currently documented across poverty indicators, reports, RDI materials, World Bank exports, and geospatial inputs.
            </p>
          )}
        </section>

        {error && (
          <Card className="border border-error/30">
            <Headline level={3} className="mb-2">Dataset request failed</Headline>
            <p className="text-sm text-on-surface/60">{error}</p>
          </Card>
        )}

        <div className="space-y-6">
          <div className="max-w-md">
            <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface/40">Select Dataset</Label>
            <select
              value={selectedDatasetId}
              onChange={handleDatasetChange}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
              disabled={isLoadingDatasets}
            >
              <option value="">{isLoadingDatasets ? 'Loading datasets...' : 'Choose a dataset...'}</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name} ({dataset.format.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <Card className="min-h-[500px] flex flex-col p-0 overflow-hidden">
            {selectedDataset ? (
              <>
                <div className="p-6 border-b border-outline-variant bg-surface-container-low flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <Headline level={3}>{selectedDataset.name}</Headline>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-on-surface/40 uppercase">{selectedDataset.format}</span>
                      <span className="text-[10px] text-on-surface/20">-</span>
                      <span className="text-[10px] font-bold text-on-surface/40 uppercase">{selectedDataset.size}</span>
                      <span className="text-[10px] text-on-surface/20">-</span>
                      <span className="text-[10px] font-bold text-on-surface/40 uppercase">{selectedDataset.records} Records</span>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div>
                        <Label className="mb-2 block">Description</Label>
                        <p className="text-sm text-on-surface/60">{selectedDataset.description}</p>
                      </div>
                      <div>
                        <Label className="mb-2 block">Source</Label>
                        <p className="text-sm text-on-surface/60">{selectedDataset.source}</p>
                      </div>
                      <div>
                        <Label className="mb-2 block">Used In</Label>
                        <p className="text-sm text-on-surface/60">{getUsageLabel(selectedDataset.id)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : preview ? (
                    <div>
                      <div className="border-b border-outline-variant bg-surface-container px-4 py-3">
                        <Label>Sample Records</Label>
                      </div>
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface-container sticky top-0">
                          <tr>
                            {preview.columns.map((column) => (
                              <th key={column.key} className="p-4 font-bold uppercase tracking-wider border-b border-outline-variant">
                                {column.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                          {preview.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-surface-container-low transition-colors">
                              {preview.columns.map((column) => (
                                <td key={column.key} className="p-4 font-medium">
                                  {row[column.key] === null || row[column.key] === '' ? '-' : String(row[column.key])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-on-surface/50">
                      Select a dataset to load its preview.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center text-on-surface/20 mb-4">
                  <Eye size={32} />
                </div>
                <Headline level={3} className="text-on-surface/40">Select a dataset to review</Headline>
                <p className="text-sm text-on-surface/30 mt-2 max-w-xs">
                  Choose a dataset from the dropdown above to inspect its metadata and view a small on-screen sample.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default DatasetExplorer;
