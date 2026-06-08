import { GoogleGenAI } from '@google/genai';
import type { ChatRequest, ChatResponse } from '../../../shared/api/index.ts';
import { env } from '../config/env.ts';
import {
  readDemographicHighlights,
  readPovertyTrend,
  readRegionalStats,
  readSupportingMetrics,
} from '../repositories/dashboard.repository.ts';
import { AppError } from '../utils/error.utils.ts';

function buildDataContext(): string {
  const trend = readPovertyTrend();
  const metrics = readSupportingMetrics();
  const demographics = readDemographicHighlights();
  const regional = readRegionalStats();

  return JSON.stringify({ trend, metrics, demographics, regional }, null, 2);
}

function buildSystemInstruction() {
  return `You are a poverty data analyst assistant for the Poverty Analysis Portal, a dashboard built on official poverty statistics.

You have access to the following live dashboard data:

${buildDataContext()}

Rules:
- Answer questions about poverty trends, demographics, regional disparities, economic indicators, and social welfare topics.
- When answering from the data above, cite specific numbers, periods, and regions.
- If a question cannot be answered from the data alone, use Google Search to find relevant information (for example global poverty context, policy comparisons, or economic research).
- Refuse questions that are completely unrelated to poverty, economics, or social welfare.
- Keep answers concise, factual, and grounded in evidence.`;
}

export async function answerQuestion(request: ChatRequest): Promise<ChatResponse> {
  if (!env.geminiApiKey) {
    throw new AppError(
      503,
      'CHAT_UNAVAILABLE',
      'The AI assistant is temporarily unavailable. Please try again shortly.',
    );
  }

  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

  const history = (request.history ?? []).map((entry) => ({
    role: entry.role as 'user' | 'model',
    parts: [{ text: entry.content }],
  }));

  const contents = [...history, { role: 'user' as const, parts: [{ text: request.question }] }];

  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: buildSystemInstruction(),
        tools: [{ googleSearch: {} }],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AppError(
      502,
      'AI_SERVICE_ERROR',
      env.mode === 'production'
        ? 'The AI assistant could not generate a response right now. Please try again.'
        : `AI service error: ${message}`,
    );
  }

  const answer = response.text ?? 'No response received.';

  const sources: ChatResponse['sources'] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    for (const chunk of chunks) {
      if (chunk.web?.uri) {
        sources.push({ title: chunk.web.title ?? chunk.web.uri, uri: chunk.web.uri });
      }
    }
  }

  return { answer, sources };
}
