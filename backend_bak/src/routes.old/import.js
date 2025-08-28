import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getSupabase, uploadFile, initStorageBucket } from '../services/supabaseClient.js';
import pdfParser from '../services/pdfParser.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Multer設定（一時ファイル保存）
const upload = multer({
  dest: path.join(__dirname, '../../temp'),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB制限
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('PDFファイルのみアップロード可能です'));
    }
    cb(null, true);
  }
});

/**
 * PDFインポート
 * POST /api/import
 */
router.post('/', upload.single('pdf'), async (req, res) => {
  let tempFilePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'PDFファイルがアップロードされていません'
        }
      });
    }

    tempFilePath = req.file.path;
    const { year, season } = req.body;

    if (!year || !season) {
      return res.status(400).json({
        success: false,
        error: {
          message: '年度と季節を指定してください'
        }
      });
    }

    logger.info('PDFインポート開始', {
      filename: req.file.originalname,
      year,
      season
    });

    const supabase = getSupabase();

    // ストレージバケットの初期化
    await initStorageBucket();

    // 試験情報を取得または作成
    let { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('year', year)
      .eq('season', season)
      .single();

    if (examError && examError.code === 'PGRST116') {
      // 試験情報を新規作成
      const { data: newExam, error: createError } = await supabase
        .from('exams')
        .insert({ year, season })
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      exam = newExam;
    }

    // PDFファイルを読み込み
    const pdfBuffer = await fs.readFile(tempFilePath);

    // PDFをSupabase Storageにアップロード
    const storagePath = `${year}/${season}/${req.file.originalname}`;
    const pdfUrl = await uploadFile(
      { buffer: pdfBuffer, mimetype: 'application/pdf' },
      storagePath
    );

    // PDF解析
    const parseResult = await pdfParser.parsePdf(pdfBuffer, {
      year,
      season,
      filename: req.file.originalname
    });

    if (!parseResult.success) {
      throw new Error(parseResult.error || 'PDF解析に失敗しました');
    }

    // 問題をデータベースに保存
    const savedQuestions = [];
    const errors = [];

    for (const questionData of parseResult.questions) {
      try {
        // 既存の問題をチェック
        const { data: existing } = await supabase
          .from('questions')
          .select('id')
          .eq('exam_id', exam.id)
          .eq('question_number', questionData.questionNumber)
          .eq('question_type', questionData.questionType)
          .single();

        if (existing) {
          logger.warn(`問題${questionData.questionNumber}は既に存在します`);
          continue;
        }

        // 問題を作成
        const { data: question, error: questionError } = await supabase
          .from('questions')
          .insert({
            exam_id: exam.id,
            question_number: questionData.questionNumber,
            question_type: questionData.questionType,
            question_text: questionData.questionText,
            pdf_page_number: questionData.pageNumber
          })
          .select()
          .single();

        if (questionError) {
          throw questionError;
        }

        // 選択肢を作成
        if (questionData.choices && questionData.choices.length > 0) {
          const choiceData = questionData.choices.map(choice => ({
            question_id: question.id,
            choice_label: choice.label,
            choice_text: choice.text
          }));

          const { error: choicesError } = await supabase
            .from('choices')
            .insert(choiceData);

          if (choicesError) {
            logger.error(`問題${questionData.questionNumber}の選択肢作成エラー:`, choicesError);
          }
        }

        savedQuestions.push(question);
      } catch (error) {
        logger.error(`問題${questionData.questionNumber}の保存エラー:`, error);
        errors.push({
          questionNumber: questionData.questionNumber,
          error: error.message
        });
      }
    }

    // インポート履歴を保存
    const { error: historyError } = await supabase
      .from('import_history')
      .insert({
        exam_id: exam.id,
        pdf_filename: req.file.originalname,
        pdf_url: pdfUrl,
        import_status: errors.length === 0 ? 'success' : 'partial',
        total_questions: parseResult.questions.length,
        imported_questions: savedQuestions.length,
        error_log: errors.length > 0 ? JSON.stringify(errors) : null
      });

    if (historyError) {
      logger.error('インポート履歴保存エラー:', historyError);
    }

    res.json({
      success: true,
      data: {
        exam,
        pdfUrl,
        stats: {
          ...parseResult.stats,
          imported: savedQuestions.length,
          errors: errors.length
        },
        savedQuestions: savedQuestions.slice(0, 5), // 最初の5件のみ返す
        errors
      }
    });

  } catch (error) {
    logger.error('PDFインポートエラー:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'PDFのインポートに失敗しました',
        details: error.message
      }
    });
  } finally {
    // 一時ファイルの削除
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (error) {
        logger.error('一時ファイル削除エラー:', error);
      }
    }
  }
});

/**
 * インポート履歴取得
 * GET /api/import/history
 */
router.get('/history', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data, error, count } = await supabase
      .from('import_history')
      .select(`
        *,
        exam:exams(year, season)
      `, { count: 'exact' })
      .order('imported_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

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
    logger.error('インポート履歴取得エラー:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'インポート履歴の取得に失敗しました',
        details: error.message
      }
    });
  }
});

export default router;