#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

class CategoryExporter {
  constructor() {
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://backend:3000';
    this.authUser = process.env.APPLICATION_SERVICE_USER;
    this.authPassword = process.env.APPLICATION_SERVICE_PASSWORD;
    this.authToken = null;
    this.validatedQuestions = new Map();
  }

  /**
   * API認証を実行
   */
  async authenticate() {
    console.log('🔐 API認証を実行中...');
    
    if (!this.authUser || !this.authPassword) {
      throw new Error('認証情報が設定されていません。APPLICATION_SERVICE_USER と APPLICATION_SERVICE_PASSWORD を設定してください。');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: this.authUser,
        password: this.authPassword,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`認証に失敗しました: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    if (!data.success || !data.data.token) {
      throw new Error('認証レスポンスが不正です');
    }

    this.authToken = data.data.token;
    console.log('✅ 認証成功');
  }

  /**
   * 問題IDを取得（年度と季節、問題番号から）
   */
  async getQuestionId(year, season, questionNumber) {
    const cacheKey = `${year}_${season}_${questionNumber}`;
    
    if (this.validatedQuestions.has(cacheKey)) {
      return this.validatedQuestions.get(cacheKey);
    }

    // 季節を正しい形式に変換
    const seasonMap = {
      'h': '春期',  // h = haru (春)
      'a': '秋期',  // a = aki (秋)
      'spring': '春期',
      'autumn': '秋期'
    };
    const seasonJp = seasonMap[season] || season;

    // まず年度と季節で試験を取得し、その試験の全問題を取得
    const response = await fetch(`${this.apiBaseUrl}/api/questions?year=${year}&season=${seasonJp}&limit=100`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`問題データ取得に失敗: ${year}年${seasonJp} - ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success || !data.data || data.data.length === 0) {
      throw new Error(`問題が見つかりません: ${year}年${seasonJp}`);
    }

    // 問題番号で絞り込み
    const question = data.data.find(q => q.question_number === questionNumber);
    if (!question) {
      // 利用可能な問題番号をログ出力
      const availableNumbers = data.data.map(q => q.question_number).sort((a, b) => a - b);
      console.log(`利用可能な問題番号: ${availableNumbers.join(', ')}`);
      throw new Error(`問題番号${questionNumber}が見つかりません: ${year}年${seasonJp}`);
    }

    this.validatedQuestions.set(cacheKey, question.id);
    return question.id;
  }

