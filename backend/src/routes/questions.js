import { Router } from 'express';
import { getSupabase } from '../services/supabaseClient.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * 問題一覧取得
 * GET /api/questions
 */
router.get('/', async (req, res) => {
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
        choices(id, choice_label, choice_text),
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
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

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
router.post('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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