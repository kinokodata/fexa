#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .envファイルを読み込み
dotenv.config();

console.log('Environment check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Set' : 'Not set');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('環境変数が設定されていません。.envファイルを確認してください。');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixCorrectAnswers() {
  console.log('解説から正解を抽出して選択肢を更新します...');
  
  try {
    // 解説がある問題を取得
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id, 
        question_number, 
        explanation,
        choices(id, choice_label, choice_text, is_correct)
      `)
      .not('explanation', 'is', null);

    if (questionsError) {
      throw questionsError;
    }

    if (!questions || questions.length === 0) {
      console.log('解説がある問題が見つかりませんでした。');
      return;
    }

    console.log(`解説がある問題: ${questions.length}件`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const question of questions) {
      try {
        // 解説から正解を抽出（複数のパターンに対応）
        const explanation = question.explanation || '';
        
        // まず選択肢記号のパターンを試す
        let correctAnswer = null;
        let correctChoice = null;
        
        const labelPatterns = [
          /\*\*正解:\s*([ア-エ])/,
          /正解:\s*([ア-エ])/,
          /答え:\s*([ア-エ])/,
          /\*\*([ア-エ])\*\*.*正解/,
        ];

        for (const pattern of labelPatterns) {
          const match = explanation.match(pattern);
          if (match) {
            correctAnswer = match[1];
            correctChoice = question.choices.find(c => c.choice_label === correctAnswer);
            break;
          }
        }

        // 選択肢記号が見つからない場合、解説の正解内容と選択肢を照合
        if (!correctChoice) {
          const answerPatterns = [
            /\*\*正解:\s*(.+?)\*\*/,
            /正解:\s*(.+?)$/m,
            /答え:\s*(.+?)$/m,
          ];

          for (const pattern of answerPatterns) {
            const match = explanation.match(pattern);
            if (match) {
              const answerText = match[1].trim();
              console.log(`問題${question.question_number}: 解説から抽出した答え: "${answerText}"`);
              
              // より柔軟なマッチング
              correctChoice = question.choices.find(c => {
                if (!c.choice_text) return false;
                
                const choiceText = c.choice_text.trim();
                console.log(`  選択肢${c.choice_label}: "${choiceText}"`);
                
                // 完全一致
                if (choiceText === answerText) return true;
                
                // 部分一致（双方向）
                if (choiceText.includes(answerText) || answerText.includes(choiceText)) return true;
                
                // 数値範囲のマッチング（例：-128から127、-128 から 127）
                if (answerText.includes('から') && choiceText.includes('から')) {
                  const normalizeRange = (text) => text.replace(/\s+/g, '').replace(/～/g, 'から');
                  if (normalizeRange(answerText) === normalizeRange(choiceText)) return true;
                }
                
                // キーワードベースのマッチング
                const answerKeywords = answerText.split(/[\s、，・]+/).filter(w => w.length > 1);
                const choiceKeywords = choiceText.split(/[\s、，・]+/).filter(w => w.length > 1);
                
                // 3つ以上の単語があり、2つ以上マッチする場合
                if (answerKeywords.length >= 3) {
                  const matchCount = answerKeywords.filter(word => 
                    choiceKeywords.some(cw => cw.includes(word) || word.includes(cw))
                  ).length;
                  if (matchCount >= 2) return true;
                }
                
                return false;
              });
              
              if (correctChoice) {
                correctAnswer = correctChoice.choice_label;
                console.log(`  ✓ マッチ: ${correctAnswer}`);
                break;
              } else {
                console.log('  ✗ マッチする選択肢なし');
              }
            }
          }
        }

        if (!correctChoice) {
          console.log(`問題${question.question_number}: 正解が見つかりませんでした (解説: "${explanation.substring(0, 100)}...")`);
          skippedCount++;
          continue;
        }

        // 既に正解が設定されている場合はスキップ
        if (correctChoice.is_correct) {
          console.log(`問題${question.question_number}: 既に正解が設定されています (${correctAnswer})`);
          skippedCount++;
          continue;
        }

        // 全ての選択肢のis_correctをfalseに設定してから、正解をtrueに設定
        const choiceIds = question.choices.map(c => c.id);
        
        // まず全てをfalseに
        const { error: resetError } = await supabase
          .from('choices')
          .update({ is_correct: false })
          .in('id', choiceIds);

        if (resetError) {
          console.error(`問題${question.question_number}: リセットエラー:`, resetError);
          continue;
        }

        // 正解をtrueに設定
        const { error: updateError } = await supabase
          .from('choices')
          .update({ is_correct: true })
          .eq('id', correctChoice.id);

        if (updateError) {
          console.error(`問題${question.question_number}: 更新エラー:`, updateError);
          continue;
        }

        console.log(`✅ 問題${question.question_number}: ${correctAnswer} を正解に設定しました`);
        updatedCount++;

      } catch (error) {
        console.error(`問題${question.question_number}の処理中にエラー:`, error);
        skippedCount++;
      }
    }

    console.log('\n=== 処理完了 ===');
    console.log(`更新された問題: ${updatedCount}件`);
    console.log(`スキップされた問題: ${skippedCount}件`);
    console.log(`合計処理数: ${questions.length}件`);

  } catch (error) {
    console.error('スクリプト実行エラー:', error);
    process.exit(1);
  }
}

// スクリプト実行
fixCorrectAnswers();