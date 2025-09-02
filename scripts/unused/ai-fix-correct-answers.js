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

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
  const matrix = Array.from({ length: str1.length + 1 }, () => Array(str2.length + 1).fill(0));
  
  for (let i = 0; i <= str1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  return matrix[str1.length][str2.length];
}

// Fuzzy matching with multiple strategies
function findBestMatch(answer, choices) {
  if (!answer || !choices || choices.length === 0) return null;
  
  const normalizeText = (text) => text.replace(/[\s\-～・、，]/g, '').toLowerCase();
  const normalizedAnswer = normalizeText(answer);
  
  let bestMatch = null;
  let bestScore = Infinity;
  let matchReason = '';
  
  for (const choice of choices) {
    if (!choice.choice_text) continue;
    
    const choiceText = choice.choice_text;
    const normalizedChoice = normalizeText(choiceText);
    
    // Strategy 1: Exact match
    if (normalizedAnswer === normalizedChoice) {
      return { choice, score: 0, reason: '完全一致' };
    }
    
    // Strategy 2: Contains match (bidirectional)
    if (normalizedAnswer.includes(normalizedChoice) || normalizedChoice.includes(normalizedAnswer)) {
      const score = Math.abs(normalizedAnswer.length - normalizedChoice.length);
      if (score < bestScore) {
        bestMatch = choice;
        bestScore = score;
        matchReason = '部分一致';
      }
    }
    
    // Strategy 3: Levenshtein distance
    const distance = levenshteinDistance(normalizedAnswer, normalizedChoice);
    const similarity = 1 - (distance / Math.max(normalizedAnswer.length, normalizedChoice.length));
    
    if (similarity > 0.7 && distance < bestScore) { // 70% similarity threshold
      bestMatch = choice;
      bestScore = distance;
      matchReason = `文字列類似度: ${(similarity * 100).toFixed(1)}%`;
    }
    
    // Strategy 4: Keyword matching for longer texts
    if (normalizedAnswer.length > 10) {
      const answerKeywords = answer.split(/[\s、，・\-～]+/).filter(w => w.length > 1);
      const choiceKeywords = choiceText.split(/[\s、，・\-～]+/).filter(w => w.length > 1);
      
      const matchingKeywords = answerKeywords.filter(ak => 
        choiceKeywords.some(ck => 
          normalizeText(ak) === normalizeText(ck) || 
          normalizeText(ak).includes(normalizeText(ck)) ||
          normalizeText(ck).includes(normalizeText(ak))
        )
      );
      
      const keywordScore = matchingKeywords.length / Math.max(answerKeywords.length, 1);
      if (keywordScore > 0.5 && keywordScore * 100 > bestScore) {
        bestMatch = choice;
        bestScore = keywordScore * 100;
        matchReason = `キーワード一致: ${matchingKeywords.length}/${answerKeywords.length}語`;
      }
    }
    
    // Strategy 5: Mathematical expressions
    if (/[\d\+\-\*\/\(\)\^\$]/.test(answer) && /[\d\+\-\*\/\(\)\^\$]/.test(choiceText)) {
      const cleanAnswer = answer.replace(/[\s\$\\]/g, '');
      const cleanChoice = choiceText.replace(/[\s\$\\]/g, '');
      const mathDistance = levenshteinDistance(cleanAnswer, cleanChoice);
      
      if (mathDistance < 3 && mathDistance < bestScore) {
        bestMatch = choice;
        bestScore = mathDistance;
        matchReason = '数式一致';
      }
    }
  }
  
  return bestMatch ? { choice: bestMatch, score: bestScore, reason: matchReason } : null;
}

async function intelligentFixCorrectAnswers() {
  console.log('AI-powered解説から正解を抽出して選択肢を更新します...');
  
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
        const explanation = question.explanation || '';
        
        // より多くのパターンで正解を抽出
        const patterns = [
          /\*\*正解[：:]\s*([ア-エ])\*\*/,
          /正解[：:]\s*([ア-エ])/,
          /答え[：:]\s*([ア-エ])/,
          /\*\*([ア-エ])\*\*.*?正解/,
          /\*\*正解[：:]\s*(.+?)\*\*/,
          /正解[：:]\s*(.+?)(?:\n|$)/m,
          /答え[：:]\s*(.+?)(?:\n|$)/m,
          /\*\*(.+?)\*\*.*?正解/,
          /が正解.*?([ア-エ])/,
          /([ア-エ]).*?が正解/,
        ];

        let correctAnswer = null;
        let correctChoice = null;
        let matchInfo = null;

        // パターンマッチング
        for (const pattern of patterns) {
          const match = explanation.match(pattern);
          if (match) {
            const candidate = match[1].trim();
            console.log(`問題${question.question_number}: 候補「${candidate}」を抽出`);
            
            // 選択肢記号の場合
            if (/^[ア-エ]$/.test(candidate)) {
              correctChoice = question.choices.find(c => c.choice_label === candidate);
              if (correctChoice) {
                correctAnswer = candidate;
                matchInfo = { reason: '選択肢記号一致' };
                break;
              }
            } else {
              // テキスト内容の場合、AI fuzzy matchingを使用
              const result = findBestMatch(candidate, question.choices);
              if (result && result.choice) {
                correctChoice = result.choice;
                correctAnswer = result.choice.choice_label;
                matchInfo = result;
                console.log(`  ✓ AIマッチング成功: ${correctAnswer} (${result.reason})`);
                break;
              }
            }
          }
        }

        if (!correctChoice) {
          console.log(`問題${question.question_number}: 正解が見つかりませんでした`);
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

        const reason = matchInfo ? ` (${matchInfo.reason})` : '';
        console.log(`✅ 問題${question.question_number}: ${correctAnswer} を正解に設定しました${reason}`);
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
intelligentFixCorrectAnswers();