  /**
   * カテゴリ名で正しいIDを検索
   */
  async findCategoryByName(categoryName) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/categories/search?name=${encodeURIComponent(categoryName)}&exact=true`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        console.warn(`⚠️  カテゴリ名検索エラー: ${categoryName} (${response.status})`);
        return null;
      }

      const data = await response.json();
      if (!data.success || !data.data || data.data.length === 0) {
        console.warn(`⚠️  カテゴリが見つかりません: ${categoryName}`);
        return null;
      }

      // 複数見つかった場合は最初のものを使用
      const category = data.data[0];
      console.log(`🔍 カテゴリIDを発見: ${categoryName} → ${category.id} (Level: ${category.level})`);
      return category;
    } catch (error) {
      console.warn(`⚠️  カテゴリ名検索エラー: ${categoryName} - ${error.message}`);
      return null;
    }
  }

  /**
   * カテゴリが存在するか確認（IDベース）
   */
  async validateCategoryExists(categoryId, categoryName) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/categories/${categoryId}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (response.status === 404) {
        console.warn(`⚠️  カテゴリIDが存在しません: ${categoryName} (ID: ${categoryId})`);
        return false;
      }

      if (!response.ok) {
        console.warn(`⚠️  カテゴリ確認エラー: ${categoryName} (${response.status})`);
        return false;
      }

      return true;
    } catch (error) {
      console.warn(`⚠️  カテゴリ確認エラー: ${categoryName} - ${error.message}`);
      return false;
    }
  }

  /**
   * カテゴリ関連付けを実行
   */
  async assignCategory(questionId, category) {
    try {
      let actualCategoryId = category.category_id;

      // カテゴリの存在確認
      const categoryExists = await this.validateCategoryExists(category.category_id, category.category_name);
      if (!categoryExists) {
        // IDが見つからない場合、名前で検索
        console.log(`🔍 名前でカテゴリを検索: ${category.category_name}`);
        const foundCategory = await this.findCategoryByName(category.category_name);
        
        if (!foundCategory) {
          return { success: false, error: `カテゴリが存在しません: ${category.category_name}` };
        }
        
        actualCategoryId = foundCategory.id;
        console.log(`✅ 正しいIDを使用: ${category.category_name} → ${actualCategoryId}`);
      }

      const response = await fetch(`${this.apiBaseUrl}/api/categories/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          question_id: questionId,
          category_id: actualCategoryId,
          relevance_score: category.relevance_score,
          is_primary: category.is_primary,
        }),
      });

      if (response.status === 409) {
        // 重複エラーは無視（既に登録済み）
        return { success: true, skipped: true };
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`カテゴリ関連付けに失敗: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('カテゴリ関連付けに失敗');
      }

      return { success: true, data: data.data, correctedId: actualCategoryId !== category.category_id ? actualCategoryId : null };
    } catch (error) {
      throw new Error(`カテゴリ関連付け処理エラー: ${error.message}`);
    }
  }

  /**
   * category-data.jsonを処理
   */
  async processCategoryData(year, season) {
    const filePath = path.join('/pdfs', `${year}_${season}`, 'category-data.json');
    
    // 季節の日本語変換
    const seasonMap = { 'h': '春期', 'a': '秋期' };
    const seasonJp = seasonMap[season] || season;
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`カテゴリデータファイルが見つかりません: ${filePath}`);
    }

    console.log(`📁 カテゴリデータファイルを読み込み中: ${filePath}`);
    
    let categoryData;
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      categoryData = JSON.parse(fileContent);
    } catch (error) {
      throw new Error(`JSONファイルの読み込みに失敗: ${error.message}`);
    }

    if (!Array.isArray(categoryData)) {
      throw new Error('カテゴリデータは配列である必要があります');
    }

    console.log(`📊 処理対象: ${year}年${seasonJp} - 問題数: ${categoryData.length}件`);
    console.log(`📁 入力ファイル: ${filePath}`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const questionData of categoryData) {
      try {
        console.log(`\n🔍 問題${questionData.question_number}を処理中...`);
        
        // 問題IDを取得
        const questionId = await this.getQuestionId(year, season, questionData.question_number);
        
        // 各カテゴリを関連付け
        for (const category of questionData.categories) {
          try {
            const result = await this.assignCategory(questionId, category);
            
            if (result.success === false) {
              console.error(`  ❌ ${result.error}`);
              errors++;
            } else if (result.skipped) {
              console.log(`  ⏭️  カテゴリ「${category.category_name}」は既に登録済み`);
              skipped++;
            } else {
              const correctedMessage = result.correctedId ? ` (ID修正済み: ${result.correctedId})` : '';
              console.log(`  ✅ カテゴリ「${category.category_name}」を関連付け${correctedMessage} (関連度: ${category.relevance_score}, 主要: ${category.is_primary})`);
              processed++;
            }
          } catch (error) {
            console.error(`  ❌ カテゴリ「${category.category_name}」の関連付けに失敗: ${error.message}`);
            errors++;
          }
        }
      } catch (error) {
        console.error(`❌ 問題${questionData.question_number}の処理に失敗: ${error.message}`);
        errors++;
      }
    }

    console.log('\n📈 処理結果:');
    console.log(`  ✅ 処理成功: ${processed}件`);
    console.log(`  ⏭️  スキップ: ${skipped}件`);
    console.log(`  ❌ エラー: ${errors}件`);

    return { processed, skipped, errors };
  }
}

async function main() {
  try {
    // コマンドライン引数を解析
    const args = process.argv.slice(2);
    
    if (args.length !== 2) {
      console.error('使用法: node index.js <年度> <季節>');
      console.error('例: node index.js 2010 h');
      process.exit(1);
    }

    const [year, season] = args;

    // 季節の日本語変換
    const seasonMap = { 'h': '春期', 'a': '秋期' };
    const seasonJp = seasonMap[season] || season;

    console.log('🚀 カテゴリエクスポートツールを開始');
    console.log(`📅 対象: ${year}年${seasonJp} (ディレクトリ: ${year}_${season})`);

    const exporter = new CategoryExporter();

    // 認証
    await exporter.authenticate();

    // カテゴリデータを処理
    const result = await exporter.processCategoryData(year, season);

    if (result.errors > 0) {
      console.log('\n⚠️  一部エラーが発生しましたが、処理を完了しました。');
      process.exit(1);
    } else {
      console.log('\n🎉 すべての処理が正常に完了しました！');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n💥 Fatal Error:', error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmain関数を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}