#!/usr/bin/env node

import { readFileSync } from 'fs';

const API_BASE_URL = 'http://localhost:43001';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjZWMyMTJjZC1iOWIyLTRkYWEtODhiYy0zMjc5YmNlYjRhNDIiLCJlbWFpbCI6ImluZm9Aa2lub2tvZGF0YS5uZXQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTY5MDU0NzUsImV4cCI6MTc1Njk5MTg3NX0.dmryiwBL4djMBPWoQrzwirH93qsFoOCCaiDuZ5nXCS0';

// API呼び出し関数
async function apiCall(endpoint, method = 'GET', body = null) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
    body: body ? JSON.stringify(body) : null
  });
  
  return await response.json();
}

// キーワードベースでカテゴリをマッチング
function matchCategories(questionText, categories, maxMatches = 3) {
  const matches = [];
  const text = questionText.toLowerCase();
  
  for (const category of categories) {
    const knowledge = category.knowledge_item.toLowerCase();
    const categoryName = category.name.toLowerCase();
    
    // 直接マッチング
    if (text.includes(knowledge) || text.includes(categoryName)) {
      matches.push({
        category,
        score: 1.0,
        matchType: 'direct',
        matchedTerm: knowledge
      });
      continue;
    }
    
    // 部分マッチング（より柔軟な検索）
    const keywords = knowledge.split(/[・、，,\s\(\)（）]+/).filter(k => k.length > 1);
    let partialScore = 0;
    let matchedTerms = [];
    
    for (const keyword of keywords) {
      if (keyword.length > 1 && text.includes(keyword)) {
        partialScore += 0.3;
        matchedTerms.push(keyword);
      }
    }
    
    if (partialScore > 0.3) {
      matches.push({
        category,
        score: partialScore,
        matchType: 'partial',
        matchedTerm: matchedTerms.join(', ')
      });
    }
  }
  
  // スコアでソートして上位を返す
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, maxMatches);
}

async function processExamQuestions(year, season, examId) {
  console.log(`\n📚 ${year}年${season} の処理を開始...`);
  
  // 問題を取得
  const questionsResult = await apiCall(`/api/questions?year=${year}&season=${encodeURIComponent(season)}&limit=100`);
  if (!questionsResult.success) {
    console.error(`❌ 問題取得エラー:`, questionsResult.error);
    return;
  }
  
  const questions = questionsResult.data;
  console.log(`📝 ${questions.length}問の問題を取得`);
  
  // ナレッジレベルカテゴリを取得
  const categoriesResult = await apiCall('/api/categories/hierarchy?level=5&exam_code=FE');
  if (!categoriesResult.success) {
    console.error(`❌ カテゴリ取得エラー:`, categoriesResult.error);
    return;
  }
  
  const categories = categoriesResult.data;
  console.log(`🏷️ ${categories.length}個のナレッジカテゴリを取得`);
  
  let processedCount = 0;
  let categorizedCount = 0;
  
  for (const question of questions) {
    processedCount++;
    
    // 問題文と選択肢を結合してテキストを作成
    let questionText = question.question_text || '';
    if (question.choices && question.choices.length > 0) {
      questionText += ' ' + question.choices.map(c => c.choice_text).join(' ');
    }
    
    // カテゴリマッチング
    const matches = matchCategories(questionText, categories, 3);
    
    if (matches.length > 0) {
      console.log(`\n🔍 問題${question.question_number}: "${question.question_text?.substring(0, 50)}..."`);
      
      for (const match of matches) {
        try {
          // カテゴリを問題に関連付け
          const assignResult = await apiCall(`/api/categories/question/${question.id}`, 'POST', {
            categoryId: match.category.id,
            relevance_score: match.score,
            is_primary: matches.indexOf(match) === 0,
            notes: `自動分類: ${match.matchType}マッチ (${match.matchedTerm})`
          });
          
          if (assignResult.success) {
            console.log(`  ✅ ${match.category.path} (スコア: ${match.score.toFixed(2)})`);
            if (matches.indexOf(match) === 0) categorizedCount++;
          } else {
            console.log(`  ⚠️ 関連付けエラー: ${match.category.name} - ${assignResult.error?.message}`);
          }
          
          // API制限を避けるため少し待機
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.log(`  ❌ API呼び出しエラー: ${error.message}`);
        }
      }
    } else {
      console.log(`❓ 問題${question.question_number}: カテゴリマッチなし`);
    }
    
    if (processedCount % 10 === 0) {
      console.log(`\n📊 進捗: ${processedCount}/${questions.length} 処理済み, ${categorizedCount}問分類済み`);
    }
  }
  
  console.log(`\n✅ ${year}年${season} 完了: ${processedCount}問処理, ${categorizedCount}問分類`);
  return { processed: processedCount, categorized: categorizedCount };
}

async function autoCategorizaAllQuestions() {
  console.log('🤖 全問題の自動カテゴリ分類を開始...');
  
  try {
    // 全試験情報を取得
    const examsResult = await apiCall('/api/exams');
    if (!examsResult.success) {
      console.error('❌ 試験一覧取得エラー:', examsResult.error);
      return;
    }
    
    const exams = examsResult.data.filter(exam => 
      exam.year >= 2009 && 
      exam.year <= 2019 && 
      exam.season !== 'オリジナル' &&
      exam.total_questions > 50
    );
    
    console.log(`📋 処理対象: ${exams.length}試験`);
    
    let totalProcessed = 0;
    let totalCategorized = 0;
    
    for (const exam of exams) {
      const result = await processExamQuestions(exam.year, exam.season, exam.id);
      if (result) {
        totalProcessed += result.processed;
        totalCategorized += result.categorized;
      }
      
      // 試験間で少し休憩
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 全問題の自動カテゴリ分類完了！');
    console.log(`📊 最終結果: ${totalProcessed}問処理, ${totalCategorized}問分類`);
    
  } catch (error) {
    console.error('💥 エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  autoCategorizaAllQuestions();
}