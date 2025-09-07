import { test, describe } from 'node:test';
import assert from 'node:assert';

// Docker環境では環境変数が直接注入されるため、dotenvは不要
// APIのベースURL（Docker環境では内部ネットワーク経由）
const API_BASE_URL = process.env.API_BASE_URL || 'http://backend:3000';

/**
 * カテゴリ登録APIテスト
 * 前提条件：
 * - APIサーバーが起動していること
 * - テスト用の問題データとカテゴリデータが存在すること
 * - 認証情報が環境変数に設定されていること
 */

describe('カテゴリ登録API テスト', () => {
  let authToken = null;
  let testQuestionId = null;
  let testCategoryId = null;
  let assignmentId = null;

  test('認証トークンを取得', async () => {
    // 環境変数をデバッグ出力
    console.log('APPLICATION_SERVICE_USER:', process.env.APPLICATION_SERVICE_USER);
    console.log('APPLICATION_SERVICE_PASSWORD:', process.env.APPLICATION_SERVICE_PASSWORD ? '***設定済み***' : '未設定');
    
    const requestBody = {
      email: process.env.APPLICATION_SERVICE_USER,
      password: process.env.APPLICATION_SERVICE_PASSWORD,
    };
    
    console.log('認証リクエストボディ:', { email: requestBody.email, password: requestBody.password ? '***設定済み***' : '未設定' });
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`認証失敗 Status: ${response.status}, Response: ${errorText}`);
    }
    
    assert.strictEqual(response.ok, true, '認証リクエストが成功すること');
    
    const data = await response.json();
    assert.strictEqual(data.success, true, '認証が成功すること');
    assert.ok(data.data.token, 'トークンが取得できること');
    
    authToken = data.data.token;
    console.log('✅ 認証成功');
  });

  test('テスト用問題データを取得', async () => {
    const response = await fetch(`${API_BASE_URL}/api/questions?limit=1`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`問題データ取得失敗 Status: ${response.status}, Response: ${errorText}`);
    }
    
    assert.strictEqual(response.ok, true, '問題データ取得リクエストが成功すること');
    
    const data = await response.json();
    assert.strictEqual(data.success, true, '問題データ取得が成功すること');
    assert.ok(Array.isArray(data.data), 'データが配列であること');
    assert.ok(data.data.length > 0, '問題データが1件以上存在すること');
    
    testQuestionId = data.data[0].id;
    console.log(`✅ テスト用問題ID取得: ${testQuestionId} (問題${data.data[0].question_number})`);
  });

  test('テスト用カテゴリデータを取得', async () => {
    const response = await fetch(`${API_BASE_URL}/api/categories?level=4`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`カテゴリデータ取得失敗 Status: ${response.status}, Response: ${errorText}`);
    }
    
    assert.strictEqual(response.ok, true, 'カテゴリデータ取得リクエストが成功すること');
    
    const data = await response.json();
    assert.strictEqual(data.success, true, 'カテゴリデータ取得が成功すること');
    assert.ok(Array.isArray(data.data), 'データが配列であること');
    assert.ok(data.data.length > 0, 'レベル4カテゴリが1件以上存在すること');
    
    // レベル4（小分類）のカテゴリを選択
    const level4Category = data.data.find(cat => cat.level === 4);
    assert.ok(level4Category, 'レベル4のカテゴリが存在すること');
    
    testCategoryId = level4Category.id;
    console.log(`✅ テスト用カテゴリID取得: ${testCategoryId} (${level4Category.name})`);
  });

  test('カテゴリを問題に関連付け', async () => {
    const response = await fetch(`${API_BASE_URL}/api/categories/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        question_id: testQuestionId,
        category_id: testCategoryId,
        relevance_score: 0.9,
        is_primary: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`カテゴリ関連付け失敗 Status: ${response.status}, Response: ${errorText}`);
    }
    
    assert.strictEqual(response.ok, true, 'カテゴリ関連付けリクエストが成功すること');
    
    const data = await response.json();
    assert.strictEqual(data.success, true, 'カテゴリ関連付けが成功すること');
    assert.ok(data.data.id, '関連付けIDが返されること');
    assert.strictEqual(data.data.question_id, testQuestionId, '問題IDが正しいこと');
    assert.strictEqual(data.data.category_id, testCategoryId, 'カテゴリIDが正しいこと');
    assert.strictEqual(data.data.relevance_score, '0.9', '関連度スコアが正しいこと');
    assert.strictEqual(data.data.is_primary, true, '主要フラグが正しいこと');
    
    assignmentId = data.data.id;
    console.log(`✅ カテゴリ関連付け成功: ${assignmentId}`);
  });

  test('重複関連付けがエラーになること', async () => {
    const response = await fetch(`${API_BASE_URL}/api/categories/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        question_id: testQuestionId,
        category_id: testCategoryId,
        relevance_score: 0.8,
        is_primary: false,
      }),
    });

    assert.strictEqual(response.status, 409, '重複の場合は409エラーが返されること');
    
    const data = await response.json();
    assert.strictEqual(data.success, false, '重複エラーが正しく処理されること');
    console.log('✅ 重複関連付けエラーを正しく処理');
  });

  test('問題に関連付けられたカテゴリを取得', async () => {
    const response = await fetch(`${API_BASE_URL}/api/categories/by-question/${testQuestionId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    assert.strictEqual(response.ok, true, 'カテゴリ取得リクエストが成功すること');
    
    const data = await response.json();
    assert.strictEqual(data.success, true, 'カテゴリ取得が成功すること');
    assert.ok(Array.isArray(data.data), 'データが配列であること');
    assert.ok(data.data.length > 0, 'カテゴリが1件以上取得できること');
    
    const assignment = data.data.find(a => a.id === assignmentId);
    assert.ok(assignment, '作成した関連付けが取得できること');
    assert.ok(assignment.category, 'カテゴリ情報が含まれること');
    assert.strictEqual(assignment.category.id, testCategoryId, 'カテゴリIDが正しいこと');
    assert.strictEqual(assignment.relevance_score, '0.9', '関連度スコアが正しいこと');
    assert.strictEqual(assignment.is_primary, true, '主要フラグが正しいこと');
    
    console.log(`✅ カテゴリ取得成功: ${assignment.category.name} (${assignment.category.path})`);
  });

  test('カテゴリ関連付けを削除', async () => {
    const response = await fetch(`${API_BASE_URL}/api/categories/assign/${assignmentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    assert.strictEqual(response.ok, true, 'カテゴリ削除リクエストが成功すること');
    
    const data = await response.json();
    assert.strictEqual(data.success, true, 'カテゴリ削除が成功すること');
    
    console.log('✅ カテゴリ関連付け削除成功');
  });

  test('削除後にカテゴリが取得されないこと', async () => {
    const response = await fetch(`${API_BASE_URL}/api/categories/by-question/${testQuestionId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    assert.strictEqual(response.ok, true, 'カテゴリ取得リクエストが成功すること');
    
    const data = await response.json();
    assert.strictEqual(data.success, true, 'カテゴリ取得が成功すること');
    
    const assignment = data.data.find(a => a.id === assignmentId);
    assert.strictEqual(assignment, undefined, '削除されたカテゴリが取得されないこと');
    
    console.log('✅ 削除確認完了');
  });
});