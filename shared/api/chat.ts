export interface ChatHistoryEntry {
  role: 'user' | 'model';
  content: string;
}

export interface ChatRequest {
  question: string;
  history?: ChatHistoryEntry[];
}

export interface ChatSource {
  title: string;
  file?: string;
  uri?: string;
  page?: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  dataPoints?: Array<Record<string, string | number>>;
}
