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

// 手動で指定する2009年の問題の正解
const manualCorrectAnswers = [
  // 問題3: 排他的論理和 - 「イとウ」が正解（A=0,B=1とA=1,B=0）
  { questionId: 'babd3c35-896a-4397-802a-275e1e57db21', correctLabel: 'エ' },
  
  // 問題5: スタック - 「データの追加と削除が、同じ端（先頭）で行われる」
  { questionId: '1eb2e853-6ebc-4e7c-a050-df34dc5e128e', correctLabel: 'ア' },
  
  // 問題6: キュー - 「FIFO（First In, First Out）」
  { questionId: 'e251489b-4958-47b8-af82-3988435b40cf', correctLabel: 'ア' },
  
  // 問題8: バブルソート - O(n²)
  { questionId: '240993b2-e6f5-42e3-8a58-39a2c1006435', correctLabel: 'ウ' },
  
  // 問題9: リーフ - 「葉（リーフ）」
  { questionId: 'fc10993d-04e0-49c2-a996-a97249960844', correctLabel: 'イ' },
  
  // 問題10: 主キー - 「NULL値を含むことができる」が適切でない
  { questionId: '21c7b971-0227-43b8-8690-a84af3b9ac10', correctLabel: 'ア' },
  
  // 問題13: キャッシュメモリ - 「メインメモリの容量を増加させる」が適切でない
  { questionId: '0903f440-c5b2-4fe7-9e4a-da03be2e0538', correctLabel: 'ウ' },
  
  // 問題14: 仮想記憶 - 「主記憶装置の容量を論理的に拡張する技術」
  { questionId: '38191138-f818-44f2-8831-9368a34e78df', correctLabel: 'ア' },
  
  // 問題16: プロセス管理 - 「プロセスの生成、実行、終了を管理する」
  { questionId: '23d709d0-7fb1-4dd2-800d-957196c794b4', correctLabel: 'ア' },
  
  // 問題17: プリエンプティブ - 「OSが強制的にプロセスのCPU使用権を取り上げることができる」
  { questionId: '35ee2d9c-998a-4f98-acb6-f125dbc59782', correctLabel: 'イ' },
  
  // 問題19: ファイルシステム - 「ディレクトリはファイルを階層的に管理する仕組みである」
  { questionId: 'ba29dde0-a0e5-4d01-a704-a21427464c7e', correctLabel: 'イ' },
  
  // 問題21: トランスポート層 - エンドツーエンド通信
  { questionId: 'd1b05c4a-8d87-4290-8246-1dd50d92df6c', correctLabel: 'エ' },
  
  // 問題24: DHCP - 「IPアドレスの自動割り当て」
  { questionId: '1d58bfba-9059-44a8-aded-160fdb415c09', correctLabel: 'イ' }
];

async function manualFix2009Choices() {
  console.log('2009年秋期の選択肢を手動で修正します...');
  
  try {
    let updatedChoices = 0;
    let errors = 0;

    for (const answer of manualCorrectAnswers) {
      try {
        console.log(`\n問題 ${answer.questionId} の正解を ${answer.correctLabel} に設定中...`);

        // まず該当する問題の全ての選択肢をfalseに設定
        const { error: resetError } = await supabase
          .from('choices')
          .update({ is_correct: false })
          .eq('question_id', answer.questionId);

        if (resetError) {
          console.error(`問題 ${answer.questionId} の選択肢リセットエラー:`, resetError);
          errors++;
          continue;
        }

        // 正解の選択肢をtrueに設定
        const { data, error: updateError } = await supabase
          .from('choices')
          .update({ is_correct: true })
          .eq('question_id', answer.questionId)
          .eq('choice_label', answer.correctLabel)
          .select();

        if (updateError) {
          console.error(`問題 ${answer.questionId} の正解選択肢更新エラー:`, updateError);
          errors++;
        } else if (data && data.length > 0) {
          console.log(`✅ 問題 ${answer.questionId} の選択肢 ${answer.correctLabel} を正解に設定しました`);
          console.log(`   選択肢内容: ${data[0].choice_text?.substring(0, 50)}...`);
          updatedChoices++;
        } else {
          console.log(`⚠️  問題 ${answer.questionId} の選択肢 ${answer.correctLabel} が見つかりませんでした`);
          errors++;
        }

        // レート制限を避けるために短時間待機
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`選択肢更新中にエラー:`, error);
        errors++;
      }
    }

    console.log('\n=== 手動修正完了 ===');
    console.log(`更新された選択肢: ${updatedChoices}件`);
    console.log(`エラー数: ${errors}件`);
    
    if (errors === 0) {
      console.log('\n🎉 全ての手動修正が正常に完了しました！');
    } else {
      console.log('\n⚠️  一部の更新でエラーが発生しました。ログを確認してください。');
    }

  } catch (error) {
    console.error('手動修正スクリプト実行エラー:', error);
    process.exit(1);
  }
}

// スクリプト実行
manualFix2009Choices();