import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';
import { success, error } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../lib/logger.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error: queryError } = await supabase
      .from('exams')
      .select('id, year, season, exam_date, created_at')
      .order('year', { ascending: false });

    if (queryError) throw queryError;
    res.json(success(data));
  } catch (err) {
    logger.error('試験一覧取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

export default router;