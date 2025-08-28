import express from 'express';
import dotenv from 'dotenv';
import { corsMiddleware } from './middleware/cors.js';
import logger from './lib/logger.js';
import { getSupabase } from './lib/supabase.js';

// ルーターのインポート
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import examsRouter from './routes/exams.js';
import questionsRouter from './routes/questions.js';
import imagesRouter from './routes/images.js';

// 環境変数の読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェアの設定
app.use(corsMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// リクエストログ
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - Query: ${JSON.stringify(req.query)}`);
  next();
});

// ルーターの設定
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/exams', examsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/images', imagesRouter);

// 404エラーハンドリング
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'エンドポイントが見つかりません',
      path: req.path
    }
  });
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  logger.error('エラーが発生しました:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'サーバーエラーが発生しました';
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    }
  });
});

// サーバーの起動
const startServer = async () => {
  try {
    // Supabaseクライアントの初期化確認
    getSupabase();
    logger.info('Supabaseクライアントを初期化しました');

    // サーバー起動
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`ローカルAPIサーバー起動 - http://localhost:${PORT}`);
      logger.info(`環境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`ヘルスチェック: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    logger.error('サーバーの起動に失敗しました:', err);
    process.exit(1);
  }
};

// シグナルハンドリング（グレースフルシャットダウン）
process.on('SIGTERM', () => {
  logger.info('SIGTERMを受信しました。グレースフルシャットダウンを開始します...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINTを受信しました。グレースフルシャットダウンを開始します...');
  process.exit(0);
});

// 未処理のPromiseリジェクション対応
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未処理のPromiseリジェクション:', reason);
});

// サーバー起動
startServer();