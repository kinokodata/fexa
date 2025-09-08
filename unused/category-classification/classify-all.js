#!/usr/bin/env node

import SupabaseClient from './lib/supabase-client.js';
import QuestionClassifier from './lib/classifier.js';
import { writeFileSync } from 'fs';

class CategoryClassificationTool {
  constructor() {
    this.supabase = new SupabaseClient();
    this.classifier = new QuestionClassifier(this.supabase);
    this.results = [];
  }

  async run(options = {}) {
    const {
      year,
      season,
      limit = 100,
      dryRun = false,
      batchSize = 5
    } = options;

    try {
      console.log('🚀 カテゴリ自動分類を開始...');
      
      // 1. 対象問題を取得
      console.log('📋 対象問題を取得中...');
      const questions = await this.supabase.getUnclassifiedQuestions({
        year,
        season, 
        limit
      });
      console.log(`📊 対象問題数: ${questions.length}問`);
      
      if (questions.length === 0) {
        console.log('✅ 分類対象の問題がありません');
        return;
      }

      // 2. カテゴリ階層を取得
      console.log('🏗️ カテゴリ階層を取得中...');
      const categoryHierarchy = await this.supabase.getCategoryHierarchy();
      console.log(`📂 カテゴリ階層: ${Object.keys(categoryHierarchy).length}フィールド`);

      // 3. バッチ処理で分類実行
      console.log(`🎯 分類処理開始 (バッチサイズ: ${batchSize})`);
      await this.processBatches(questions, categoryHierarchy, batchSize, dryRun);

      // 4. 結果レポート生成
      await this.generateReport(dryRun);

      console.log('🎉 カテゴリ自動分類が完了しました！');
      
    } catch (error) {
      console.error('💥 エラーが発生しました:', error);
      throw error;
    }
  }

  async processBatches(questions, categoryHierarchy, batchSize, dryRun) {
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(questions.length / batchSize);
      
      console.log(`\n📦 バッチ ${batchNumber}/${totalBatches} 処理中...`);
      
      // バッチ内の問題を並列処理
      const batchPromises = batch.map(question => 
        this.processQuestion(question, categoryHierarchy, dryRun)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // 結果を処理
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const question = batch[j];
        
        if (result.status === 'fulfilled') {
          this.results.push({
            questionId: question.id,
            questionNumber: question.question_number,
            success: true,
            ...result.value
          });
        } else {
          console.error(`❌ 問題${question.question_number}の処理失敗:`, result.reason);
          this.results.push({
            questionId: question.id,
            questionNumber: question.question_number,
            success: false,
            error: result.reason?.message || 'Unknown error'
          });
        }
      }
      
      // 進捗表示
      const processed = Math.min(i + batchSize, questions.length);
      console.log(`📈 進捗: ${processed}/${questions.length} (${Math.round(processed/questions.length*100)}%)`);
      
      // レート制限対応（バッチ間の待機）
      if (i + batchSize < questions.length) {
        console.log('⏳ 次のバッチまで待機中...');
        await this.sleep(2000);
      }
    }
  }

  async processQuestion(question, categoryHierarchy, dryRun) {
    console.log(`🔍 問題${question.question_number} を分析中...`);
    
    // 1. Claude による分類
    const classification = await this.classifier.classifyQuestion(question, categoryHierarchy);
    
    if (classification.error) {
      throw new Error(classification.message);
    }

    let newKnowledgeCount = 0;
    let assignedCategories = 0;

    if (!dryRun) {
      // 2. 新規ナレッジの作成
      if (classification.new_knowledge_proposals && classification.new_knowledge_proposals.length > 0) {
        for (const proposal of classification.new_knowledge_proposals) {
          if (proposal.confidence >= 0.7) {
            const exists = await this.supabase.knowledgeExists(
              proposal.field,
              proposal.major,
              proposal.medium,
              proposal.minor,
              proposal.knowledge_name
            );
            
            if (!exists) {
              await this.supabase.createKnowledge(proposal);
              newKnowledgeCount++;
              console.log(`✨ 新規ナレッジ作成: ${proposal.knowledge_name}`);
            }
          }
        }
      }

      // 3. カテゴリ関連付け
      for (const category of classification.categories) {
        const categoryId = await this.supabase.getCategoryId(
          category.field,
          category.major,
          category.medium,
          category.minor,
          category.knowledge
        );
        
        if (categoryId) {
          await this.supabase.assignCategoryToQuestion(
            question.id,
            categoryId,
            {
              relevanceScore: category.relevance_score,
              isPrimary: category.is_primary
            }
          );
          assignedCategories++;
        } else {
          console.warn(`⚠️ カテゴリが見つかりません: ${category.knowledge}`);
        }
      }
    }

    return {
      classification,
      newKnowledgeCount,
      assignedCategories,
      confidence: classification.overall_confidence
    };
  }

  async generateReport(dryRun) {
    const timestamp = new Date().toISOString();
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    const lowConfidence = successful.filter(r => r.confidence < 0.7);
    
    const report = {
      timestamp,
      mode: dryRun ? 'DRY_RUN' : 'PRODUCTION',
      summary: {
        total_questions: this.results.length,
        successful_classifications: successful.length,
        failed_classifications: failed.length,
        low_confidence_count: lowConfidence.length,
        new_knowledge_created: successful.reduce((sum, r) => sum + (r.newKnowledgeCount || 0), 0),
        categories_assigned: successful.reduce((sum, r) => sum + (r.assignedCategories || 0), 0)
      },
      failed_questions: failed.map(r => ({
        questionId: r.questionId,
        questionNumber: r.questionNumber,
        error: r.error
      })),
      low_confidence_questions: lowConfidence.map(r => ({
        questionId: r.questionId,
        questionNumber: r.questionNumber,
        confidence: r.confidence
      })),
      new_knowledge: successful
        .filter(r => r.newKnowledgeCount > 0)
        .map(r => r.classification.new_knowledge_proposals)
        .flat()
    };

    // レポートをファイルに保存
    const filename = `logs/classification-report-${Date.now()}.json`;
    writeFileSync(filename, JSON.stringify(report, null, 2));
    
    console.log('\n📊 分類結果レポート:');
    console.log(`- 総問題数: ${report.summary.total_questions}`);
    console.log(`- 成功: ${report.summary.successful_classifications}`);
    console.log(`- 失敗: ${report.summary.failed_classifications}`);
    console.log(`- 低信頼度: ${report.summary.low_confidence_count}`);
    console.log(`- 新規ナレッジ作成: ${report.summary.new_knowledge_created}`);
    console.log(`- カテゴリ関連付け: ${report.summary.categories_assigned}`);
    console.log(`📄 詳細レポート: ${filename}`);

    return report;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI実行部分
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // コマンドライン引数の解析
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (value !== undefined) {
        options[key] = isNaN(value) ? value : Number(value);
      } else {
        options[key] = true;
      }
    }
  }

  console.log('🔧 実行オプション:', options);
  
  const tool = new CategoryClassificationTool();
  await tool.run(options);
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default CategoryClassificationTool;