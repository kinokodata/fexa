import { getSupabase } from '../backend/lib/supabase.js';
import { corsMiddleware } from '../backend/middleware/cors.js';
import logger from '../backend/lib/logger.js';

/**
 * ヘルスチェックAPI
 * GET /api/health
 */
export default async function handler(req, res) {
  // CORS設定
  if (corsMiddleware(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: { message: 'メソッドが許可されていません' }
    });
  }

  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };

    // 詳細チェック
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
        logger.error('ヘルスチェック詳細確認エラー:', error);
        health.status = 'degraded';
        health.error = error.message;
      }
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: true,
      data: health
    });

  } catch (error) {
    logger.error('ヘルスチェックエラー:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'ヘルスチェックに失敗しました',
        details: error.message
      }
    });
  }
}