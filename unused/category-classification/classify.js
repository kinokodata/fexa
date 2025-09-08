#!/usr/bin/env node

import { config } from 'dotenv';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import fs from 'fs/promises';

// 環境変数を読み込み
config();

class CategoryClassifier {
  constructor() {
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:43001';
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.token = null;
    this.categories = null;
  }

  async authenticate() {
    const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.APPLICATION_SERVICE_USER,
        password: process.env.APPLICATION_SERVICE_PASSWORD
      })
    });

    if (!response.ok) {
      throw new Error(`認証に失敗しました: ${response.status}`);
    }

    const data = await response.json();
    this.token = data.data.token;
    console.log('✅ 認証完了');
  }

  async loadCategories() {
    // minor-categories.jsonから読み込み
    try {
      const categoriesData = await fs.readFile('/app/data/minor-categories.json', 'utf8');
      this.categories = JSON.parse(categoriesData);
      console.log(`✅ カテゴリデータ読み込み完了: ${this.categories.length}件`);
    } catch (error) {
      throw new Error(`カテゴリデータの読み込みに失敗: ${error.message}`);
    }
  }

  async getQuestions(year, season) {
    const response = await fetch(`${this.apiBaseUrl}/api/questions?year=${year}&season=${season}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    if (!response.ok) {
      throw new Error(`問題データの取得に失敗: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  async classifyQuestion(question) {
    // カテゴリ情報を大幅に圧縮
    const categoryNames = this.categories.map(cat => {
      // パスを短縮（最後の2レベルのみ）
      const shortPath = cat.path.split('/').slice(-2).join('/');
      // 知識項目を3つまでに制限
      const shortKnowledges = cat.knowledges.split(',').slice(0, 3).join(',');
      return `${cat.id}:${shortPath}[${shortKnowledges}]`;
    }).join('\\n');
    
    const prompt = `あなたは基本情報技術者試験の問題を分類する専門家です。

以下の問題を分析し、最も適切なカテゴリを1〜3個選んでください。必ず最低1つは選択してください。

問題:
${question.question_text}

選択肢:
${question.choices?.map((c, i) => `${String.fromCharCode(65 + i)}. ${c.choice_text}`).join('\\n') || ''}

利用可能なカテゴリ:
${categoryNames}

以下の形式でJSONレスポンスを返してください:
{
  "categories": [
    {
      "id": "カテゴリID",
      "name": "カテゴリ名", 
      "path": "カテゴリパス",
      "relevance_score": 0.9,
      "is_primary": true,
      "reasoning": "選択理由"
    }
  ]
}

relevance_score は 0.1 〜 1.0 の範囲で、is_primary は最も主要なカテゴリの場合にtrueにしてください。`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "あなたは基本情報技術者試験の問題分類の専門家です。正確で一貫性のある分類を行ってください。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const responseText = completion.choices[0].message.content;
      const jsonMatch = responseText.match(/\\{[\\s\\S]*\\}/);
      
      if (!jsonMatch) {
        throw new Error('JSONレスポンスが見つかりません');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error(`ChatGPT分類エラー (問題${question.question_number}):`, error);
      return null;
    }
  }

  async assignCategory(questionId, categoryId, relevanceScore, isPrimary) {
    const response = await fetch(`${this.apiBaseUrl}/api/categories/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        question_id: questionId,
        category_id: categoryId,
        relevance_score: relevanceScore,
        is_primary: isPrimary
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`カテゴリ関連付けに失敗: ${errorData.message}`);
    }

    return await response.json();
  }

  async run(year, season) {
    try {
      console.log(`🚀 カテゴリ分類開始: ${year}年${season}`);
      
      // 1. 認証
      await this.authenticate();
      
      // 2. カテゴリデータ読み込み
      await this.loadCategories();
      
      // 3. 問題データ取得
      console.log('📋 問題データ取得中...');
      const questions = await this.getQuestions(year, season);
      console.log(`📊 対象問題数: ${questions.length}問`);

      let successCount = 0;
      let errorCount = 0;

      // 4. 問題を1つずつ処理
      for (const question of questions) {
        try {
          console.log(`🔍 問題${question.question_number} 分析中...`);
          
          const classification = await this.classifyQuestion(question);
          if (!classification || !classification.categories) {
            console.log(`❌ 問題${question.question_number}: 分類失敗`);
            errorCount++;
            continue;
          }

          // カテゴリ関連付け
          for (const category of classification.categories) {
            try {
              await this.assignCategory(
                question.id,
                category.id,
                category.relevance_score,
                category.is_primary
              );
              console.log(`✅ 問題${question.question_number}: ${category.name} (${category.relevance_score})`);
            } catch (assignError) {
              console.log(`⚠️ 問題${question.question_number}: 関連付け失敗 - ${assignError.message}`);
            }
          }

          successCount++;
          
          // レート制限対応
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ 問題${question.question_number} 処理エラー:`, error.message);
          errorCount++;
        }
      }

      console.log(`\\n🎉 分類完了`);
      console.log(`- 成功: ${successCount}問`);
      console.log(`- エラー: ${errorCount}問`);

    } catch (error) {
      console.error('💥 処理エラー:', error);
      process.exit(1);
    }
  }
}

// CLI実行
const [year, season] = process.argv.slice(2);

if (!year || !season) {
  console.error('使用方法: node classify.js <年度> <季節>');
  console.error('例: node classify.js 2023 春期');
  process.exit(1);
}

const classifier = new CategoryClassifier();
classifier.run(year, season);