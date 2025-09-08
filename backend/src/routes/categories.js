import express from 'express';
import { getSupabase } from '../lib/supabase.js';
import { success, error } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../lib/logger.js';

const router = express.Router();

// カテゴリ階層を取得（フロントエンド用）
router.get('/hierarchy', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { exam_code } = req.query;
    
    logger.info(`🔍 カテゴリ階層取得開始: exam_code=${exam_code}`);

    // カテゴリ階層を取得（レベル順）
    const { data: categories, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .order('level', { ascending: true })
      .order('name', { ascending: true });

    if (fetchError) {
      logger.error('カテゴリ階層取得エラー:', fetchError);
      return res.status(500).json(error('カテゴリ階層の取得に失敗しました'));
    }

    logger.info(`✅ カテゴリ階層取得成功: ${categories?.length || 0}件`);
    res.json(success(categories || []));
  } catch (err) {
    logger.error('カテゴリ階層取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// カテゴリ名で検索
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { name, exact = false } = req.query;
    
    if (!name) {
      return res.status(400).json(error('検索するカテゴリ名が必要です'));
    }

    logger.info(`🔍 カテゴリ名検索開始: name="${name}", exact=${exact}`);

    let query = supabase
      .from('categories')
      .select('*');

    if (exact === 'true') {
      // 完全一致検索
      query = query.eq('name', name);
    } else {
      // 部分一致検索
      query = query.ilike('name', `%${name}%`);
    }

    query = query.order('level', { ascending: true })
                 .order('name', { ascending: true });

    const { data: categories, error: fetchError } = await query;

    if (fetchError) {
      logger.error('カテゴリ名検索エラー:', fetchError);
      return res.status(500).json(error('カテゴリの検索に失敗しました'));
    }

    logger.info(`✅ カテゴリ名検索結果: ${categories?.length || 0}件`);
    
    // 結果をログに詳細表示
    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        logger.info(`  - ${cat.name} (ID: ${cat.id}, Level: ${cat.level}, Path: ${cat.path || 'N/A'})`);
      });
    }

    res.json(success(categories || []));
  } catch (err) {
    logger.error('カテゴリ名検索エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// レベル別カテゴリ取得
router.get('/level/:level', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { level } = req.params;
    const { parent_id } = req.query;

    let query = supabase
      .from('categories')
      .select('*')
      .eq('level', parseInt(level))
      .order('display_order', { ascending: true });

    // 親IDでフィルタ（大分類以降で使用）
    if (parent_id) {
      query = query.eq('parent_id', parent_id);
    } else if (parseInt(level) === 1) {
      // 分野の場合はparent_idがnullのもの
      query = query.is('parent_id', null);
    }

    const { data: categories, error: fetchError } = await query;

    if (fetchError) {
      logger.error('レベル別カテゴリ取得エラー:', fetchError);
      return res.status(500).json(error('カテゴリの取得に失敗しました'));
    }

    res.json(success(categories));
  } catch (err) {
    logger.error('レベル別カテゴリ取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 特定カテゴリの詳細取得（知識項目含む）
router.get('/:categoryId', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { categoryId } = req.params;

    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (fetchError) {
      logger.error('カテゴリ詳細取得エラー:', fetchError);
      return res.status(404).json(error('カテゴリが見つかりません'));
    }

    res.json(success(category));
  } catch (err) {
    logger.error('カテゴリ詳細取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 階層構造全体を取得
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { level, parent_id } = req.query;

    let query = supabase
      .from('categories')
      .select('*');

    // レベルでフィルタ
    if (level) {
      query = query.eq('level', parseInt(level));
    }

    // 親IDでフィルタ
    if (parent_id) {
      query = query.eq('parent_id', parent_id);
    } else if (level && parseInt(level) === 1) {
      query = query.is('parent_id', null);
    }

    const { data: categories, error: fetchError } = await query
      .order('level', { ascending: true })
      .order('display_order', { ascending: true });

    if (fetchError) {
      logger.error('カテゴリ一覧取得エラー:', fetchError);
      return res.status(500).json(error('カテゴリの取得に失敗しました'));
    }

    // 階層クエリの場合は階層構造を構築
    if (!level && !parent_id) {
      const buildHierarchy = (parentId = null) => {
        return categories
          .filter(cat => cat.parent_id === parentId)
          .map(cat => ({
            ...cat,
            children: buildHierarchy(cat.id)
          }));
      };

      const hierarchicalCategories = buildHierarchy();
      res.json(success(hierarchicalCategories));
    } else {
      res.json(success(categories));
    }
  } catch (err) {
    logger.error('カテゴリ階層取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// タグ経由でのカテゴリ検索による問題取得
router.get('/search/questions', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { 
      field_name, 
      major_name, 
      medium_name, 
      minor_name, 
      knowledges,
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // カテゴリ条件からタグ経由で問題を検索
    let categoryQuery = supabase
      .from('categories')
      .select('id');

    // 階層条件を適用
    if (minor_name) {
      // 小分類が指定された場合
      categoryQuery = categoryQuery
        .eq('level', 4)
        .eq('name', minor_name);
      
      // 知識項目が指定された場合はさらにフィルタ
      if (knowledges) {
        const knowledgeList = knowledges.split(',').map(k => k.trim());
        // knowledgesカラムに含まれるかチェック（部分一致）
        const knowledgeConditions = knowledgeList.map(k => 
          `knowledges.ilike.%${k}%`
        ).join(',');
        categoryQuery = categoryQuery.or(knowledgeConditions);
      }
    } else if (medium_name) {
      // 中分類が指定された場合
      categoryQuery = categoryQuery
        .eq('level', 3)
        .eq('name', medium_name);
    } else if (major_name) {
      // 大分類が指定された場合
      categoryQuery = categoryQuery
        .eq('level', 2)
        .eq('name', major_name);
    } else if (field_name) {
      // 分野が指定された場合
      categoryQuery = categoryQuery
        .eq('level', 1)
        .eq('name', field_name);
    } else {
      return res.status(400).json(error('検索条件を指定してください'));
    }

    const { data: targetCategories, error: categoryError } = await categoryQuery;

    if (categoryError) {
      logger.error('カテゴリ検索エラー:', categoryError);
      return res.status(500).json(error('カテゴリの検索に失敗しました'));
    }

    if (!targetCategories || targetCategories.length === 0) {
      return res.json(success([], {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0
      }));
    }

    const categoryIds = targetCategories.map(cat => cat.id);

    // カテゴリに紐づくタグを取得
    const { data: tags, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .in('category_id', categoryIds);

    if (tagError) {
      logger.error('タグ取得エラー:', tagError);
      return res.status(500).json(error('タグの取得に失敗しました'));
    }

    if (!tags || tags.length === 0) {
      return res.json(success([], {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0
      }));
    }

    const tagIds = tags.map(tag => tag.id);

    // タグに紐づく問題を取得
    const { data: questionTags, error: questionTagError } = await supabase
      .from('question_tags')
      .select('question_id')
      .in('tag_id', tagIds);

    if (questionTagError) {
      logger.error('問題タグ取得エラー:', questionTagError);
      return res.status(500).json(error('問題タグの取得に失敗しました'));
    }

    if (!questionTags || questionTags.length === 0) {
      return res.json(success([], {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0
      }));
    }

    // 重複を除去
    const uniqueQuestionIds = [...new Set(questionTags.map(qt => qt.question_id))];

    // 問題詳細を取得
    const { data: questions, error: questionError } = await supabase
      .from('questions')
      .select(`
        *,
        choices(*),
        question_images(*),
        exam:exams(*)
      `)
      .in('id', uniqueQuestionIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (questionError) {
      logger.error('問題取得エラー:', questionError);
      return res.status(500).json(error('問題の取得に失敗しました'));
    }

    res.json(success(questions, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: uniqueQuestionIds.length
    }));
  } catch (err) {
    logger.error('カテゴリ検索による問題取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// カテゴリによる問題検索（直接的なカテゴリ関連付けを使用）
router.get('/search/direct', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { 
      field_name, 
      major_name, 
      medium_name, 
      minor_name,
      page = 1, 
      limit = 50  // デフォルトを50に設定
    } = req.query;

    // 少なくとも1つの条件が必要
    if (!field_name && !major_name && !medium_name && !minor_name) {
      return res.status(400).json(error('検索条件を指定してください'));
    }

    // 階層的検索のためのカテゴリID収集
    let categoryIds = [];

    if (minor_name) {
      // 小分類が指定された場合：その小分類のみ
      const { data: minorCategories, error: minorError } = await supabase
        .from('categories')
        .select('id')
        .eq('level', 4)
        .eq('name', minor_name);
      
      if (minorError) throw minorError;
      categoryIds = minorCategories?.map(c => c.id) || [];

    } else if (medium_name) {
      // 中分類が指定された場合：その中分類とその下のすべての小分類
      const { data: mediumCategory, error: mediumError } = await supabase
        .from('categories')
        .select('id')
        .eq('level', 3)
        .eq('name', medium_name)
        .single();
      
      if (mediumError) throw mediumError;
      
      if (mediumCategory) {
        // 中分類のIDを追加
        categoryIds.push(mediumCategory.id);
        
        // その下の小分類も追加
        const { data: childCategories, error: childError } = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', mediumCategory.id);
        
        if (!childError && childCategories) {
          categoryIds.push(...childCategories.map(c => c.id));
        }
      }

    } else if (major_name) {
      // 大分類が指定された場合：その大分類とその下のすべての中分類・小分類
      const { data: majorCategory, error: majorError } = await supabase
        .from('categories')
        .select('id')
        .eq('level', 2)
        .eq('name', major_name)
        .single();
      
      if (majorError) throw majorError;
      
      if (majorCategory) {
        categoryIds.push(majorCategory.id);
        
        // 中分類を取得
        const { data: mediumCategories, error: mediumError } = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', majorCategory.id);
        
        if (!mediumError && mediumCategories) {
          categoryIds.push(...mediumCategories.map(c => c.id));
          
          // 各中分類の下の小分類も取得
          for (const medium of mediumCategories) {
            const { data: minorCategories, error: minorError } = await supabase
              .from('categories')
              .select('id')
              .eq('parent_id', medium.id);
            
            if (!minorError && minorCategories) {
              categoryIds.push(...minorCategories.map(c => c.id));
            }
          }
        }
      }

    } else if (field_name) {
      // 分野が指定された場合：その分野とその下のすべての階層
      const { data: fieldCategory, error: fieldError } = await supabase
        .from('categories')
        .select('id')
        .eq('level', 1)
        .eq('name', field_name)
        .single();
      
      if (fieldError) throw fieldError;
      
      if (fieldCategory) {
        categoryIds.push(fieldCategory.id);
        
        // 大分類を取得
        const { data: majorCategories, error: majorError } = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', fieldCategory.id);
        
        if (!majorError && majorCategories) {
          categoryIds.push(...majorCategories.map(c => c.id));
          
          // 各大分類の下の中分類・小分類も取得
          for (const major of majorCategories) {
            const { data: mediumCategories, error: mediumError } = await supabase
              .from('categories')
              .select('id')
              .eq('parent_id', major.id);
            
            if (!mediumError && mediumCategories) {
              categoryIds.push(...mediumCategories.map(c => c.id));
              
              for (const medium of mediumCategories) {
                const { data: minorCategories, error: minorError } = await supabase
                  .from('categories')
                  .select('id')
                  .eq('parent_id', medium.id);
                
                if (!minorError && minorCategories) {
                  categoryIds.push(...minorCategories.map(c => c.id));
                }
              }
            }
          }
        }
      }
    }

    if (categoryIds.length === 0) {
      return res.json(success([], {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0
      }));
    }


    // カテゴリに紐づく問題を question_categories テーブル経由で取得
    const { data: questionCategories, error: questionCategoryError } = await supabase
      .from('question_categories')
      .select('question_id')
      .in('category_id', categoryIds);

    if (questionCategoryError) {
      logger.error('問題カテゴリ取得エラー:', questionCategoryError);
      return res.status(500).json(error('問題カテゴリの取得に失敗しました'));
    }

    if (!questionCategories || questionCategories.length === 0) {
      return res.json(success([], {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0
      }));
    }

    // 重複を除去
    const uniqueQuestionIds = [...new Set(questionCategories.map(qc => qc.question_id))];
    const total = uniqueQuestionIds.length;

    // 50問以下の場合はすべて、50問を超える場合はチェック済み問題を優先して50問選択
    let selectedQuestionIds;
    if (total <= 50) {
      selectedQuestionIds = uniqueQuestionIds;
      logger.info(`問題選択結果: 総数${total}問 -> 全問題を選択`);
    } else {
      // 全問題のis_checkedステータスを取得
      const { data: allQuestionsStatus, error: statusError } = await supabase
        .from('questions')
        .select('id, is_checked')
        .in('id', uniqueQuestionIds);

      if (statusError) {
        logger.error('問題ステータス取得エラー:', statusError);
        // エラーの場合は従来通りランダム選択
        const shuffledQuestionIds = [...uniqueQuestionIds].sort(() => Math.random() - 0.5);
        selectedQuestionIds = shuffledQuestionIds.slice(0, 50);
      } else {
        // チェック済み問題と未チェック問題を分離
        const checkedQuestions = allQuestionsStatus.filter(q => q.is_checked).map(q => q.id);
        const uncheckedQuestions = allQuestionsStatus.filter(q => !q.is_checked).map(q => q.id);

        // チェック済み問題をシャッフル
        const shuffledChecked = [...checkedQuestions].sort(() => Math.random() - 0.5);
        const shuffledUnchecked = [...uncheckedQuestions].sort(() => Math.random() - 0.5);

        // 最大50問選択：チェック済み問題を優先、不足分は未チェック問題で補う
        selectedQuestionIds = [
          ...shuffledChecked.slice(0, 50),
          ...shuffledUnchecked.slice(0, Math.max(0, 50 - shuffledChecked.length))
        ].slice(0, 50);

        logger.info(`問題選択結果: 総数${total}問 -> チェック済み${Math.min(shuffledChecked.length, 50)}問 + 未チェック${Math.max(0, 50 - shuffledChecked.length)}問 = 計${selectedQuestionIds.length}問`);
      }
    }

    // 問題の基本情報を取得（is_checkedフィールドを追加）
    const { data: questions, error: questionError } = await supabase
      .from('questions')
      .select(`
        id,
        question_number,
        is_checked,
        exam:exams(id, year, season)
      `)
      .in('id', selectedQuestionIds)
      .order('question_number', { ascending: true });

    if (questionError) {
      logger.error('問題取得エラー:', questionError);
      return res.status(500).json(error('問題の取得に失敗しました'));
    }

    // レスポンス構造を明確化
    const response = success(questions, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total
    });
    
    // totalを直接追加（互換性のため）
    response.total = total;
    
    res.json(response);

  } catch (err) {
    logger.error('カテゴリによる問題検索エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 問題にカテゴリを関連付け
router.post('/assign', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { question_id, category_id, relevance_score = 1.0, is_primary = false } = req.body;

    if (!question_id || !category_id) {
      return res.status(400).json(error('question_id と category_id は必須です'));
    }

    // 重複チェック
    const { data: existing, error: checkError } = await supabase
      .from('question_categories')
      .select('id')
      .eq('question_id', question_id)
      .eq('category_id', category_id)
      .single();

    if (existing) {
      return res.status(409).json(error('この問題には既に同じカテゴリが関連付けられています'));
    }

    // 関連付けを作成
    const { data: assignment, error: insertError } = await supabase
      .from('question_categories')
      .insert({
        question_id,
        category_id,
        relevance_score,
        is_primary
      })
      .select()
      .single();

    if (insertError) {
      logger.error('カテゴリ関連付けエラー:', insertError);
      return res.status(500).json(error('カテゴリの関連付けに失敗しました'));
    }

    res.status(201).json(success(assignment));
  } catch (err) {
    logger.error('カテゴリ関連付けエラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 問題のカテゴリ関連付けを削除
router.delete('/assign/:assignmentId', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { assignmentId } = req.params;

    const { error: deleteError } = await supabase
      .from('question_categories')
      .delete()
      .eq('id', assignmentId);

    if (deleteError) {
      logger.error('カテゴリ関連付け削除エラー:', deleteError);
      return res.status(500).json(error('カテゴリ関連付けの削除に失敗しました'));
    }

    res.json(success({ message: 'カテゴリ関連付けを削除しました' }));
  } catch (err) {
    logger.error('カテゴリ関連付け削除エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 問題に関連付けられたカテゴリを取得
router.get('/by-question/:questionId', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { questionId } = req.params;

    logger.info(`🔍 問題カテゴリ取得開始: questionId=${questionId}`);

    const { data: assignments, error: fetchError } = await supabase
      .from('question_categories')
      .select(`
        id,
        relevance_score,
        is_primary,
        created_at,
        category:categories(*)
      `)
      .eq('question_id', questionId)
      .order('relevance_score', { ascending: false });

    logger.info(`🔍 問題カテゴリ取得結果:`, {
      questionId,
      assignmentsCount: assignments?.length || 0,
      fetchError,
      assignments: assignments?.map(a => ({
        id: a.id,
        categoryId: a.category?.id,
        categoryName: a.category?.name,
        relevanceScore: a.relevance_score,
        isPrimary: a.is_primary
      })) || []
    });

    if (fetchError) {
      logger.error('問題カテゴリ取得エラー:', fetchError);
      return res.status(500).json(error('問題に関連付けられたカテゴリの取得に失敗しました'));
    }

    res.json(success(assignments || []));
  } catch (err) {
    logger.error('問題カテゴリ取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// カテゴリに関連付けられた問題を取得
router.get('/:categoryId/questions', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { categoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: assignments, error: fetchError } = await supabase
      .from('question_categories')
      .select(`
        id,
        relevance_score,
        is_primary,
        created_at,
        question:questions(
          *,
          choices(*),
          question_images(*),
          exam:exams(*)
        )
      `)
      .eq('category_id', categoryId)
      .order('relevance_score', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (fetchError) {
      logger.error('カテゴリ問題取得エラー:', fetchError);
      return res.status(500).json(error('カテゴリに関連付けられた問題の取得に失敗しました'));
    }

    // 総数を取得
    const { count, error: countError } = await supabase
      .from('question_categories')
      .select('id', { count: 'exact' })
      .eq('category_id', categoryId);

    if (countError) {
      logger.error('カテゴリ問題数取得エラー:', countError);
      return res.status(500).json(error('問題数の取得に失敗しました'));
    }

    res.json(success(assignments || [], {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0
    }));
  } catch (err) {
    logger.error('カテゴリ問題取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

export default router;