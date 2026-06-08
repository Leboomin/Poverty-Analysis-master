import type {
  AnalyticsResponse,
  ApiError,
  ChatRequest,
  ChatResponse,
  DashboardResponse,
  DatasetListResponse,
  DatasetPreviewResponse,
  MapResponse,
  PovertyPredictionResponse,
} from '../../../shared/api';

async function parseResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  let payload: unknown = null;

  if (raw) {
    try {
      payload = JSON.parse(raw) as unknown;
    } catch {
      if (!response.ok) {
        throw new Error('The server returned an unexpected response.');
      }

      throw new Error('Unable to read the server response.');
    }
  }

  if (!response.ok) {
    const apiError = payload as ApiError;
    throw new Error(apiError.error?.message ?? 'Request failed.');
  }

  return payload as T;
}

export async function fetchDashboard() {
  return parseResponse<DashboardResponse>(await fetch('/api/dashboard'));
}

export async function fetchDatasets() {
  return parseResponse<DatasetListResponse>(await fetch('/api/datasets'));
}

export async function fetchDatasetPreview(datasetId: string) {
  return parseResponse<DatasetPreviewResponse>(await fetch(`/api/datasets/${datasetId}/preview`));
}

export async function askChat(request: ChatRequest) {
  return parseResponse<ChatResponse>(
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }),
  );
}

export async function fetchAnalytics() {
  return parseResponse<AnalyticsResponse>(await fetch('/api/analytics'));
}

export async function fetchAnalyticsPrediction() {
  return parseResponse<PovertyPredictionResponse>(await fetch('/api/analytics/prediction'));
}

export async function fetchMapData() {
  return parseResponse<MapResponse>(await fetch('/api/map'));
}
