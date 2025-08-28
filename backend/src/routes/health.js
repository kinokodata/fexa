import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';
import { success, error } from '../utils/response.js';
import logger from '../lib/logger.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    if (req.query.detailed === 'true') {
      const supabase = getSupabase();
      const { error: dbError } = await supabase.from('exams').select('count').limit(1);
      health.database = { status: dbError ? 'unhealthy' : 'healthy' };
    }

    res.json(success(health));
  } catch (err) {
    logger.error('ヘルスチェックエラー:', err);
    res.status(500).json(error(err.message));
  }
});

export default router;