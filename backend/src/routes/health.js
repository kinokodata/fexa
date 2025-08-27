import { Router } from 'express';
import { getSupabase } from '../services/supabaseClient.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * ヘルスチェックエンドポイント
 * GET /health
 */
router.get('/', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  };

  // 詳細チェックが要求された場合
  if (req.query.detailed === 'true') {
    try {
      const supabase = getSupabase();
      
      // データベース接続確認
      const { error: dbError } = await supabase
        .from('exams')
        .select('count')
        .limit(1);

      health.database = {
        status: dbError ? 'unhealthy' : 'healthy',
        ...(dbError && { error: dbError.message })
      };

      // ストレージ接続確認
      const { error: storageError } = await supabase
        .storage
        .listBuckets();

      health.storage = {
        status: storageError ? 'unhealthy' : 'healthy',
        ...(storageError && { error: storageError.message })
      };

    } catch (error) {
      logger.error('ヘルスチェックエラー:', error);
      health.status = 'degraded';
      health.error = error.message;
    }
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;