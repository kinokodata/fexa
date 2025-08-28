import { Router } from 'express';
import { getSupabase } from '../services/supabaseClient.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * 試験一覧取得
 * GET /api/exams
 */
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    // 各試験の問題数も取得
    const { data, error } = await supabase
      .from('exams')
      .select(`
        *,
        questions(count)
      `)
      .order('year', { ascending: false })
      .order('season', { ascending: false });

    if (error) {
      throw error;
    }

    // 問題数を整形
    const examsWithCount = data.map(exam => ({
      ...exam,
      question_count: exam.questions?.[0]?.count || 0,
      questions: undefined // questionsフィールドを削除
    }));

    res.json({
      success: true,
      data: examsWithCount
    });
  } catch (error) {
    logger.error('試験一覧取得エラー:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '試験一覧の取得に失敗しました',
        details: error.message
      }
    });
  }
});

/**
 * 試験詳細取得
 * GET /api/exams/:year/:season
 */
router.get('/:year/:season', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { year, season } = req.params;
    
    const { data, error } = await supabase
      .from('exams')
      .select(`
        *,
        questions(count)
      `)
      .eq('year', year)
      .eq('season', season)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            message: '指定された試験が見つかりません'
          }
        });
      }
      throw error;
    }

    // 問題数を整形
    const examWithCount = {
      ...data,
      question_count: data.questions?.[0]?.count || 0,
      questions: undefined
    };

    res.json({
      success: true,
      data: examWithCount
    });
  } catch (error) {
    logger.error('試験詳細取得エラー:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '試験詳細の取得に失敗しました',
        details: error.message
      }
    });
  }
});

export default router;