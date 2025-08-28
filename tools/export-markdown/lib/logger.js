const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class Logger {
  constructor(options = {}) {
    this.showTimestamp = options.showTimestamp ?? true;
    this.level = options.level ?? 'info';
  }

  _formatMessage(level, message, emoji = '') {
    const timestamp = this.showTimestamp ? `[${new Date().toISOString()}] ` : '';
    const prefix = emoji ? `${emoji} ` : '';
    return `${timestamp}${prefix}${message}`;
  }

  _colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
  }

  info(message, ...args) {
    console.log(this._colorize(this._formatMessage('info', message, '📄'), 'blue'), ...args);
  }

  success(message, ...args) {
    console.log(this._colorize(this._formatMessage('success', message, '✅'), 'green'), ...args);
  }

  warn(message, ...args) {
    console.warn(this._colorize(this._formatMessage('warn', message, '⚠️'), 'yellow'), ...args);
  }

  error(message, ...args) {
    console.error(this._colorize(this._formatMessage('error', message, '❌'), 'red'), ...args);
  }

  progress(message, current, total, ...args) {
    const percentage = Math.round((current / total) * 100);
    const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    const progressMessage = `${message}: [${progressBar}] ${current}/${total} (${percentage}%)`;
    console.log(this._colorize(this._formatMessage('progress', progressMessage, '💾'), 'cyan'), ...args);
  }

  start(message, ...args) {
    console.log(this._colorize(this._formatMessage('start', message, '🚀'), 'bright'), ...args);
  }

  complete(message, ...args) {
    console.log(this._colorize(this._formatMessage('complete', message, '🎉'), 'green'), ...args);
  }

  search(message, ...args) {
    console.log(this._colorize(this._formatMessage('search', message, '🔍'), 'magenta'), ...args);
  }

  stats(message, ...args) {
    console.log(this._colorize(this._formatMessage('stats', message, '📊'), 'cyan'), ...args);
  }

  image(message, ...args) {
    console.log(this._colorize(this._formatMessage('image', message, '🖼️'), 'yellow'), ...args);
  }
}

export default Logger;