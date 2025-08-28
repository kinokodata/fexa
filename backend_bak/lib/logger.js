// Vercel環境用の軽量ロガー
export class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || 'info';
  }

  info(message, metadata = {}) {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...metadata
    }));
  }

  error(message, error = null) {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      error: error?.message || error,
      stack: error?.stack
    }));
  }

  warn(message, metadata = {}) {
    console.warn(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      message,
      ...metadata
    }));
  }
}

const logger = new Logger();
export default logger;