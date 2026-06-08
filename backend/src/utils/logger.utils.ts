type LogLevel = 'info' | 'warn' | 'error';

function format(level: LogLevel, message: string, meta?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (meta === undefined) {
    return [prefix, message] as const;
  }

  return [prefix, message, meta] as const;
}

export function logInfo(message: string, meta?: unknown) {
  console.log(...format('info', message, meta));
}

export function logWarn(message: string, meta?: unknown) {
  console.warn(...format('warn', message, meta));
}

export function logError(message: string, meta?: unknown) {
  console.error(...format('error', message, meta));
}
