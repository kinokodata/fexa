import { getSupabase } from '../../backend/lib/supabase.js';
import { corsMiddleware } from '../../backend/middleware/cors.js';
import logger from '../../backend/lib/logger.js';

/**
 * 問題API（読み取り専用）
 * GET /api/questions - 問題一覧取得
 */
export default async function handler(req, res) {
  // CORS設定
  if (corsMiddleware(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: { message: 'このAPIは読み取り専用です。GET メソッドのみ対応しています。' }
    });
  }

  try {
    const supabase = getSupabase();
    return await getQuestions(req, res, supabase);
  } catch (error) {
    logger.error('問題一覧取得エラー:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '問題一覧の取得に失敗しました',
        details: error.message
      }
    });
  }
}

/**
 * 問題一覧取得
 */
async function getQuestions(req, res, supabase) {
  const { 
    year, 
    season, 
    question_type,
    category_id,
    page = 1, 
    limit = 20 
  } = req.query;

  // クエリビルダー
  let query = supabase
    .from('questions')
    .select(`
      id,
      question_number,
      question_type,
      question_text,
      pdf_page_number,
      has_image,
      created_at,
      exam:exams!inner(year, season),
      category:categories(name),
      choices(id, choice_label, choice_text),
      answer:answers(correct_choice)
    `);

  // フィルタリング
  if (year && season) {
    query = query.eq('exam.year', year).eq('exam.season', season);
  }
  if (question_type) {
    query = query.eq('question_type', question_type);
  }
  if (category_id) {
    query = query.eq('category_id', category_id);
  }

  // ページング
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query = query
    .order('question_number', { ascending: true })
    .range(offset, offset + parseInt(limit) - 1);

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  res.json({
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || data.length
    }
  });
}

