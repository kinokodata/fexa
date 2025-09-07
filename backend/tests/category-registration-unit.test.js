import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { getSupabase } from '../src/lib/supabase.js';

describe('カテゴリ登録 統合テスト', () => {
  let supabase;
  let testData = {
    questionId: null,
    categoryId: null,
    assignmentId: null
  };

  before(async () => {
    supabase = getSupabase();
    console.log('✅ Supabaseクライアント初期化完了');
  });

  beforeEach(async () => {
    // テスト用データをクリーンアップ
    await cleanupTestData();
  });

  after(async () => {
    // 全てのテスト完了後にクリーンアップ
    await cleanupTestData();
    console.log('✅ テストデータクリーンアップ完了');
  });

  async function cleanupTestData() {
    try {
      // 関連付けを削除
      if (testData.assignmentId) {
        await supabase
          .from('question_categories')
          .delete()
          .eq('id', testData.assignmentId);
      }

      // テスト用問題を削除
      if (testData.questionId) {
        await supabase
          .from('questions')
          .delete()
          .eq('id', testData.questionId);
      }

      // テスト用カテゴリを削除
      if (testData.categoryId) {
        await supabase
          .from('categories')
          .delete()
          .eq('id', testData.categoryId);
      }

      // データIDをリセット
      testData.questionId = null;
      testData.categoryId = null;
      testData.assignmentId = null;
    } catch (error) {
      console.warn('クリーンアップ時のエラー（既に削除済みの可能性）:', error.message);
    }
  }

  async function createTestData() {
    try {
      // 既存の試験データを取得（最初の1件）
      const { data: exams, error: examFetchError } = await supabase
        .from('exams')
        .select('id')
        .limit(1);

      let examId;
      if (examFetchError || !exams || exams.length === 0) {
        // 試験データがない場合は作成
        const { data: exam, error: examError } = await supabase
          .from('exams')
          .insert({
            year: 9999,
            season: 'test',
            exam_type: 'FE',
            exam_date: new Date().toISOString()
          })
          .select()
          .single();
        
        if (examError) throw examError;
        examId = exam.id;
      } else {
        examId = exams[0].id;
      }

      // テスト用カテゴリを作成
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .insert({
          name: 'テスト用カテゴリ',
          level: 4,
          path: 'テスト分野/テスト大分類/テスト中分類/テスト用カテゴリ',
          parent_id: null,
          display_order: 999
        })
        .select()
        .single();

      if (categoryError) throw categoryError;
      testData.categoryId = category.id;

      // テスト用問題を作成
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert({
          question_number: 99999, // integer型の問題番号
          question_text: 'テスト用問題文',
          exam_id: examId, // 取得または作成した試験のUUID
          question_type: 'multiple_choice',
          difficulty_level: 3 // 1-5の整数値 (1:易, 2:やや易, 3:普通, 4:やや難, 5:難)
        })
        .select()
        .single();

      if (questionError) throw questionError;
      testData.questionId = question.id;

      console.log(`✅ テストデータ作成完了 - Question: ${testData.questionId}, Category: ${testData.categoryId}`);
      
      return { question, category };
    } catch (error) {
      console.error('テストデータ作成エラー:', error);
      throw error;
    }
  }

  describe('カテゴリ関連付け機能', () => {
    test('正常なカテゴリ関連付けができること', async () => {
      // Arrange
      const { question, category } = await createTestData();
      const relevanceScore = 0.9;
      const isPrimary = true;

      // Act - 実際のSupabaseにカテゴリを関連付け
      const { data: assignment, error: insertError } = await supabase
        .from('question_categories')
        .insert({
          question_id: testData.questionId,
          category_id: testData.categoryId,
          relevance_score: relevanceScore,
          is_primary: isPrimary
        })
        .select()
        .single();

      // Assert
      assert.strictEqual(insertError, null, 'カテゴリ関連付けが成功すること');
      assert.ok(assignment, 'assignment データが返されること');
      assert.strictEqual(assignment.question_id, testData.questionId);
      assert.strictEqual(assignment.category_id, testData.categoryId);
      assert.strictEqual(assignment.relevance_score, relevanceScore);
      assert.strictEqual(assignment.is_primary, isPrimary);

      testData.assignmentId = assignment.id;
      console.log(`✅ カテゴリ関連付け成功: ${testData.assignmentId}`);
    });

    test('重複するカテゴリ関連付けがエラーになること', async () => {
      // Arrange
      const { question, category } = await createTestData();

      // 最初の関連付けを作成
      const { data: firstAssignment, error: firstError } = await supabase
        .from('question_categories')
        .insert({
          question_id: testData.questionId,
          category_id: testData.categoryId,
          relevance_score: 0.9,
          is_primary: true
        })
        .select()
        .single();

      assert.strictEqual(firstError, null, '最初の関連付けが成功すること');
      testData.assignmentId = firstAssignment.id;

      // Act - 同じ組み合わせで再度関連付けを試行
      const { data: duplicateAssignment, error: duplicateError } = await supabase
        .from('question_categories')
        .insert({
          question_id: testData.questionId,
          category_id: testData.categoryId,
          relevance_score: 0.8,
          is_primary: false
        })
        .select()
        .single();

      // Assert
      assert.ok(duplicateError, '重複の場合はエラーが発生すること');
      assert.strictEqual(duplicateAssignment, null, '重複データは作成されないこと');
      console.log('✅ 重複関連付けエラーを正しく処理');
    });

    test('デフォルト値が正しく設定されること', async () => {
      // Arrange
      const { question, category } = await createTestData();

      // Act - デフォルト値でカテゴリを関連付け
      const { data: assignment, error: insertError } = await supabase
        .from('question_categories')
        .insert({
          question_id: testData.questionId,
          category_id: testData.categoryId
          // relevance_score と is_primary はデフォルト値を使用
        })
        .select()
        .single();

      // Assert
      assert.strictEqual(insertError, null, 'デフォルト値での関連付けが成功すること');
      assert.ok(assignment, 'assignment データが返されること');
      assert.strictEqual(assignment.question_id, testData.questionId);
      assert.strictEqual(assignment.category_id, testData.categoryId);
      assert.strictEqual(assignment.relevance_score, 1, 'デフォルトの関連度スコアが設定されること');
      assert.strictEqual(assignment.is_primary, false, 'デフォルトの主要フラグが設定されること');

      testData.assignmentId = assignment.id;
      console.log('✅ デフォルト値での関連付け成功');
    });
  });

  describe('カテゴリ関連付け削除機能', () => {
    test('カテゴリ関連付けが正常に削除できること', async () => {
      // Arrange - まず関連付けを作成
      const { question, category } = await createTestData();
      
      const { data: assignment, error: insertError } = await supabase
        .from('question_categories')
        .insert({
          question_id: testData.questionId,
          category_id: testData.categoryId,
          relevance_score: 0.9,
          is_primary: true
        })
        .select()
        .single();

      assert.strictEqual(insertError, null, '関連付け作成が成功すること');
      testData.assignmentId = assignment.id;

      // Act - 関連付けを削除
      const { error: deleteError } = await supabase
        .from('question_categories')
        .delete()
        .eq('id', testData.assignmentId);

      // Assert
      assert.strictEqual(deleteError, null, '関連付け削除が成功すること');

      // 削除されたことを確認
      const { data: deletedAssignment, error: selectError } = await supabase
        .from('question_categories')
        .select('*')
        .eq('id', testData.assignmentId)
        .single();

      assert.ok(selectError, '削除されたデータは取得できないこと');
      assert.strictEqual(deletedAssignment, null, '削除されたデータはnullであること');
      
      testData.assignmentId = null; // 削除済みなのでリセット
      console.log('✅ カテゴリ関連付け削除成功');
    });
  });

  describe('問題カテゴリ取得機能', () => {
    test('問題に関連付けられたカテゴリが正しく取得できること', async () => {
      // Arrange - テストデータとカテゴリ関連付けを作成
      const { question, category } = await createTestData();
      
      const { data: assignment, error: insertError } = await supabase
        .from('question_categories')
        .insert({
          question_id: testData.questionId,
          category_id: testData.categoryId,
          relevance_score: 0.9,
          is_primary: true
        })
        .select()
        .single();

      assert.strictEqual(insertError, null, '関連付け作成が成功すること');
      testData.assignmentId = assignment.id;

      // Act - 問題に関連付けられたカテゴリを取得
      const { data: assignments, error: fetchError } = await supabase
        .from('question_categories')
        .select(`
          id,
          relevance_score,
          is_primary,
          created_at,
          category:categories(*)
        `)
        .eq('question_id', testData.questionId)
        .order('relevance_score', { ascending: false });

      // Assert
      assert.strictEqual(fetchError, null, 'カテゴリ取得が成功すること');
      assert.ok(Array.isArray(assignments), 'データが配列であること');
      assert.strictEqual(assignments.length, 1, 'カテゴリが1件取得できること');
      
      const retrievedAssignment = assignments[0];
      assert.strictEqual(retrievedAssignment.id, testData.assignmentId);
      assert.strictEqual(retrievedAssignment.relevance_score, 0.9);
      assert.strictEqual(retrievedAssignment.is_primary, true);
      assert.ok(retrievedAssignment.category, 'カテゴリ情報が含まれること');
      assert.strictEqual(retrievedAssignment.category.id, testData.categoryId);
      assert.strictEqual(retrievedAssignment.category.name, 'テスト用カテゴリ');

      console.log('✅ 問題カテゴリ取得成功');
    });

    test('カテゴリが関連付けられていない問題の場合空配列が返ること', async () => {
      // Arrange - カテゴリ関連付けなしの問題データを作成
      const { question, category } = await createTestData();

      // Act - 関連付けのない問題のカテゴリを取得
      const { data: assignments, error: fetchError } = await supabase
        .from('question_categories')
        .select(`
          id,
          relevance_score,
          is_primary,
          created_at,
          category:categories(*)
        `)
        .eq('question_id', testData.questionId);

      // Assert
      assert.strictEqual(fetchError, null, '取得リクエストが成功すること');
      assert.ok(Array.isArray(assignments), 'データが配列であること');
      assert.strictEqual(assignments.length, 0, '関連付けがない場合は空配列が返ること');

      console.log('✅ 空配列取得確認完了');
    });
  });

});