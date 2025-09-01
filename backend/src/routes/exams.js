import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';
import { success, error } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../lib/logger.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    
    // 試験一覧を取得
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('id, year, season, exam_date, created_at')
      .order('year', { ascending: false });

    if (examsError) throw examsError;

    // 各試験の問題数とチェック済み数を集計
    const examsWithProgress = await Promise.all(exams.map(async (exam) => {
      // 問題総数とチェック済み数を取得
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, is_checked')
        .eq('exam_id', exam.id);
      
      if (questionsError) {
        logger.error(`試験 ${exam.id} の問題取得エラー:`, questionsError);
        return {
          ...exam,
          total_questions: 0,
          checked_questions: 0
        };
      }

      const totalQuestions = questions ? questions.length : 0;
      const checkedQuestions = questions ? questions.filter(q => q.is_checked).length : 0;

      return {
        ...exam,
        total_questions: totalQuestions,
        checked_questions: checkedQuestions
      };
    }));

    res.json(success(examsWithProgress));
  } catch (err) {
    logger.error('試験一覧取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

export default router;