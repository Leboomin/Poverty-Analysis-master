import React from 'react';
import { Bot, ExternalLink, Globe, Send, Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatHistoryEntry, ChatSource } from '../../shared/api';
import { askChat } from './lib/api';
import { Layout } from './components/Layout';
import { Card, Headline, Label } from './components/UI';
import { cn } from './lib/utils';

interface ChatMessage {
  id: number;
  role: 'bot' | 'user';
  content: string;
  sources?: ChatSource[];
}

const CHAT_STORAGE_KEY = 'poverty-insights-chat-messages';
const CHAT_HISTORY_STORAGE_KEY = 'poverty-insights-chat-history';
const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    role: 'bot',
    content:
      "Welcome to Poverty Insights. Ask about the relative poverty trend, demographic breakdowns, regional disparities, or any poverty-related topic. I can also search the web if the local data doesn't cover it.",
  },
];

function readStoredMessages() {
  if (typeof window === 'undefined') {
    return DEFAULT_MESSAGES;
  }

  try {
    const raw = window.sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_MESSAGES;
    }

    const parsed = JSON.parse(raw) as ChatMessage[];
    return parsed.length > 0 ? parsed : DEFAULT_MESSAGES;
  } catch {
    return DEFAULT_MESSAGES;
  }
}

function readStoredHistory() {
  if (typeof window === 'undefined') {
    return [] as ChatHistoryEntry[];
  }

  try {
    const raw = window.sessionStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as ChatHistoryEntry[];
    }

    const storedMessages = readStoredMessages();
    return storedMessages
      .filter((message) => message.id !== 1)
      .map((message) => ({
        role: message.role === 'user' ? ('user' as const) : ('model' as const),
        content: message.content,
      }));
  } catch {
    return [] as ChatHistoryEntry[];
  }
}

function getFriendlyChatError(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Unable to process your question right now.';
  }

  if (
    error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError') ||
    error.message.includes('Request failed')
  ) {
    return 'The chat service is temporarily unreachable. Please try again in a moment.';
  }

  return error.message;
}

const TalkToData = () => {
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => readStoredMessages());
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const historyRef = React.useRef<ChatHistoryEntry[]>(readStoredHistory());
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const question = input.trim();
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: question }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askChat({ question, history: historyRef.current });

      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: question },
        { role: 'model', content: response.answer },
      ];
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(historyRef.current));
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          content: response.answer,
          sources: response.sources.length > 0 ? response.sources : undefined,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          content: getFriendlyChatError(error),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-10rem)] flex-col space-y-6 lg:h-[calc(100vh-12rem)]">
        <section className="shrink-0">
          <Label className="mb-1 block">Data Q&amp;A</Label>
          <Headline level={1} className="mb-2 text-2xl lg:text-4xl">
            Talk to the Data
          </Headline>
          <p className="hidden max-w-2xl text-xs text-on-surface/60 sm:block lg:text-sm">
            Ask questions about the poverty data or broader poverty topics, powered by Gemini with Google Search grounding.
          </p>
        </section>

        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border border-outline-variant p-0">
          <div className="shrink-0 border-b border-outline-variant bg-surface-container-low p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold lg:text-sm">Poverty Insights Assistant</h3>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-green-600 lg:text-[10px]">
                    Online - Gemini 2.5 Flash
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-surface-container-lowest p-4 lg:space-y-6 lg:p-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex max-w-[90%] gap-3 lg:max-w-3xl lg:gap-4',
                  message.role === 'user' ? 'ml-auto flex-row-reverse' : '',
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full lg:h-8 lg:w-8',
                    message.role === 'bot'
                      ? 'bg-primary text-white'
                      : 'bg-surface-container-highest text-on-surface',
                  )}
                >
                  {message.role === 'bot' ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div
                  className={cn(
                    'rounded-2xl p-3 text-xs leading-relaxed lg:p-4 lg:text-sm',
                    message.role === 'bot'
                      ? 'bg-surface-container-low text-on-surface'
                      : 'bg-primary text-white',
                  )}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4">{children}</ol>,
                      li: ({ children }) => <li>{children}</li>,
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      h1: ({ children }) => <h1 className="mb-1 text-base font-bold">{children}</h1>,
                      h2: ({ children }) => <h2 className="mb-1 text-sm font-bold">{children}</h2>,
                      h3: ({ children }) => <h3 className="mb-1 font-semibold">{children}</h3>,
                      code: ({ children }) => (
                        <code className="rounded bg-black/10 px-1 font-mono text-[11px]">
                          {children}
                        </code>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-outline-variant pl-3 italic opacity-70">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 space-y-1 border-t border-outline-variant pt-3">
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-on-surface/50">
                        <Globe size={10} /> Web Sources
                      </div>
                      {message.sources.map((source) =>
                        source.uri ? (
                          <a
                            key={source.uri}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex truncate items-center gap-1 text-[11px] text-primary hover:underline"
                          >
                            <ExternalLink size={10} className="shrink-0" />
                            <span className="truncate">{source.title}</span>
                          </a>
                        ) : (
                          <span key={source.title} className="block text-[11px] text-on-surface/60">
                            {source.title}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex max-w-3xl gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white lg:h-8 lg:w-8">
                  <Bot size={14} />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-surface-container-low p-3 text-xs text-on-surface/50 lg:p-4">
                  <span className="animate-pulse">Thinking</span>
                  <span className="flex gap-0.5">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 border-t border-outline-variant bg-surface-container-low p-3 lg:p-4">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void handleSend();
                }}
                placeholder="Ask about poverty trends, demographics, regions..."
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-3 pl-4 pr-12 text-base leading-6 outline-none transition-all focus:ring-2 focus:ring-primary/20 lg:py-3 lg:text-sm lg:leading-5"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isLoading}
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-container disabled:opacity-60"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-3 px-1">
              <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-on-surface/40">
                <Sparkles size={10} /> Gemini 2.5 Flash
              </div>
              <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-on-surface/40">
                <Globe size={10} /> Search grounding
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default TalkToData;
