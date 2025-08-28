import { Router } from 'express';
import { getSupabase } from '../services/supabaseClient.js';
import logger from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * 問題一覧取得
 * GET /api/questions
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
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
        *,
        exam:exams!inner(year, season),
        category:categories(name),
        choices(
          id, 
          choice_label, 
          choice_text,
          has_image,
          is_table_format,
          table_headers,
          table_data
        ),
        answer:answers(correct_choice, explanation)
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

    // 各問題の選択肢をア、イ、ウ、エの順番にソート
    logger.info(`ソート処理開始 - 問題数: ${data?.length}`);
    
    if (data && Array.isArray(data)) {
      data.forEach((question, index) => {
        logger.info(`問題${question.question_number}: 選択肢=${question.choices?.length || 0}個`);
        
        if (question.choices && Array.isArray(question.choices)) {
          const beforeLabels = question.choices.map(c => c.choice_label);
          logger.info(`問題${question.question_number} ソート前:`, beforeLabels);
          
          // ソート処理
          question.choices.sort((a, b) => {
            const order = { 'ア': 1, 'イ': 2, 'ウ': 3, 'エ': 4 };
            const orderA = order[a.choice_label] ?? 999;
            const orderB = order[b.choice_label] ?? 999;
            return orderA - orderB;
          });
          
          const afterLabels = question.choices.map(c => c.choice_label);
          logger.info(`問題${question.question_number} ソート後:`, afterLabels);
          
          // ソートが変わったか確認
          const changed = beforeLabels.join('') !== afterLabels.join('');
          if (changed) {
            logger.warn(`問題${question.question_number}: ソートで順番が変更されました`);
          }
        } else {
          logger.warn(`問題${question.question_number}: 選択肢データが異常`, question.choices);
        }
      });
    } else {
      logger.error('データが配列ではありません:', { type: typeof data, data });
    }

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });
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
});

/**
 * 問題詳細取得
 * GET /api/questions/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        exam:exams(year, season, exam_date),
        category:categories(name, description),
        choices(
          id, 
          choice_label, 
          choice_text, 
          is_correct,
          has_image,
          is_table_format,
          table_headers,
          table_data,
          images:choice_images(id, image_url, caption)
        ),
        images:question_images(id, image_url, image_type, caption),
        answer:answers(correct_choice, explanation, reference_url)
      `)
      .eq('id', id)
      .single();

    // 選択肢をア、イ、ウ、エの順番にソート
    logger.info(`問題詳細API - 問題ID: ${id}, 問題番号: ${data?.question_number}`);
    
    if (data && data.choices && Array.isArray(data.choices)) {
      // ソート前の順番を確認
      logger.info('ソート前の選択肢順:', data.choices.map(c => c.choice_label));
      
      data.choices.sort((a, b) => {
        const orderMap = { 'ア': 1, 'イ': 2, 'ウ': 3, 'エ': 4 };
        const orderA = orderMap[a.choice_label] || 999;
        const orderB = orderMap[b.choice_label] || 999;
        logger.info(`比較: ${a.choice_label}(${orderA}) vs ${b.choice_label}(${orderB}) = ${orderA - orderB}`);
        return orderA - orderB;
      });
      
      // ソート後の順番を確認
      logger.info('ソート後の選択肢順:', data.choices.map(c => c.choice_label));
      
      // デバッグ：選択肢画像情報を確認
      logger.info('選択肢の画像情報:', data.choices.map(c => ({
        label: c.choice_label,
        has_image: c.has_image,
        images: c.images
      })));
    } else {
      logger.warn('選択肢データなし', { data: !!data, choices: data?.choices });
    }

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            message: '指定された問題が見つかりません'
          }
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });
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
});

/**
 * 問題作成
 * POST /api/questions
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { 
      exam_id,
      question_number,
      question_type,
      question_text,
      category_id,
      choices,
      answer
    } = req.body;

    // 問題を作成
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        exam_id,
        question_number,
        question_type,
        question_text,
        category_id
      })
      .select()
      .single();

    if (questionError) {
      throw questionError;
    }

    // 選択肢を作成
    if (choices && choices.length > 0) {
      const choiceData = choices.map(choice => ({
        question_id: question.id,
        choice_label: choice.label,
        choice_text: choice.text,
        is_correct: choice.is_correct || false
      }));

      const { error: choicesError } = await supabase
        .from('choices')
        .insert(choiceData);

      if (choicesError) {
        logger.error('選択肢作成エラー:', choicesError);
      }
    }

    // 解答を作成
    if (answer) {
      const { error: answerError } = await supabase
        .from('answers')
        .insert({
          question_id: question.id,
          correct_choice: answer.correct_choice,
          explanation: answer.explanation
        });

      if (answerError) {
        logger.error('解答作成エラー:', answerError);
      }
    }

    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    logger.error('問題作成エラー:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '問題の作成に失敗しました',
        details: error.message
      }
    });
  }
});

/**
 * 問題更新
 * PUT /api/questions/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            message: '指定された問題が見つかりません'
          }
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('問題更新エラー:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '問題の更新に失敗しました',
        details: error.message
      }
    });
  }
});

/**
 * 問題削除
 * DELETE /api/questions/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: '問題を削除しました'
    });
  } catch (error) {
    logger.error('問題削除エラー:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '問題の削除に失敗しました',
        details: error.message
      }
    });
  }
});

export default router;