import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';
import { success, error } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../lib/logger.js';

const router = Router();

// 問題セット保存
router.post('/question-set', authenticateToken, async (req, res) => {
  try {
    const { questionSet } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json(error('認証が必要です'));
    }

    if (!questionSet) {
      return res.status(400).json(error('問題セットデータが必要です'));
    }

    const supabase = getSupabase();
    
    // user_dataテーブルのquestion_setカラムを更新
    const { data, error: supabaseError } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        question_set: questionSet,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select();

    if (supabaseError) {
      logger.error('問題セット保存エラー:', supabaseError);
      return res.status(500).json(error('問題セットの保存に失敗しました'));
    }

    logger.info(`問題セット保存完了 - ユーザー: ${userId}, 問題数: ${questionSet.questions?.length || 0}`);
    res.json(success({ message: '問題セットを保存しました' }));

  } catch (err) {
    logger.error('問題セット保存エラー:', err);
    res.status(500).json(error('問題セット保存中にエラーが発生しました'));
  }
});

// 問題セット取得
router.get('/question-set', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json(error('認証が必要です'));
    }

    const supabase = getSupabase();
    
    const { data, error: supabaseError } = await supabase
      .from('user_data')
      .select('question_set')
      .eq('user_id', userId)
      .single();

    if (supabaseError) {
      // レコードが存在しない場合
      if (supabaseError.code === 'PGRST116') {
        return res.json(success({ questionSet: null }));
      }
      
      logger.error('問題セット取得エラー:', supabaseError);
      return res.status(500).json(error('問題セットの取得に失敗しました'));
    }

    res.json(success({ 
      questionSet: data?.question_set || null 
    }));

  } catch (err) {
    logger.error('問題セット取得エラー:', err);
    res.status(500).json(error('問題セット取得中にエラーが発生しました'));
  }
});

// 問題セット削除
router.delete('/question-set', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json(error('認証が必要です'));
    }

    const supabase = getSupabase();
    
    const { error: supabaseError } = await supabase
      .from('user_data')
      .update({ 
        question_set: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (supabaseError) {
      logger.error('問題セット削除エラー:', supabaseError);
      return res.status(500).json(error('問題セットの削除に失敗しました'));
    }

    logger.info(`問題セット削除完了 - ユーザー: ${userId}`);
    res.json(success({ message: '問題セットを削除しました' }));

  } catch (err) {
    logger.error('問題セット削除エラー:', err);
    res.status(500).json(error('問題セット削除中にエラーが発生しました'));
  }
});

// 問題セット内の現在位置更新
router.patch('/question-set/position', authenticateToken, async (req, res) => {
  try {
    const { currentIndex } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json(error('認証が必要です'));
    }

    if (currentIndex === undefined || currentIndex < 0) {
      return res.status(400).json(error('有効な問題番号が必要です'));
    }

    const supabase = getSupabase();
    
    // 現在の問題セットを取得
    const { data: userData, error: selectError } = await supabase
      .from('user_data')
      .select('question_set')
      .eq('user_id', userId)
      .single();

    if (selectError || !userData?.question_set) {
      return res.status(404).json(error('問題セットが見つかりません'));
    }

    // currentIndexを更新
    const updatedQuestionSet = {
      ...userData.question_set,
      currentIndex: currentIndex
    };

    const { error: updateError } = await supabase
      .from('user_data')
      .update({ 
        question_set: updatedQuestionSet,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      logger.error('問題位置更新エラー:', updateError);
      return res.status(500).json(error('問題位置の更新に失敗しました'));
    }

    res.json(success({ 
      message: '問題位置を更新しました',
      currentIndex: currentIndex
    }));

  } catch (err) {
    logger.error('問題位置更新エラー:', err);
    res.status(500).json(error('問題位置更新中にエラーが発生しました'));
  }
});

export default router;