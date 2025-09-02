#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .envファイルを読み込み
dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('環境変数が設定されていません。.envファイルを確認してください。');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function verify2009Updates() {
  console.log('2009年秋期基本情報技術者試験の更新状況を確認します...');
  
  try {
    // サンプルの問題IDを確認
    const sampleQuestionIds = [
      '225dba6b-0e9e-4f15-b40b-4272d639454a', // 問題1: 16進数2Aを10進数に変換
      'ed71ce45-96f4-4a05-abf5-05fb30543294',  // 問題2: 8ビット2の補数
      'babd3c35-896a-4397-802a-275e1e57db21'   // 問題3: 排他的論理和
    ];

    console.log('\n=== 解説の確認 ===');
    for (const questionId of sampleQuestionIds) {
      const { data, error } = await supabase
        .from('questions')
        .select('id, question_number, explanation')
        .eq('id', questionId)
        .single();

      if (error) {
        console.error(`問題 ${questionId} の取得エラー:`, error);
        continue;
      }

      console.log(`\n問題${data.question_number} (${questionId}):`);
      if (data.explanation) {
        console.log('✅ 解説が設定されています');
        console.log(`解説の長さ: ${data.explanation.length}文字`);
        console.log(`解説の先頭: ${data.explanation.substring(0, 100)}...`);
      } else {
        console.log('❌ 解説が設定されていません');
      }
    }

    // 選択肢の正解設定状況を確認
    console.log('\n=== 選択肢の正解設定状況の確認 ===');
    for (const questionId of sampleQuestionIds) {
      const { data: choices, error } = await supabase
        .from('choices')
        .select('choice_label, choice_text, is_correct')
        .eq('question_id', questionId)
        .order('choice_label');

      if (error) {
        console.error(`問題 ${questionId} の選択肢取得エラー:`, error);
        continue;
      }

      console.log(`\n問題 ${questionId} の選択肢:`);
      choices.forEach(choice => {
        const status = choice.is_correct ? '✅ 正解' : '⭕ 通常';
        console.log(`  ${choice.choice_label}: ${status} - ${choice.choice_text?.substring(0, 50)}...`);
      });
    }

    // 解説が設定された問題の総数を確認
    console.log('\n=== 全体統計 ===');
    const { data: totalWithExplanation, error: countError } = await supabase
      .from('questions')
      .select('id', { count: 'exact' })
      .not('explanation', 'is', null);

    if (countError) {
      console.error('統計取得エラー:', countError);
    } else {
      console.log(`解説が設定されている問題の総数: ${totalWithExplanation.length}件`);
    }

  } catch (error) {
    console.error('検証スクリプト実行エラー:', error);
    process.exit(1);
  }
}

// スクリプト実行
verify2009Updates();