#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

class QuestionImporter {
  constructor() {
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://backend:3000';
    this.authUser = process.env.APPLICATION_SERVICE_USER;
    this.authPassword = process.env.APPLICATION_SERVICE_PASSWORD;
    this.authToken = null;
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
   * 問題一覧を取得
   */
  async getQuestions(year, season) {
    // 季節を正しい形式に変換
    const seasonMap = {
      'h': '春期',  // h = haru (春)
      'a': '秋期',  // a = aki (秋)
      'spring': '春期',
      'autumn': '秋期'
    };
    const seasonJp = seasonMap[season] || season;
    
    console.log(`📊 問題データ取得中: ${year}年${seasonJp} (${year}_${season})`);
    console.log(`   APIクエリ: year=${year}, season=${seasonJp}`);

    const response = await fetch(`${this.apiBaseUrl}/api/questions?year=${year}&season=${seasonJp}&limit=100`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`問題データ取得に失敗: ${year}年${seasonJp} - ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error(`問題データ取得エラー: ${year}年${seasonJp}`);
    }

    console.log(`✅ 取得成功: ${year}年${seasonJp} - ${data.data.length}件の問題`);
    
    // 問題番号の範囲を表示
    if (data.data.length > 0) {
      const numbers = data.data.map(q => q.question_number).sort((a, b) => a - b);
      console.log(`   問題番号範囲: ${numbers[0]} ～ ${numbers[numbers.length - 1]}`);
    }
    
    return data.data;
  }

  /**
   * 選択肢をMarkdown形式に変換
   */
  formatChoices(choices) {
    if (!choices || choices.length === 0) {
      return '';
    }

    // 選択肢をラベル順にソート
    const sortedChoices = [...choices].sort((a, b) => {
      const labelOrder = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク'];
      return labelOrder.indexOf(a.choice_label) - labelOrder.indexOf(b.choice_label);
    });

    return sortedChoices.map(choice => {
      const label = choice.choice_label || '';
      const text = choice.choice_text || '';
      return `- ${label} ${text}`;
    }).join('\n');
  }

  /**
   * 正解の選択肢を取得
   */
  getCorrectAnswer(choices) {
    if (!choices || choices.length === 0) {
      return '不明';
    }

    const correctChoice = choices.find(choice => choice.is_correct);
    return correctChoice ? correctChoice.choice_label : '不明';
  }

  /**
   * 問題をMarkdown形式に変換
   */
  formatQuestion(question) {
    const questionNumber = question.question_number;
    const questionText = question.question_text || '';
    const explanation = question.explanation || '';
    const choices = this.formatChoices(question.choices);
    const correctAnswer = this.getCorrectAnswer(question.choices);

    let markdown = `## 問${questionNumber}\n`;
    markdown += `${questionText}\n\n`;

    // 画像がある場合の処理
    if (question.has_image && question.question_images && question.question_images.length > 0) {
      question.question_images.forEach((img, index) => {
        const imgName = `q${questionNumber.toString().padStart(2, '0')}_${index + 1}.png`;
        markdown += `![問題画像](./images/${imgName})\n\n`;
      });
    }

    // 選択肢表がある場合
    if (question.has_choice_table && question.choice_table_markdown) {
      markdown += `${question.choice_table_markdown}\n\n`;
    }

    // 選択肢
    if (choices) {
      markdown += `${choices}\n\n`;
    }

    // 正解
    markdown += `**正解: ${correctAnswer}**\n\n`;

    // 解説
    if (explanation) {
      markdown += `${explanation}\n\n`;
    }

    return markdown;
  }

  /**
   * Markdownファイルを生成
   */
  async generateMarkdown(year, season, questions) {
    const seasonMap = {
      'h': '春期',  // h = haru (春)
      'a': '秋期'   // a = aki (秋)
    };
    const seasonJp = seasonMap[season] || season;
    
    console.log(`📝 Markdownファイル生成中...`);

    let markdown = `# 平成${year - 1988}年度${seasonJp} 基本情報技術者試験 午前問題 解答・解説\n\n`;

    // 問題番号でソート
    const sortedQuestions = [...questions].sort((a, b) => a.question_number - b.question_number);

    for (const question of sortedQuestions) {
      try {
        markdown += this.formatQuestion(question);
      } catch (error) {
        console.error(`❌ 問題${question.question_number}の変換エラー:`, error.message);
        markdown += `## 問${question.question_number}\n[変換エラー: ${error.message}]\n\n`;
      }
    }

    // ファイル出力
    const outputDir = `/pdfs/${year}_${season}`;
    
    // 日時情報を生成（YYYYMMDD-HHMMSS形式）
    const now = new Date();
    const dateStr = now.getFullYear() +
                    String(now.getMonth() + 1).padStart(2, '0') +
                    String(now.getDate()).padStart(2, '0');
    const timeStr = String(now.getHours()).padStart(2, '0') +
                    String(now.getMinutes()).padStart(2, '0') +
                    String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${dateStr}-${timeStr}`;
    
    const outputFilename = `text-data-import-${timestamp}.md`;
    const outputPath = path.join(outputDir, outputFilename);
    
    // 最新版へのシンボリックリンク用のパス
    const latestPath = path.join(outputDir, 'text-data-import-latest.md');

    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 出力ディレクトリを作成: ${outputDir}`);
    }

    fs.writeFileSync(outputPath, markdown, 'utf-8');
    console.log(`✅ ファイル出力完了: ${outputPath}`);
    
    // 最新版へのシンボリックリンクを更新（存在する場合は削除してから作成）
    try {
      if (fs.existsSync(latestPath)) {
        fs.unlinkSync(latestPath);
      }
      fs.symlinkSync(outputFilename, latestPath);
      console.log(`🔗 最新版リンク更新: ${latestPath}`);
    } catch (error) {
      console.warn(`⚠️  シンボリックリンク作成スキップ: ${error.message}`);
    }

    return outputPath;
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

    console.log('🚀 問題インポートツールを開始');
    console.log(`📅 対象: ${year}年${seasonJp} (ディレクトリ: ${year}_${season})`);

    const importer = new QuestionImporter();

    // 認証
    await importer.authenticate();

    // 問題データを取得
    const questions = await importer.getQuestions(year, season);

    // Markdownファイルを生成
    const outputPath = await importer.generateMarkdown(year, season, questions);

    console.log('\n🎉 インポート完了！');
    console.log(`📄 生成されたファイル: ${outputPath}`);
    console.log(`📊 処理した問題数: ${questions.length}件`);

    process.exit(0);

  } catch (error) {
    console.error('\n💥 Fatal Error:', error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmain関数を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}