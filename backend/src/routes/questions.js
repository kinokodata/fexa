import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';
import { success, error } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../lib/logger.js';

const router = Router();

// 問題一覧
router.get('/', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { year, page = 1, limit = 20 } = req.query;
    
    // URLパラメータの英語を日本語に変換
    let season = req.query.season;
    if (season === 'spring') season = '春期';
    if (season === 'autumn') season = '秋期';

    let query = supabase
      .from('questions')
      .select(`
        id, question_number, question_type, question_text, has_image, has_choice_table, choice_table_type, choice_table_markdown, created_at, is_checked, checked_at, checked_by,
        exam_id,
        choices(id, choice_label, choice_text, has_image, choice_images(id, image_type)),
        categories(id, name),
        question_images(id, image_type)
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
      
      for (const question of data) {
        const exam = examsMap.get(question.exam_id);
        if (!exam) continue;
        
        const seasonCode = exam.season === '春期' ? 'h' : 'a';
        const timeCode = question.question_type === '午前' ? 'am' : 'pm';
        const basePath = `${exam.year}${seasonCode}/${timeCode}_q${question.question_number}`;
        
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
    const { data, error: queryError } = await supabase
      .from('questions')
      .select(`
        id, question_number, question_type, question_text, has_image, has_choice_table, choice_table_type, choice_table_markdown, created_at, updated_at, is_checked, checked_at, checked_by, exam_id, category_id, difficulty_level, pdf_page_number,
        exam:exams(year, season, exam_date),
        choices(id, choice_label, choice_text, is_correct, choice_images(id, image_type)),
        answer:answers(correct_choice, explanation),
        question_images(id, image_type)
      `)
      .eq('id', req.params.id)
      .single();

    if (queryError) {
      return res.status(404).json(error('問題が見つかりません'));
    }

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

    res.json(success(data));
  } catch (err) {
    logger.error('問題詳細取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

export default router;