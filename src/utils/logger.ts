type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
}

const isDev = import.meta.env.DEV;

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

export const logger: Logger = {
  debug: (message, data) => {
    if (isDev) {
      console.debug(formatMessage('debug', message), data ?? '');
    }
  },
  info: (message, data) => {
    console.info(formatMessage('info', message), data ?? '');
  },
  warn: (message, data) => {
    console.warn(formatMessage('warn', message), data ?? '');
  },
  error: (message, data) => {
    console.error(formatMessage('error', message), data ?? '');
  },
};