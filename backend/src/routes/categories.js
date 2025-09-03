import express from 'express';
import { getSupabase } from '../lib/supabase.js';
import { success, error } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../lib/logger.js';

const router = express.Router();

// カテゴリ一覧取得（階層構造）
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { exam_code = 'FE' } = req.query;

    // すべてのカテゴリを取得
    const { data: categories, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('exam_code', exam_code)
      .order('level', { ascending: true })
      .order('display_order', { ascending: true });

    if (fetchError) {
      logger.error('カテゴリ取得エラー:', fetchError);
      return res.status(500).json(error('カテゴリの取得に失敗しました'));
    }

    // 階層構造を構築
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
  } catch (err) {
    logger.error('カテゴリ一覧取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// カテゴリ一覧取得（フラット構造・問題数付き）
router.get('/flat', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { exam_code = 'FE' } = req.query;

    // カテゴリと問題数を取得
    const { data: categories, error: fetchError } = await supabase
      .from('categories')
      .select(`
        *,
        question_categories(count)
      `)
      .eq('exam_code', exam_code)
      .order('level', { ascending: true })
      .order('display_order', { ascending: true });

    if (fetchError) {
      logger.error('カテゴリ取得エラー:', fetchError);
      return res.status(500).json(error('カテゴリの取得に失敗しました'));
    }

    // 問題数を集計
    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      question_count: cat.question_categories?.length || 0
    }));

    res.json(success(categoriesWithCount));
  } catch (err) {
    logger.error('カテゴリ一覧取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 階層カテゴリ取得（階層ドロップダウン用）
router.get('/hierarchy', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { exam_code = 'FE', level, parent_field, parent_major, parent_medium, parent_minor } = req.query;

    let query = supabase
      .from('fe_categories_hierarchy_view')
      .select('*')
      .eq('exam_code', exam_code);

    // レベルでフィルタ
    if (level) {
      query = query.eq('level', parseInt(level));
    }

    // 親カテゴリでフィルタ（依存ドロップダウン用）
    if (parent_field) {
      query = query.eq('field_name', parent_field);
    }
    if (parent_major) {
      query = query.eq('major_category', parent_major);
    }
    if (parent_medium) {
      query = query.eq('medium_category', parent_medium);
    }
    if (parent_minor) {
      query = query.eq('minor_category', parent_minor);
    }

    const { data: categories, error: fetchError } = await query
      .order('path')
      .order('display_order', { ascending: true });

    if (fetchError) {
      logger.error('階層カテゴリ取得エラー:', fetchError);
      return res.status(500).json(error('階層カテゴリの取得に失敗しました'));
    }

    logger.info(`階層カテゴリ取得: ${categories?.length || 0}件, クエリパラメータ:`, { exam_code, level, parent_field, parent_major, parent_medium, parent_minor });
    res.json(success(categories));
  } catch (err) {
    logger.error('階層カテゴリ取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 特定問題のカテゴリ取得（パス情報付き）
router.get('/question/:questionId', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { questionId } = req.params;

    // question_categoriesから関連付け情報を取得
    const { data: questionCategories, error: fetchError } = await supabase
      .from('question_categories')
      .select(`
        *,
        categories(*)
      `)
      .eq('question_id', questionId)
      .order('relevance_score', { ascending: false });

    if (fetchError) {
      logger.error('問題カテゴリ取得エラー:', fetchError);
      return res.status(500).json(error('問題カテゴリの取得に失敗しました'));
    }

    // 各カテゴリに対して階層情報を取得
    const categoriesWithPath = await Promise.all(
      questionCategories.map(async (qc) => {
        // 階層ビューから詳細情報を取得
        const { data: hierarchyData, error: hierarchyError } = await supabase
          .from('fe_categories_hierarchy_view')
          .select('*')
          .eq('id', qc.category_id)
          .single();

        const baseCategory = {
          ...qc.categories,
          relevance_score: qc.relevance_score,
          is_primary: qc.is_primary,
          notes: qc.notes,
          relation_id: qc.id
        };

        if (hierarchyError || !hierarchyData) {
          // 階層情報が取得できない場合はベース情報のみ返す
          return baseCategory;
        }

        // パス情報を追加
        return {
          ...baseCategory,
          path: hierarchyData.path,
          field_name: hierarchyData.field_name,
          major_category: hierarchyData.major_category,
          medium_category: hierarchyData.medium_category,
          minor_category: hierarchyData.minor_category,
          knowledge_item: hierarchyData.knowledge_item,
          level: hierarchyData.level,
          category_type: hierarchyData.category_type
        };
      })
    );

    res.json(success(categoriesWithPath));
  } catch (err) {
    logger.error('問題カテゴリ取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 問題にカテゴリを登録（階層パス全体を登録）
router.post('/question/:questionId', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { questionId } = req.params;
    const { categoryId, relevance_score = 1.0, is_primary = false, notes = null } = req.body;

    if (!categoryId) {
      return res.status(400).json(error('categoryId は必須です'));
    }

    // 問題の存在確認
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      logger.error('問題確認エラー:', questionError);
      return res.status(404).json(error('問題が見つかりません'));
    }

    // 階層ビューから選択されたカテゴリの階層情報を取得
    const { data: hierarchyData, error: hierarchyError } = await supabase
      .from('fe_categories_hierarchy_view')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (hierarchyError || !hierarchyData) {
      logger.error('階層情報取得エラー:', hierarchyError);
      return res.status(404).json(error('カテゴリが見つかりません'));
    }

    // 階層パス上のすべてのカテゴリIDを取得
    const pathCategories = [];
    
    // 分野（field）
    if (hierarchyData.field_name) {
      const { data: fieldCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('exam_code', hierarchyData.exam_code)
        .eq('level', 1)
        .eq('name', hierarchyData.field_name)
        .single();
      if (fieldCategory) {
        pathCategories.push({
          category_id: fieldCategory.id,
          level: 1,
          relevance_score: 0.2,
          is_primary: false
        });
      }
    }

    // 大カテゴリ（major）
    if (hierarchyData.major_category) {
      const { data: majorCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('exam_code', hierarchyData.exam_code)
        .eq('level', 2)
        .eq('name', hierarchyData.major_category)
        .single();
      if (majorCategory) {
        pathCategories.push({
          category_id: majorCategory.id,
          level: 2,
          relevance_score: 0.4,
          is_primary: false
        });
      }
    }

    // 中カテゴリ（medium）
    if (hierarchyData.medium_category) {
      const { data: mediumCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('exam_code', hierarchyData.exam_code)
        .eq('level', 3)
        .eq('name', hierarchyData.medium_category)
        .single();
      if (mediumCategory) {
        pathCategories.push({
          category_id: mediumCategory.id,
          level: 3,
          relevance_score: 0.6,
          is_primary: false
        });
      }
    }

    // 小カテゴリ（minor）
    if (hierarchyData.minor_category) {
      const { data: minorCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('exam_code', hierarchyData.exam_code)
        .eq('level', 4)
        .eq('name', hierarchyData.minor_category)
        .single();
      if (minorCategory) {
        pathCategories.push({
          category_id: minorCategory.id,
          level: 4,
          relevance_score: 0.8,
          is_primary: false
        });
      }
    }

    // ナレッジ（選択されたカテゴリ）
    pathCategories.push({
      category_id: categoryId,
      level: hierarchyData.level,
      relevance_score: relevance_score,
      is_primary: is_primary
    });

    // 既存の関連付けをチェック（すでに同じナレッジが登録されている場合）
    const { data: existing, error: checkError } = await supabase
      .from('question_categories')
      .select('id')
      .eq('question_id', questionId)
      .eq('category_id', categoryId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('既存関連確認エラー:', checkError);
      return res.status(500).json(error('既存関連の確認に失敗しました'));
    }

    if (existing) {
      return res.status(409).json(error('この問題とカテゴリは既に関連付けられています'));
    }

    // 階層パス上のすべてのカテゴリを登録
    const insertPromises = pathCategories.map(async (pathCategory) => {
      // 既存チェック
      const { data: existingPath } = await supabase
        .from('question_categories')
        .select('id')
        .eq('question_id', questionId)
        .eq('category_id', pathCategory.category_id)
        .maybeSingle();

      if (!existingPath) {
        return supabase
          .from('question_categories')
          .insert({
            question_id: questionId,
            category_id: pathCategory.category_id,
            relevance_score: pathCategory.relevance_score,
            is_primary: pathCategory.is_primary,
            notes: pathCategory.level === hierarchyData.level ? notes : null,
            created_by: req.user?.id || null
          });
      }
      return { data: null, error: null };
    });

    const results = await Promise.all(insertPromises);
    const errors = results.filter(result => result.error);

    if (errors.length > 0) {
      logger.error('カテゴリ関連付けエラー:', errors);
      return res.status(500).json(error('カテゴリの関連付けに失敗しました'));
    }

    logger.info(`問題 ${questionId} に階層カテゴリを関連付けました: ${hierarchyData.path}`);
    res.json(success({
      message: '階層カテゴリを関連付けました',
      data: { path: hierarchyData.path, categories_added: pathCategories.length }
    }));
  } catch (err) {
    logger.error('カテゴリ関連付けエラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 問題とカテゴリの関連付けを更新
router.patch('/question/:questionId/:relationId', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { questionId, relationId } = req.params;
    const { relevance_score, is_primary, notes } = req.body;

    // 更新対象の関連付けを確認
    const { data: relation, error: checkError } = await supabase
      .from('question_categories')
      .select('*')
      .eq('id', relationId)
      .eq('question_id', questionId)
      .single();

    if (checkError || !relation) {
      logger.error('関連付け確認エラー:', checkError);
      return res.status(404).json(error('関連付けが見つかりません'));
    }

    // 更新データを準備
    const updateData = {};
    if (relevance_score !== undefined) updateData.relevance_score = relevance_score;
    if (is_primary !== undefined) updateData.is_primary = is_primary;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length === 1) { // updated_atのみの場合
      return res.status(400).json(error('更新するデータがありません'));
    }

    // 関連付けを更新
    const { data: updatedRelation, error: updateError } = await supabase
      .from('question_categories')
      .update(updateData)
      .eq('id', relationId)
      .select(`
        *,
        categories(*)
      `)
      .single();

    if (updateError) {
      logger.error('関連付け更新エラー:', updateError);
      return res.status(500).json(error('関連付けの更新に失敗しました'));
    }

    logger.info(`関連付け ${relationId} を更新しました`);
    res.json(success({
      message: '関連付けを更新しました',
      data: updatedRelation
    }));
  } catch (err) {
    logger.error('関連付け更新エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// 問題とカテゴリの関連付けを削除（階層全体を削除）
router.delete('/question/:questionId/:relationId', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { questionId, relationId } = req.params;

    // 削除対象の関連付けを確認
    const { data: relation, error: checkError } = await supabase
      .from('question_categories')
      .select('*')
      .eq('id', relationId)
      .eq('question_id', questionId)
      .single();

    if (checkError || !relation) {
      logger.error('関連付け確認エラー:', checkError);
      return res.status(404).json(error('関連付けが見つかりません'));
    }

    // 削除対象のカテゴリの階層情報を取得
    const { data: hierarchyData, error: hierarchyError } = await supabase
      .from('fe_categories_hierarchy_view')
      .select('*')
      .eq('id', relation.category_id)
      .single();

    if (hierarchyError || !hierarchyData) {
      logger.error('階層情報取得エラー:', hierarchyError);
      // 階層情報が取得できない場合は単一削除
      const { error: deleteError } = await supabase
        .from('question_categories')
        .delete()
        .eq('id', relationId);

      if (deleteError) {
        logger.error('関連付け削除エラー:', deleteError);
        return res.status(500).json(error('関連付けの削除に失敗しました'));
      }

      logger.info(`関連付け ${relationId} を削除しました`);
      return res.json(success({
        message: '関連付けを削除しました'
      }));
    }

    // 同じ階層パス上のすべてのカテゴリIDを取得
    const pathCategoryIds = [];

    // 分野（field）
    if (hierarchyData.field_name) {
      const { data: fieldCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('exam_code', hierarchyData.exam_code)
        .eq('level', 1)
        .eq('name', hierarchyData.field_name)
        .single();
      if (fieldCategory) pathCategoryIds.push(fieldCategory.id);
    }

    // 大カテゴリ（major）
    if (hierarchyData.major_category) {
      const { data: majorCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('exam_code', hierarchyData.exam_code)
        .eq('level', 2)
        .eq('name', hierarchyData.major_category)
        .single();
      if (majorCategory) pathCategoryIds.push(majorCategory.id);
    }

    // 中カテゴリ（medium）
    if (hierarchyData.medium_category) {
      const { data: mediumCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('exam_code', hierarchyData.exam_code)
        .eq('level', 3)
        .eq('name', hierarchyData.medium_category)
        .single();
      if (mediumCategory) pathCategoryIds.push(mediumCategory.id);
    }

    // 小カテゴリ（minor）
    if (hierarchyData.minor_category) {
      const { data: minorCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('exam_code', hierarchyData.exam_code)
        .eq('level', 4)
        .eq('name', hierarchyData.minor_category)
        .single();
      if (minorCategory) pathCategoryIds.push(minorCategory.id);
    }

    // ナレッジ（選択されたカテゴリ）
    pathCategoryIds.push(relation.category_id);

    // 階層パス上のすべての関連付けを削除
    const { error: deleteError } = await supabase
      .from('question_categories')
      .delete()
      .eq('question_id', questionId)
      .in('category_id', pathCategoryIds);

    if (deleteError) {
      logger.error('階層カテゴリ削除エラー:', deleteError);
      return res.status(500).json(error('階層カテゴリの削除に失敗しました'));
    }

    logger.info(`問題 ${questionId} の階層カテゴリを削除しました: ${hierarchyData.path} (${pathCategoryIds.length}件)`);
    res.json(success({
      message: '階層カテゴリを削除しました',
      data: { path: hierarchyData.path, categories_deleted: pathCategoryIds.length }
    }));
  } catch (err) {
    logger.error('関連付け削除エラー:', err);
    res.status(500).json(error(err.message));
  }
});

// カテゴリによる問題検索
router.get('/questions/:categoryId', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { categoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // カテゴリに関連付けられた問題を取得
    const { data: questions, error: fetchError } = await supabase
      .from('question_categories')
      .select(`
        questions!inner(
          *,
          choices(*),
          question_images(*)
        )
      `)
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (fetchError) {
      logger.error('カテゴリ別問題取得エラー:', fetchError);
      return res.status(500).json(error('問題の取得に失敗しました'));
    }

    // 総件数を取得
    const { count, error: countError } = await supabase
      .from('question_categories')
      .select('question_id', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (countError) {
      logger.error('問題数取得エラー:', countError);
    }

    const questionList = questions.map(qc => qc.questions);

    res.json(success(questionList, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0
    }));
  } catch (err) {
    logger.error('カテゴリ別問題取得エラー:', err);
    res.status(500).json(error(err.message));
  }
});

export default router;