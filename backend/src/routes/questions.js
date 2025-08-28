import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';
import { success, error } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../lib/logger.js';

const router = Router();

// 問題一覧
router.get('/', authenticateToken, async (req, res) => {
  try {
    logger.info(`問題一覧API呼び出し - year: ${req.query.year}, season: ${req.query.season}, limit: ${req.query.limit}`);
    const supabase = getSupabase();
    const { year, page = 1, limit = 20 } = req.query;
    
    // URLパラメータの英語を日本語に変換
    let season = req.query.season;
    if (season === 'spring') season = '春期';
    if (season === 'autumn') season = '秋期';

    let query = supabase
      .from('questions')
      .select(`
        id, question_number, question_type, question_text, has_image, created_at,
        exam_id,
        choices(id, choice_label, choice_text, has_image, is_table_format, table_headers, table_data, choice_images(image_url)),
        categories(id, name)
      `);

    // year, seasonで絞り込む場合は、まずexamのIDを取得
    if (year && season) {
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('id')
        .eq('year', year)
        .eq('season', season)
        .single();
      
      if (examError) throw new Error(`試験が見つかりません: ${examError.message}`);
      
      query = query.eq('exam_id', examData.id);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.order('question_number').range(offset, offset + parseInt(limit) - 1);

    const { data, error: queryError } = await query;
    if (queryError) throw new Error(`クエリエラー: ${queryError.message}`);

    // 各問題の選択肢をア、イ、ウ、エの順番にソート
    if (data && Array.isArray(data)) {
      logger.info('選択肢ソート処理開始');
      data.forEach(question => {
        if (question.choices && Array.isArray(question.choices)) {
          const before = question.choices.map(c => c.choice_label).join(',');
          question.choices.sort((a, b) => {
            const order = { 'ア': 1, 'イ': 2, 'ウ': 3, 'エ': 4 };
            return (order[a.choice_label] || 999) - (order[b.choice_label] || 999);
          });
          const after = question.choices.map(c => c.choice_label).join(',');
          if (before !== after) {
            logger.info(`問題${question.question_number}: 選択肢順序変更 ${before} → ${after}`);
          }
        }
      });
      logger.info('選択肢ソート処理完了');
    }

    logger.info(`問題一覧取得完了 - 件数: ${data?.length || 0}`);
    
    res.json(success(data, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: data.length
    }));
  } catch (err) {
    logger.error('問題一覧取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 問題詳細
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error: queryError } = await supabase
      .from('questions')
      .select(`
        *, exam:exams(year, season, exam_date),
        choices(id, choice_label, choice_text, is_correct),
        answer:answers(correct_choice, explanation)
      `)
      .eq('id', req.params.id)
      .single();

    if (queryError) {
      return res.status(404).json(error('問題が見つかりません'));
    }

    res.json(success(data));
  } catch (err) {
    logger.error('問題詳細取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

export default router;