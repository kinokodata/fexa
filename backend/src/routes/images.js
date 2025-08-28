import { Router } from 'express';
import multer from 'multer';
import { getSupabase } from '../../lib/supabase.js';
import logger from '../../lib/logger.js';
import { authenticateToken } from '../middleware/auth.js';
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

/**
 * 画像アップロード
 * POST /api/images/upload
 */
router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { questionId, choiceId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: { message: '画像ファイルが必要です' }
      });
    }

    if (!questionId || !choiceId) {
      return res.status(400).json({
        success: false,
        error: { message: 'questionIdとchoiceIdが必要です' }
      });
    }

    const supabase = getSupabase();
    
    // ファイル名を生成
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${questionId}/${choiceId}/${uuidv4()}.${fileExtension}`;

    // Supabase Storageにアップロード
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('question-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // 画像URLを取得
    const { data: urlData } = supabase.storage
      .from('question-images')
      .getPublicUrl(fileName);

    // データベースに画像情報を保存
    let imageData = {
      question_id: questionId,
      image_url: urlData.publicUrl,
      image_type: choiceId === 'question' ? 'question' : 'choice',
      original_filename: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      uploaded_at: new Date().toISOString()
    };

    // 選択肢の画像の場合はchoice_idも設定
    if (choiceId !== 'question') {
      imageData.choice_id = choiceId;
    }

    const { data: dbData, error: dbError } = await supabase
      .from('question_images')
      .insert(imageData)
      .select()
      .single();

    if (dbError) {
      // データベースエラーの場合はアップロードした画像を削除
      await supabase.storage
        .from('question-images')
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

    res.json({
      success: true,
      data: {
        id: dbData.id,
        imageUrl: urlData.publicUrl,
        fileName: fileName
      }
    });

  } catch (error) {
    logger.error('画像アップロードエラー:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '画像のアップロードに失敗しました',
        details: error.message
      }
    });
  }
});

/**
 * 画像削除
 * DELETE /api/images/:id
 */
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
        return res.status(404).json({
          success: false,
          error: { message: '画像が見つかりません' }
        });
      }
      throw fetchError;
    }

    // Storageから画像ファイルを削除
    const fileName = imageData.image_url.split('/').pop();
    const { error: storageError } = await supabase.storage
      .from('question-images')
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

    res.json({
      success: true,
      message: '画像を削除しました'
    });

  } catch (error) {
    logger.error('画像削除エラー:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '画像の削除に失敗しました',
        details: error.message
      }
    });
  }
});

export default router;