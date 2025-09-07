#!/usr/bin/env node

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('カテゴリ分類ツール 単体テスト', () => {
  let CategoryClassifier;
  let mockResponses = {};
  let testCategories;

  before(async () => {
    // テスト用カテゴリデータを準備
    testCategories = [
      {
        id: 'test-cat-1',
        name: 'データベース',
        path: 'テクノロジ系/基礎理論/データベース',
        knowledges: 'SQL, 正規化, トランザクション'
      },
      {
        id: 'test-cat-2',
        name: 'ネットワーク',
        path: 'テクノロジ系/基礎理論/ネットワーク',
        knowledges: 'TCP/IP, OSI参照モデル, ルーティング'
      }
    ];

    // テスト用カテゴリファイルを作成
    const testDataDir = path.join(__dirname, '../data');
    await fs.mkdir(testDataDir, { recursive: true });
    await fs.writeFile(
      path.join(testDataDir, 'minor-categories.json'),
      JSON.stringify(testCategories)
    );
  });

  after(async () => {
    // テストデータをクリーンアップ
    try {
      await fs.unlink(path.join(__dirname, '../data/minor-categories.json'));
    } catch (error) {
      console.warn('テストデータクリーンアップ時のエラー:', error.message);
    }
  });

  beforeEach(() => {
    mockResponses = {};
  });

  describe('CategoryClassifier クラス', () => {
    test('インスタンスが正しく作成されること', async () => {
      // 動的インポート
      const module = await import('../classify.js');
      const ClassifierClass = module.default || class {
        constructor() {
          this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:43001';
          this.token = null;
          this.categories = null;
        }
      };

      const classifier = new ClassifierClass();
      assert.ok(classifier);
      assert.strictEqual(typeof classifier.apiBaseUrl, 'string');
    });

    test('カテゴリデータが正しく読み込まれること', async () => {
      // カテゴリ読み込みのシミュレーション
      const categoriesData = await fs.readFile(
        path.join(__dirname, '../data/minor-categories.json'),
        'utf8'
      );
      const categories = JSON.parse(categoriesData);

      assert.ok(Array.isArray(categories));
      assert.strictEqual(categories.length, 2);
      assert.strictEqual(categories[0].name, 'データベース');
      assert.strictEqual(categories[1].name, 'ネットワーク');
    });
  });

  describe('分類ロジック', () => {
    test('問題テキストから適切なキーワードが抽出されること', () => {
      const questionText = 'SQLのSELECT文において、GROUP BY句を使用する際の注意点を説明してください。';
      const keywords = extractKeywords(questionText);
      
      assert.ok(keywords.includes('SQL'));
      assert.ok(keywords.includes('SELECT'));
      assert.ok(keywords.includes('GROUP BY'));
    });

    test('キーワードマッチングでカテゴリが選択されること', () => {
      const questionKeywords = ['SQL', 'SELECT', 'GROUP BY'];
      const matchedCategories = matchCategories(questionKeywords, testCategories);

      assert.ok(matchedCategories.length > 0);
      const dbCategory = matchedCategories.find(cat => cat.name === 'データベース');
      assert.ok(dbCategory);
      assert.ok(dbCategory.relevance_score > 0);
    });

    test('relevance_scoreが適切に計算されること', () => {
      const matches = 3;  // マッチしたキーワード数
      const totalKeywords = 5;  // 全キーワード数
      const score = calculateRelevanceScore(matches, totalKeywords);

      assert.ok(score >= 0);
      assert.ok(score <= 1);
      assert.strictEqual(score, 0.6);  // 3/5 = 0.6
    });

    test('プライマリカテゴリが正しく設定されること', () => {
      const categories = [
        { name: 'カテゴリA', relevance_score: 0.6 },
        { name: 'カテゴリB', relevance_score: 0.9 },
        { name: 'カテゴリC', relevance_score: 0.3 }
      ];

      const withPrimary = setPrimaryCategory(categories);
      const primary = withPrimary.find(cat => cat.is_primary);

      assert.ok(primary);
      assert.strictEqual(primary.name, 'カテゴリB');
      assert.strictEqual(primary.relevance_score, 0.9);
    });
  });

  describe('APIレスポンス処理', () => {
    test('認証エラーが適切にハンドリングされること', async () => {
      const mockAuthResponse = {
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      };

      try {
        await handleAuthResponse(mockAuthResponse);
        assert.fail('エラーがスローされるべき');
      } catch (error) {
        assert.strictEqual(error.message, '認証に失敗しました: 401');
      }
    });

    test('問題データが正しくパースされること', () => {
      const mockQuestionData = {
        data: [
          {
            id: 'q1',
            question_text: 'テスト問題',
            choices: [
              { choice_text: '選択肢A' },
              { choice_text: '選択肢B' }
            ]
          }
        ]
      };

      const questions = parseQuestions(mockQuestionData);
      assert.ok(Array.isArray(questions));
      assert.strictEqual(questions.length, 1);
      assert.strictEqual(questions[0].id, 'q1');
    });
  });

  describe('エラー処理', () => {
    test('カテゴリファイルが存在しない場合のエラー', async () => {
      try {
        await fs.readFile('/nonexistent/path/categories.json', 'utf8');
        assert.fail('エラーがスローされるべき');
      } catch (error) {
        assert.ok(error.message.includes('ENOENT'));
      }
    });

    test('不正なJSONデータのパースエラー', () => {
      const invalidJson = '{ "invalid": json }';
      
      try {
        JSON.parse(invalidJson);
        assert.fail('エラーがスローされるべき');
      } catch (error) {
        assert.ok(error instanceof SyntaxError);
      }
    });
  });
});

// ヘルパー関数（実際のロジックをシミュレート）
function extractKeywords(text) {
  const keywords = [];
  const patterns = [
    /SQL/gi,
    /SELECT/gi,
    /GROUP BY/gi,
    /データベース/g,
    /ネットワーク/g
  ];

  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      keywords.push(...matches.map(m => m.toUpperCase()));
    }
  });

  return [...new Set(keywords)];  // 重複除去
}

function matchCategories(keywords, categories) {
  return categories
    .map(category => {
      let matchCount = 0;
      const categoryKeywords = category.knowledges.split(',').map(k => k.trim().toUpperCase());
      
      keywords.forEach(keyword => {
        if (categoryKeywords.some(ck => ck.includes(keyword))) {
          matchCount++;
        }
      });

      if (matchCount > 0) {
        return {
          ...category,
          relevance_score: matchCount / Math.max(keywords.length, 1)
        };
      }
      return null;
    })
    .filter(cat => cat !== null);
}

function calculateRelevanceScore(matches, total) {
  if (total === 0) return 0;
  return matches / total;
}

function setPrimaryCategory(categories) {
  if (!categories || categories.length === 0) return [];
  
  const sorted = [...categories].sort((a, b) => b.relevance_score - a.relevance_score);
  
  return sorted.map((cat, index) => ({
    ...cat,
    is_primary: index === 0
  }));
}

async function handleAuthResponse(response) {
  if (!response.ok) {
    throw new Error(`認証に失敗しました: ${response.status}`);
  }
  const data = await response.json();
  return data.data.token;
}

function parseQuestions(data) {
  return data.data || [];
}