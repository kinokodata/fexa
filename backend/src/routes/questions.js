import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';
import { success, error } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../lib/logger.js';

const router = Router();

// 軽量問題リスト（ナビゲーション用）
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { year, season } = req.query;
    
    // URLパラメータを日本語に変換
    let convertedSeason = season;
    if (season === 'spring' || season === 'a') convertedSeason = '春期';
    if (season === 'autumn' || season === 'h') convertedSeason = '秋期';

    // 軽量クエリ - サイドバー表示に必要な最小限のフィールド
    let query = supabase
      .from('questions')
      .select(`
        id, 
        question_number, 
        question_text,
        is_checked,
        has_image,
        has_choice_table,
        choices(id, choice_label, choice_text, has_image, choice_images(id)),
        question_images(id)
      `);

    // year, seasonで絞り込む場合は、まずexamのIDを取得
    if (year && convertedSeason) {
      logger.info(`軽量問題リスト検索: year=${year}, season=${convertedSeason}`);
      
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('id')
        .eq('year', year)
        .eq('season', convertedSeason);
      
      if (examError) {
        logger.error('軽量リスト - 試験検索エラー:', examError);
        throw new Error(`試験が見つかりません: ${examError.message}`);
      }
      
      if (!examData || examData.length === 0) {
        logger.warn(`軽量リスト - 指定された試験が見つからない: ${year}年${convertedSeason}`);
        throw new Error(`指定された試験が見つかりません: ${year}年${convertedSeason}`);
      }
      
      const exam = examData[0];
      query = query.eq('exam_id', exam.id);
    }

    // 問題番号順でソート
    query = query.order('question_number');

    const { data, error: queryError } = await query;
    if (queryError) {
      logger.error('軽量問題リスト取得エラー:', queryError);
      throw new Error(`クエリエラー: ${queryError.message}`);
    }

    logger.info(`軽量問題リスト取得成功: ${data?.length || 0}件`);
    res.json(success(data || []));
  } catch (err) {
    logger.error('軽量問題リスト取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 問題一覧
router.get('/', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { year, page = 1, limit = 20 } = req.query;
    
    // URLパラメータを日本語に変換
    let season = req.query.season;
    if (season === 'spring' || season === 'a') season = '春期';
    if (season === 'autumn' || season === 'h') season = '秋期';

    // まずはカテゴリなしでクエリを試行（デバッグ用）
    let query = supabase
      .from('questions')
      .select(`
        id, question_number, question_type, question_text, has_image, has_choice_table, choice_table_type, choice_table_markdown, created_at, is_checked, checked_at, checked_by, explanation,
        exam_id,
        choices(id, choice_label, choice_text, has_image, is_correct, choice_images(id, image_type)),
        question_images(id, image_type)
      `);

    // year, seasonで絞り込む場合は、まずexamのIDを取得
    if (year && season) {
      logger.info(`試験検索: year=${year}, season=${season} (original: ${req.query.season})`);
      
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('id, year, season')
        .eq('year', year)
        .eq('season', season);
      
      logger.info('試験検索結果:', { examData, examError });
      
      if (examError) throw new Error(`試験が見つかりません: ${examError.message}`);
      if (!examData || examData.length === 0) {
        // 利用可能な試験を取得してログに出力
        const { data: availableExams } = await supabase
          .from('exams')
          .select('id, year, season')
          .order('year', { ascending: false });
        logger.info('利用可能な試験一覧:', availableExams);
        throw new Error(`指定された試験が見つかりません: ${year}年${season}`);
      }
      
      const exam = examData[0]; // 最初の結果を使用
      query = query.eq('exam_id', exam.id);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.order('question_number').range(offset, offset + parseInt(limit) - 1);

    const { data, error: queryError } = await query;
    if (queryError) throw new Error(`クエリエラー: ${queryError.message}`);

    // 画像URLを署名付きURLに変換
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'fexa-images';
    if (data && Array.isArray(data)) {
      // 各問題のexam情報を取得
      const examIds = [...new Set(data.map(q => q.exam_id))];
      const { data: examsData } = await supabase
        .from('exams')
        .select('id, year, season')
        .in('id', examIds);
      
      const examsMap = new Map(examsData?.map(e => [e.id, e]) || []);

      // 各問題のタグ情報を取得
      const questionIds = data.map(q => q.id);
      const { data: tagData } = await supabase
        .from('question_tags')
        .select(`
          question_id, 
          relevance_score, 
          is_primary,
          tags(id, name, display_name, description)
        `)
        .in('question_id', questionIds)
        .order('relevance_score', { ascending: false });
      
      const tagsMap = new Map();
      if (tagData) {
        tagData.forEach(item => {
          if (!tagsMap.has(item.question_id)) {
            tagsMap.set(item.question_id, []);
          }
          if (item.tags) {
            tagsMap.get(item.question_id).push({
              id: item.tags.id,
              name: item.tags.name,
              display_name: item.tags.display_name,
              description: item.tags.description,
              relevance_score: item.relevance_score,
              is_primary: item.is_primary
            });
          }
        });
      }
      
      // 各問題のカテゴリ情報も取得（後方互換性のため）
      const { data: categoryData } = await supabase
        .from('question_categories')
        .select('question_id, categories(id, name)')
        .in('question_id', questionIds);
      
      const categoriesMap = new Map();
      if (categoryData) {
        categoryData.forEach(item => {
          if (!categoriesMap.has(item.question_id)) {
            categoriesMap.set(item.question_id, []);
          }
          if (item.categories) {
            categoriesMap.get(item.question_id).push(item.categories);
          }
        });
      }
      
      for (const question of data) {
        const exam = examsMap.get(question.exam_id);
        if (!exam) continue;
        
        const seasonCode = exam.season === '春期' ? 'h' : 'a';
        const timeCode = question.question_type === '午前' ? 'am' : 'pm';
        const basePath = `${exam.year}${seasonCode}/${timeCode}_q${question.question_number}`;
        
        // タグ情報を追加
        question.tags = tagsMap.get(question.id) || [];
        
        // カテゴリ情報を追加（後方互換性のため）
        question.categories = categoriesMap.get(question.id) || [];
        
        // 問題画像のサインドURL生成
        if (question.question_images && question.question_images.length > 0) {
          for (const image of question.question_images) {
            const storagePath = `${basePath}/${image.id}.${image.image_type}`;
            const { data: signedUrl } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(storagePath, 60 * 60 * 24); // 24時間有効
            if (signedUrl) {
              image.image_url = signedUrl.signedUrl;
            }
          }
        }
        
        // 選択肢画像のサインドURL生成
        if (question.choices) {
          for (const choice of question.choices) {
            if (choice.choice_images && choice.choice_images.length > 0) {
              for (const image of choice.choice_images) {
                const storagePath = `${basePath}/${image.id}.${image.image_type}`;
                const { data: signedUrl } = await supabase.storage
                  .from(bucketName)
                  .createSignedUrl(storagePath, 60 * 60 * 24); // 24時間有効
                if (signedUrl) {
                  image.image_url = signedUrl.signedUrl;
                }
              }
            }
          }
        }
      }
    }

    // 各問題の選択肢をア、イ、ウ、エの順番にソート
    if (data && Array.isArray(data)) {
      data.forEach(question => {
        if (question.choices && Array.isArray(question.choices)) {
          question.choices.sort((a, b) => {
            const order = { 'ア': 1, 'イ': 2, 'ウ': 3, 'エ': 4 };
            return (order[a.choice_label] || 999) - (order[b.choice_label] || 999);
          });
        }
      });
    }

    
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
    logger.info(`個別問題取得開始: ID=${req.params.id}`);
    const { data, error: queryError } = await supabase
      .from('questions')
      .select(`
        id, question_number, question_type, question_text, has_image, has_choice_table, choice_table_type, choice_table_markdown, created_at, is_checked, checked_at, checked_by, explanation,
        exam_id,
        exam:exams(year, season),
        choices(id, choice_label, choice_text, has_image, is_correct, choice_images(id, image_type)),
        question_images(id, image_type)
      `)
      .eq('id', req.params.id)
      .single();

    if (queryError) {
      logger.error(`個別問題取得エラー: ID=${req.params.id}`, queryError);
      return res.status(404).json(error('問題が見つかりません'));
    }

    if (!data) {
      logger.warn(`個別問題が見つからない: ID=${req.params.id}`);
      return res.status(404).json(error('問題が見つかりません'));
    }

    logger.info(`個別問題取得成功: ID=${req.params.id}, question_number=${data.question_number}`);

    // 画像のサインドURLを生成
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'fexa-images';
    const seasonCode = data.exam.season === '春期' ? 'h' : 'a';
    const timeCode = data.question_type === '午前' ? 'am' : 'pm';
    const basePath = `${data.exam.year}${seasonCode}/${timeCode}_q${data.question_number}`;
    
    // 問題画像のサインドURLを生成
    if (data.question_images && data.question_images.length > 0) {
      for (let image of data.question_images) {
        const storagePath = `${basePath}/${image.id}.${image.image_type}`;
        const { data: urlData } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(storagePath, 60 * 60 * 24); // 24時間
        
        if (urlData) {
          image.image_url = urlData.signedUrl;
        }
      }
    }
    
    // 選択肢画像のサインドURLを生成
    if (data.choices) {
      for (let choice of data.choices) {
        if (choice.choice_images && choice.choice_images.length > 0) {
          for (let image of choice.choice_images) {
            const storagePath = `${basePath}/${image.id}.${image.image_type}`;
            const { data: urlData } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(storagePath, 60 * 60 * 24); // 24時間
            
            if (urlData) {
              image.image_url = urlData.signedUrl;
            }
          }
          // フロントエンドで期待される形式に変更
          choice.images = choice.choice_images;
        }
      }
    }

    // タグ情報を取得して追加
    const { data: tagData } = await supabase
      .from('question_tags')
      .select(`
        relevance_score, 
        is_primary,
        tags(id, name, display_name, description)
      `)
      .eq('question_id', req.params.id)
      .order('relevance_score', { ascending: false });
    
    data.tags = [];
    if (tagData) {
      data.tags = tagData.map(item => ({
        id: item.tags.id,
        name: item.tags.name,
        display_name: item.tags.display_name,
        description: item.tags.description,
        relevance_score: item.relevance_score,
        is_primary: item.is_primary
      }));
    }

    // answersテーブルが存在しないため、この処理は削除

    // 選択肢をア、イ、ウ、エの順番にソート
    if (data.choices && Array.isArray(data.choices)) {
      data.choices.sort((a, b) => {
        const order = { 'ア': 1, 'イ': 2, 'ウ': 3, 'エ': 4 };
        return (order[a.choice_label] || 999) - (order[b.choice_label] || 999);
      });
    }

    res.json(success(data));
  } catch (err) {
    logger.error('問題詳細取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 問題チェック完了
router.patch('/:id/check', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { checked_by } = req.body;

    if (!checked_by) {
      return res.status(400).json(error('checked_by は必須です'));
    }

    const { data, error: updateError } = await supabase
      .from('questions')
      .update({
        is_checked: true,
        checked_at: new Date().toISOString(),
        checked_by: checked_by
      })
      .eq('id', id)
      .select('id, is_checked, checked_at, checked_by')
      .single();

    if (updateError) {
      logger.error('問題チェック更新エラー:', updateError);
      return res.status(500).json(error('チェック状態の更新に失敗しました'));
    }

    if (!data) {
      return res.status(404).json(error('問題が見つかりません'));
    }

    logger.info(`問題 ${id} がチェック完了されました (by: ${checked_by})`);
    res.json(success(data));
  } catch (err) {
    logger.error('問題チェック完了エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 正答更新エンドポイント
router.patch('/:id/correct-answer', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { correctChoiceId } = req.body;

    if (!correctChoiceId) {
      return res.status(400).json(error('正答の選択肢IDが必要です'));
    }

    // まず、該当問題のすべての選択肢を取得
    const { data: choices, error: fetchError } = await supabase
      .from('choices')
      .select('id, question_id')
      .eq('question_id', id);

    if (fetchError) {
      logger.error('選択肢取得エラー:', fetchError);
      return res.status(500).json(error('選択肢の取得に失敗しました'));
    }

    if (!choices || choices.length === 0) {
      return res.status(404).json(error('選択肢が見つかりません'));
    }

    // 選択された選択肢が該当問題に属しているか確認
    const selectedChoice = choices.find(c => c.id === correctChoiceId);
    if (!selectedChoice) {
      return res.status(400).json(error('指定された選択肢がこの問題に属していません'));
    }

    // トランザクション的に更新
    // 1. まず全ての選択肢のis_correctをfalseに
    const { error: resetError } = await supabase
      .from('choices')
      .update({ is_correct: false })
      .eq('question_id', id);

    if (resetError) {
      logger.error('選択肢リセットエラー:', resetError);
      return res.status(500).json(error('選択肢のリセットに失敗しました'));
    }

    // 2. 指定された選択肢のみis_correctをtrueに
    const { data: updatedChoice, error: updateError } = await supabase
      .from('choices')
      .update({ is_correct: true })
      .eq('id', correctChoiceId)
      .select()
      .single();

    if (updateError) {
      logger.error('正答更新エラー:', updateError);
      return res.status(500).json(error('正答の更新に失敗しました'));
    }

    logger.info(`問題 ${id} の正答を選択肢 ${correctChoiceId} に更新しました`);
    res.json(success({
      message: '正答を更新しました',
      data: updatedChoice
    }));
  } catch (err) {
    logger.error('正答更新エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 問題文更新エンドポイント
router.patch('/:id/question-text', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { questionText } = req.body;

    if (!questionText || typeof questionText !== 'string') {
      return res.status(400).json(error('問題文が必要です'));
    }

    // 問題文を更新
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('questions')
      .update({ question_text: questionText })
      .eq('id', id)
      .select('id, question_text')
      .single();

    if (updateError) {
      logger.error('問題文更新エラー:', updateError);
      return res.status(500).json(error('問題文の更新に失敗しました'));
    }

    if (!updatedQuestion) {
      return res.status(404).json(error('問題が見つかりません'));
    }

    logger.info(`問題 ${id} の問題文を更新しました`);
    res.json(success({
      message: '問題文を更新しました',
      data: updatedQuestion
    }));
  } catch (err) {
    logger.error('問題文更新エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 解説更新エンドポイント
router.patch('/:id/explanation', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { explanation } = req.body;

    if (typeof explanation !== 'string') {
      return res.status(400).json(error('解説が必要です'));
    }

    // 解説を更新（空文字列も許可）
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('questions')
      .update({ explanation: explanation })
      .eq('id', id)
      .select('id, explanation')
      .single();

    if (updateError) {
      logger.error('解説更新エラー:', updateError);
      return res.status(500).json(error('解説の更新に失敗しました'));
    }

    if (!updatedQuestion) {
      return res.status(404).json(error('問題が見つかりません'));
    }

    logger.info(`問題 ${id} の解説を更新しました`);
    res.json(success({
      message: '解説を更新しました',
      data: updatedQuestion
    }));
  } catch (err) {
    logger.error('解説更新エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 表形式選択肢更新エンドポイント
router.patch('/:id/choice-table', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { choiceTableMarkdown } = req.body;

    if (typeof choiceTableMarkdown !== 'string') {
      return res.status(400).json(error('選択肢表のマークダウンは文字列である必要があります'));
    }

    // 表形式選択肢のマークダウンを更新
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('questions')
      .update({ choice_table_markdown: choiceTableMarkdown })
      .eq('id', id)
      .select('id, choice_table_markdown, has_choice_table')
      .single();

    if (updateError) {
      logger.error('表形式選択肢更新エラー:', updateError);
      return res.status(500).json(error('表形式選択肢の更新に失敗しました'));
    }

    if (!updatedQuestion) {
      return res.status(404).json(error('問題が見つかりません'));
    }

    logger.info(`問題 ${id} の表形式選択肢を更新しました`);
    res.json(success({
      message: '表形式選択肢を更新しました',
      data: updatedQuestion
    }));
  } catch (err) {
    logger.error('表形式選択肢更新エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 表形式選択肢削除エンドポイント
router.delete('/:id/choice-table', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    // 表形式選択肢を削除（nullに設定）し、has_choice_tableをfalseに
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('questions')
      .update({ 
        choice_table_markdown: null,
        has_choice_table: false,
        choice_table_type: null
      })
      .eq('id', id)
      .select('id, choice_table_markdown, has_choice_table, choice_table_type')
      .single();

    if (updateError) {
      logger.error('表形式選択肢削除エラー:', updateError);
      return res.status(500).json(error('表形式選択肢の削除に失敗しました'));
    }

    if (!updatedQuestion) {
      return res.status(404).json(error('問題が見つかりません'));
    }

    logger.info(`問題 ${id} の表形式選択肢を削除しました`);
    res.json(success({
      message: '表形式選択肢を削除しました',
      data: updatedQuestion
    }));
  } catch (err) {
    logger.error('表形式選択肢削除エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 選択肢テキスト更新エンドポイント
router.patch('/:id/choices/:choiceId', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id, choiceId } = req.params;
    const { choiceText } = req.body;

    if (typeof choiceText !== 'string') {
      return res.status(400).json(error('選択肢テキストは文字列である必要があります'));
    }

    // まず選択肢が指定された問題に属しているか確認
    const { data: choice, error: checkError } = await supabase
      .from('choices')
      .select('id, question_id')
      .eq('id', choiceId)
      .eq('question_id', id)
      .single();

    if (checkError || !choice) {
      logger.error('選択肢確認エラー:', checkError);
      return res.status(404).json(error('選択肢が見つかりません'));
    }

    // 選択肢テキストを更新
    const { data: updatedChoice, error: updateError } = await supabase
      .from('choices')
      .update({ choice_text: choiceText })
      .eq('id', choiceId)
      .select('id, choice_text, choice_label')
      .single();

    if (updateError) {
      logger.error('選択肢更新エラー:', updateError);
      return res.status(500).json(error('選択肢の更新に失敗しました'));
    }

    logger.info(`問題 ${id} の選択肢 ${choiceId} を更新しました`);
    res.json(success({
      message: '選択肢を更新しました',
      data: updatedChoice
    }));
  } catch (err) {
    logger.error('選択肢更新エラー:', err);
    res.status(500).json(error(err.message));
  }
});

export default router;