import { getSupabase } from '../../backend/lib/supabase.js';
import { corsMiddleware } from '../../backend/middleware/cors.js';
import logger from '../../backend/lib/logger.js';

/**
 * 問題詳細API（読み取り専用）
 * GET /api/questions/[id] - 問題詳細取得
 */
export default async function handler(req, res) {
  // CORS設定
  if (corsMiddleware(req, res)) return;

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: { message: '問題IDが指定されていません' }
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: { message: 'このAPIは読み取り専用です。GET メソッドのみ対応しています。' }
    });
  }

  try {
    const supabase = getSupabase();
    return await getQuestionById(req, res, supabase, id);
  } catch (error) {
    logger.error('問題詳細取得エラー:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '問題詳細の取得に失敗しました',
        details: error.message
      }
    });
  }
}

/**
 * 問題詳細取得
 */
async function getQuestionById(req, res, supabase, id) {
  const { data, error } = await supabase
    .from('questions')
    .select(`
      *,
      exam:exams(year, season, exam_date),
      category:categories(name, description),
      choices(id, choice_label, choice_text, is_correct),
      images:question_images(id, image_url, image_type, caption),
      answer:answers(correct_choice, explanation, reference_url)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: { message: '指定された問題が見つかりません' }
      });
    }
    throw error;
  }

  res.json({
    success: true,
    data
  });
}

