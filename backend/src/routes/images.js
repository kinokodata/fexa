import { Router } from 'express';
import multer from 'multer';
import { getSupabase } from '../lib/supabase.js';
import { success, error } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../lib/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Multer設定（メモリストレージ）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // 画像ファイルのみ許可
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('画像ファイルのみアップロード可能です'), false);
    }
  }
});

// 画像アップロード
router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { questionId, choiceId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json(error('画像ファイルが必要です'));
    }

    if (!questionId || !choiceId) {
      return res.status(400).json(error('questionIdとchoiceIdが必要です'));
    }

    const supabase = getSupabase();
    
    // 問題情報を取得してファイルパスを生成
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .select('question_number, question_type, exam:exams(year, season)')
      .eq('id', questionId)
      .single();
    
    if (questionError) {
      throw new Error(`問題情報の取得に失敗しました: ${questionError.message}`);
    }
    
    // 画像用のUUIDを一つだけ生成（データベースIDとストレージファイル名で共通使用）
    const imageUuid = uuidv4();
    
    // ファイル名を生成
    const fileExtension = file.originalname.split('.').pop();
    const seasonCode = questionData.exam.season === '春期' ? 'h' : 'a';
    const timeCode = questionData.question_type === '午前' ? 'am' : 'pm';
    const fileName = `${questionData.exam.year}${seasonCode}/${timeCode}_q${questionData.question_number}/${imageUuid}.${fileExtension}`;

    // Supabase Storageにアップロード
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'fexa-images';
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // データベースに画像情報を保存
    let imageData;
    
    if (choiceId === 'question') {
      // 問題画像の場合
      imageData = {
        id: imageUuid,
        question_id: questionId,
        caption: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        image_type: fileExtension.toLowerCase()
      };
    } else {
      // 選択肢画像の場合
      imageData = {
        id: imageUuid,
        choice_id: choiceId,
        caption: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        image_type: fileExtension.toLowerCase()
      };
    }

    // 問題画像と選択肢画像で保存先テーブルを分ける
    const tableName = choiceId === 'question' ? 'question_images' : 'choice_images';
    const { data: dbData, error: dbError } = await supabase
      .from(tableName)
      .insert(imageData)
      .select()
      .single();

    if (dbError) {
      // データベースエラーの場合はアップロードした画像を削除
      await supabase.storage
        .from(bucketName)
        .remove([fileName]);
      throw dbError;
    }

    // 問題または選択肢のhas_imageフラグを更新
    if (choiceId === 'question') {
      await supabase
        .from('questions')
        .update({ has_image: true })
        .eq('id', questionId);
    } else {
      await supabase
        .from('choices')
        .update({ has_image: true })
        .eq('id', choiceId);
    }

    res.json(success({
      id: dbData.id,
      fileName: fileName
    }));

  } catch (err) {
    logger.error('画像アップロードエラー:', err);
    res.status(500).json(error('画像のアップロードに失敗しました'));
  }
});

// 画像削除
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();

    // データベースから画像情報を取得
    const { data: imageData, error: fetchError } = await supabase
      .from('question_images')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json(error('画像が見つかりません'));
      }
      throw fetchError;
    }

    // Storageから画像ファイルを削除
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'fexa-images';
    const fileName = imageData.image_url.split('/').pop();
    const { error: storageError } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (storageError) {
      logger.error('Storage削除エラー:', storageError);
    }

    // データベースから画像レコードを削除
    const { error: deleteError } = await supabase
      .from('question_images')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    res.json(success({ message: '画像を削除しました' }));

  } catch (err) {
    logger.error('画像削除エラー:', err);
    res.status(500).json(error('画像の削除に失敗しました'));
  }
});

export default router;