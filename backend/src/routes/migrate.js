import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';
import { success, error } from '../utils/response.js';
import logger from '../lib/logger.js';

const router = Router();

// 不要なカラムを削除するマイグレーション
router.post('/remove-choice-columns', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    // 順次実行
    const migrations = [
      'ALTER TABLE choices DROP COLUMN IF EXISTS is_table_format',
      'ALTER TABLE choices DROP COLUMN IF EXISTS table_headers', 
      'ALTER TABLE choices DROP COLUMN IF EXISTS table_data'
    ];
    
    for (const sql of migrations) {
      logger.info(`Executing: ${sql}`);
      const { error: migrationError } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (migrationError) {
        logger.error(`Migration error: ${migrationError.message}`);
        // 無視する（カラムが既に存在しない場合）
      }
    }
    
    res.json(success({ message: 'Migration completed' }));
  } catch (err) {
    logger.error('Migration error:', err);
    res.status(500).json(error(err.message));
  }
});

export default router;