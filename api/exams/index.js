import { getSupabase } from '../../backend/lib/supabase.js';
import { corsMiddleware } from '../../backend/middleware/cors.js';
import logger from '../../backend/lib/logger.js';

/**
 * 試験情報API
 * GET /api/exams - 試験一覧取得
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
    const supabase = getSupabase();

    // 試験一覧を問題数とともに取得
    const { data, error } = await supabase
      .from('exams')
      .select(`
        id,
        year,
        season,
        exam_date,
        created_at,
        questions:questions(count)
      `)
      .order('year', { ascending: false })
      .order('season', { ascending: false });

    if (error) {
      throw error;
    }

    // 問題数を集計
    const examsWithStats = data.map(exam => ({
      ...exam,
      question_count: exam.questions?.[0]?.count || 0,
      questions: undefined // 不要なデータを削除
    }));

    res.json({
      success: true,
      data: examsWithStats
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
}