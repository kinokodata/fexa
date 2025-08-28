import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from './utils/logger.js';
import { initSupabase } from './services/supabaseClient.js';
import questionsRouter from './routes/questions.js';
import examsRouter from './routes/exams.js';
import importRouter from './routes/import.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import imagesRouter from './routes/images.js';

// 環境変数の読み込み
dotenv.config();

// ESモジュール対応のディレクトリ取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Expressアプリケーションの初期化
const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェアの設定
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// リクエストログ
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// ルーターの設定
app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/images', imagesRouter);
app.use('/api/exams', examsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/import', importRouter);

// 404エラーハンドリング
app.use((req, res) => {
  res.status(404).json({
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
    const supabase = await initSupabase();
    logger.info('Supabaseクライアントを初期化しました');

    // サーバー起動
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`サーバーが起動しました - ポート: ${PORT}`);
      logger.info(`環境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`ヘルスチェック: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('サーバーの起動に失敗しました:', error);
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