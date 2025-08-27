import winston from 'winston';

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, errors } = format;

// ログフォーマットの定義
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}] ${message}`;
  
  // メタデータがある場合は追加
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  // スタックトレースがある場合は追加
  if (stack) {
    msg += `\n${stack}`;
  }
  
  return msg;
});

// ロガーの作成
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // コンソール出力
    new transports.Console({
      format: combine(
        colorize(),
        logFormat
      )
    })
  ]
});

// 本番環境ではファイル出力も追加
if (process.env.NODE_ENV === 'production') {
  logger.add(new transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
  
  logger.add(new transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
}

export default logger;