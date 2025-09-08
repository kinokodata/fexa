#!/usr/bin/env node

/**
 * 選択肢が登録されていない問題に空の選択肢を作成するスクリプト
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findQuestionsWithoutChoices() {
  console.log('🔍 選択肢がない問題を検索中...');
  
  const { data: questions, error } = await supabase
    .from('questions')
    .select(`
      id,
      question_number,
      question_text,
      exams (
        year,
        season
      )
    `)
    .is('choices.id', null)
    .order('question_number');

  if (error) {
    console.error('❌ エラー:', error);
    return [];
  }

  // 選択肢の存在を確認（左結合で取得できないため個別チェック）
  const questionsWithoutChoices = [];
  
  for (const question of questions || []) {
    const { count } = await supabase
      .from('choices')
      .select('*', { count: 'exact', head: true })
      .eq('question_id', question.id);
    
    if (count === 0) {
      questionsWithoutChoices.push(question);
    }
  }

  return questionsWithoutChoices;
}

async function createEmptyChoices(questionId) {
  const choiceLabels = ['ア', 'イ', 'ウ', 'エ'];
  const choices = choiceLabels.map(label => ({
    question_id: questionId,
    choice_label: label,
    choice_text: '',
    is_correct: false,
    has_image: false
  }));

  const { data, error } = await supabase
    .from('choices')
    .insert(choices);

  if (error) {
    console.error(`❌ 選択肢作成エラー (question_id: ${questionId}):`, error.message);
    return false;
  }

  return true;
}

async function main() {
  console.log('🚀 選択肢修復処理を開始します');
  
  // 1. 選択肢がない問題を検索
  const questions = await findQuestionsWithoutChoices();
  
  if (questions.length === 0) {
    console.log('✅ 選択肢がない問題はありません');
    return;
  }

  console.log(`📋 ${questions.length}件の問題に選択肢がありません`);
  
  // 年度・季節ごとの統計を表示
  const stats = {};
  questions.forEach(q => {
    const key = `${q.exams?.year || 'unknown'}_${q.exams?.season || 'unknown'}`;
    stats[key] = (stats[key] || 0) + 1;
  });
  
  console.log('\n📊 年度・季節別の分布:');
  Object.entries(stats)
    .sort(([a], [b]) => b.localeCompare(a))
    .forEach(([key, count]) => {
      const [year, season] = key.split('_');
      console.log(`  ${year}年 ${season}: ${count}件`);
    });

  // 2. ユーザーに確認
  console.log('\n⚠️  これらの問題に空の選択肢（ア、イ、ウ、エ）を作成します。');
  console.log('続行するには Enterキーを押してください。中止する場合は Ctrl+C を押してください。');
  
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  // 3. 空の選択肢を作成
  console.log('\n📝 空の選択肢を作成中...');
  
  let successCount = 0;
  let failureCount = 0;
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const success = await createEmptyChoices(question.id);
    
    if (success) {
      successCount++;
      console.log(`✅ [${i + 1}/${questions.length}] 問題${question.question_number}: 選択肢を作成しました`);
    } else {
      failureCount++;
      console.log(`❌ [${i + 1}/${questions.length}] 問題${question.question_number}: 作成失敗`);
    }
    
    // API制限を避けるため少し待機
    if ((i + 1) % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // 4. 結果を表示
  console.log('\n🎉 処理完了!');
  console.log(`✅ 成功: ${successCount}件`);
  console.log(`❌ 失敗: ${failureCount}件`);
  
  // 5. 再確認
  const remainingQuestions = await findQuestionsWithoutChoices();
  if (remainingQuestions.length > 0) {
    console.log(`\n⚠️  まだ ${remainingQuestions.length}件の問題に選択肢がありません`);
  } else {
    console.log('\n✅ すべての問題に選択肢が設定されました');
  }
}

// 実行
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 エラーが発生しました:', error);
      process.exit(1);
    });
}

module.exports = { findQuestionsWithoutChoices, createEmptyChoices };