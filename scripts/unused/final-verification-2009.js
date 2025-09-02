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

// 2009年の問題IDのリスト
const question2009Ids = [
  '225dba6b-0e9e-4f15-b40b-4272d639454a', // 問題1: 16進数変換
  'ed71ce45-96f4-4a05-abf5-05fb30543294',  // 問題2: 2の補数
  'babd3c35-896a-4397-802a-275e1e57db21',  // 問題3: XOR
  'e7d070bf-b39a-4049-a8d4-b0509fd42961',  // 問題4: 浮動小数点
  '1eb2e853-6ebc-4e7c-a050-df34dc5e128e',  // 問題5: スタック
  'e251489b-4958-47b8-af82-3988435b40cf',  // 問題6: キュー
  'add32ec6-21b9-4cc8-adfb-68dfea6902de',  // 問題7: 2分探索
  '240993b2-e6f5-42e3-8a58-39a2c1006435',  // 問題8: バブルソート
  'fc10993d-04e0-49c2-a996-a97249960844',  // 問題9: リーフ
  '21c7b971-0227-43b8-8690-a84af3b9ac10',  // 問題10: 主キー
  'c718a510-d0d1-434b-ab00-26b78b2a4b77',  // 問題11: SELECT
  '23d4968b-3908-4ae8-beb0-d6baaf6c8d8a',  // 問題12: MIPS
  '0903f440-c5b2-4fe7-9e4a-da03be2e0538',  // 問題13: キャッシュメモリ
  '38191138-f818-44f2-8831-9368a34e78df',  // 問題14: 仮想記憶
  '23d709d0-7fb1-4dd2-800d-957196c794b4',  // 問題16: プロセス管理
  '35ee2d9c-998a-4f98-acb6-f125dbc59782',  // 問題17: プリエンプティブ
  'ba29dde0-a0e5-4d01-a704-a21427464c7e',  // 問題19: ファイルシステム
  'fc7a5001-f2e8-49c9-a60d-8c07bf5eb45a',  // 問題20: IP
  'd1b05c4a-8d87-4290-8246-1dd50d92df6c',  // 問題21: トランスポート層
  '2e1d174b-4e04-4c20-9af4-35076ae6ff00',  // 問題23: サブネット
  '1d58bfba-9059-44a8-aded-160fdb415c09'   // 問題24: DHCP
];

async function finalVerification2009() {
  console.log('2009年秋期基本情報技術者試験の最終検証を実行します...');
  
  try {
    let questionsWithExplanations = 0;
    let questionsWithCorrectChoices = 0;
    let totalQuestions = question2009Ids.length;

    console.log('\n=== 全問題の検証 ===');
    
    for (let i = 0; i < question2009Ids.length; i++) {
      const questionId = question2009Ids[i];
      
      try {
        // 問題の解説を確認
        const { data: question, error: questionError } = await supabase
          .from('questions')
          .select('id, question_number, explanation')
          .eq('id', questionId)
          .single();

        if (questionError) {
          console.error(`問題 ${questionId} の取得エラー:`, questionError);
          continue;
        }

        // 選択肢の正解設定を確認
        const { data: choices, error: choicesError } = await supabase
          .from('choices')
          .select('choice_label, is_correct')
          .eq('question_id', questionId)
          .order('choice_label');

        if (choicesError) {
          console.error(`問題 ${questionId} の選択肢取得エラー:`, choicesError);
          continue;
        }

        const hasExplanation = question.explanation && question.explanation.trim().length > 0;
        const correctChoices = choices.filter(c => c.is_correct);
        const hasCorrectChoice = correctChoices.length === 1;

        if (hasExplanation) questionsWithExplanations++;
        if (hasCorrectChoice) questionsWithCorrectChoices++;

        const explanationStatus = hasExplanation ? '✅' : '❌';
        const choiceStatus = hasCorrectChoice ? '✅' : '❌';
        const correctLabel = hasCorrectChoice ? correctChoices[0].choice_label : '未設定';

        console.log(`問題${question.question_number}: ${explanationStatus} 解説 ${choiceStatus} 正解(${correctLabel})`);

        if (!hasExplanation) {
          console.log(`  ⚠️  解説が設定されていません`);
        }
        
        if (!hasCorrectChoice) {
          if (correctChoices.length === 0) {
            console.log(`  ⚠️  正解が設定されていません`);
          } else {
            console.log(`  ⚠️  複数の正解が設定されています: ${correctChoices.map(c => c.choice_label).join(', ')}`);
          }
        }

      } catch (error) {
        console.error(`問題 ${questionId} の検証中にエラー:`, error);
      }
    }

    console.log('\n=== 最終結果 ===');
    console.log(`対象問題数: ${totalQuestions}件`);
    console.log(`解説が設定された問題: ${questionsWithExplanations}件 (${Math.round(questionsWithExplanations/totalQuestions*100)}%)`);
    console.log(`正解が設定された問題: ${questionsWithCorrectChoices}件 (${Math.round(questionsWithCorrectChoices/totalQuestions*100)}%)`);

    if (questionsWithExplanations === totalQuestions && questionsWithCorrectChoices === totalQuestions) {
      console.log('\n🎉 全ての問題に解説と正解が正しく設定されました！');
    } else {
      console.log('\n⚠️  一部の問題で未設定の項目があります。上記のログを確認してください。');
    }

  } catch (error) {
    console.error('最終検証スクリプト実行エラー:', error);
    process.exit(1);
  }
}

// スクリプト実行
finalVerification2009();