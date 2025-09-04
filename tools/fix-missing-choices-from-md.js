#!/usr/bin/env node

/**
 * 特定の試験の選択肢をtext-data.mdから再読み込みして修正するスクリプト
 */

const fs = require('fs').promises;
const path = require('path');
// モジュールのパスを自動判定
let supabaseJs, dotenvPath;
try {
  supabaseJs = require('@supabase/supabase-js');
  dotenvPath = '.env';
} catch (e) {
  supabaseJs = require('../backend/node_modules/@supabase/supabase-js');
  dotenvPath = '../.env';
}

const { createClient } = supabaseJs;
require('dotenv').config({ path: dotenvPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// コマンドライン引数から年度と季節を取得
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('使用方法: node fix-missing-choices-from-md.js <年度> <季節> [問題番号]');
  console.log('例: node fix-missing-choices-from-md.js 2009 秋期');
  console.log('例: node fix-missing-choices-from-md.js 2009 秋期 48');
  console.log('例: node fix-missing-choices-from-md.js 2009 秋期 48-50');
  process.exit(1);
}

const targetYear = parseInt(args[0]);
const targetSeason = args[1];
const targetQuestionRange = args[2]; // 48 または 48-50 の形式

// 問題番号範囲をパース
function parseQuestionRange(range) {
  if (!range) return null;
  
  if (range.includes('-')) {
    const [start, end] = range.split('-').map(n => parseInt(n.trim()));
    return { start, end };
  } else {
    const num = parseInt(range);
    return { start: num, end: num };
  }
}

const questionRange = parseQuestionRange(targetQuestionRange);

// 季節の正規化（秋期、春期など）
function normalizeSeason(season) {
  const seasonMap = {
    '秋': '秋期',
    '秋期': '秋期',
    'a': '秋期',
    '春': '春期',
    '春期': '春期',
    'h': '春期'
  };
  return seasonMap[season.toLowerCase()] || season;
}

// PDFディレクトリのパスを生成
function getPdfDirPath(year, season) {
  const seasonChar = season === '秋期' ? 'a' : 'h';
  return path.join(__dirname, `../../pdfs/${year}_${seasonChar}`);
}

// Markdownから問題を解析
function parseMarkdown(content) {
  const lines = content.split('\n');
  const questions = [];
  let currentQuestion = null;
  let inChoices = false;
  let choiceBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 新しい問題の開始（## 問XX 形式）
    const questionMatch = line.match(/^##\s*問(\d+)/);
    if (questionMatch) {
      // 前の問題を保存
      if (currentQuestion && choiceBuffer.length > 0) {
        currentQuestion.choices = choiceBuffer;
        questions.push(currentQuestion);
      }

      const questionNumber = parseInt(questionMatch[1]);
      currentQuestion = {
        number: questionNumber,
        text: '',
        choices: []
      };
      choiceBuffer = [];
      inChoices = false;
      continue;
    }

    if (currentQuestion) {
      // 選択肢の検出（- ア. 形式、ア. 形式、ア　形式など）
      const choicePatterns = [
        /^[-*]\s*([アイウエ])[.．。　]\s*(.+)$/,  // - ア. または * ア. 形式
        /^([アイウエ])[.．。　]\s*(.+)$/,         // ア. 形式
        /^[-*]\s*([アイウエ])\s*(.+)$/,          // - ア 形式（ピリオドなし）
        /^([アイウエ])\s+(.+)$/                   // ア 形式（スペース区切り）
      ];

      let choiceMatched = false;
      for (const pattern of choicePatterns) {
        const match = line.match(pattern);
        if (match) {
          inChoices = true;
          choiceBuffer.push({
            label: match[1],
            text: match[2].trim()
          });
          choiceMatched = true;
          break;
        }
      }

      // 選択肢の継続行（インデント or 空白で始まる）
      if (!choiceMatched && inChoices && line.match(/^\s+\S/)) {
        if (choiceBuffer.length > 0) {
          choiceBuffer[choiceBuffer.length - 1].text += ' ' + line.trim();
        }
      } else if (!choiceMatched && !inChoices && currentQuestion.text !== undefined) {
        // 問題文の追加（選択肢開始前）
        if (line.trim() && !line.startsWith('#')) {
          currentQuestion.text += (currentQuestion.text ? '\n' : '') + line;
        }
      }
    }
  }

  // 最後の問題を保存
  if (currentQuestion && choiceBuffer.length > 0) {
    currentQuestion.choices = choiceBuffer;
    questions.push(currentQuestion);
  }

  return questions;
}

// 選択肢が不足している問題を検索
async function findQuestionsWithMissingChoices(year, season) {
  console.log(`\n🔍 ${year}年${season}の選択肢状況を確認中...`);

  // 試験情報を取得
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id')
    .eq('year', year)
    .eq('season', season)
    .single();

  if (examError || !exam) {
    console.error(`❌ 試験情報の取得に失敗:`, examError?.message);
    return [];
  }

  // 問題と選択肢を取得
  const { data: questions, error } = await supabase
    .from('questions')
    .select(`
      id,
      question_number,
      question_text,
      is_checked,
      choices (
        id,
        choice_label,
        choice_text
      )
    `)
    .eq('exam_id', exam.id)
    .order('question_number');

  if (error) {
    console.error('❌ エラー:', error);
    return [];
  }

  let filteredQuestions = questions || [];
  
  // 問題番号範囲でフィルタ（指定されている場合）
  if (questionRange) {
    filteredQuestions = filteredQuestions.filter(q => 
      q.question_number >= questionRange.start && 
      q.question_number <= questionRange.end
    );
    console.log(`📌 問題範囲を指定: 問${questionRange.start}${questionRange.start !== questionRange.end ? `-${questionRange.end}` : ''}`);
  }

  const problemQuestions = [];
  for (const q of filteredQuestions) {
    if (!q.choices || q.choices.length === 0) {
      problemQuestions.push({
        ...q,
        status: 'no_choices',
        choiceCount: 0
      });
    } else if (q.choices.some(c => !c.choice_text || c.choice_text.trim() === '')) {
      problemQuestions.push({
        ...q,
        status: 'empty_choices',
        choiceCount: q.choices.length,
        emptyCount: q.choices.filter(c => !c.choice_text || c.choice_text.trim() === '').length
      });
    } else if (questionRange) {
      // 問題番号が指定されている場合は、問題がない場合でも情報表示のため含める
      problemQuestions.push({
        ...q,
        status: 'has_choices',
        choiceCount: q.choices.length
      });
    }
  }

  return problemQuestions;
}

// 選択肢を更新または作成
async function updateOrCreateChoices(questionId, mdChoices, existingChoices = []) {
  console.log(`\n  📝 選択肢を更新中...`);
  
  for (const mdChoice of mdChoices) {
    const existing = existingChoices.find(c => c.choice_label === mdChoice.label);
    
    if (existing) {
      // 既存の選択肢を更新
      if (!existing.choice_text || existing.choice_text.trim() === '') {
        console.log(`    更新: ${mdChoice.label}. ${mdChoice.text.substring(0, 50)}...`);
        const { error } = await supabase
          .from('choices')
          .update({ choice_text: mdChoice.text })
          .eq('id', existing.id);
        
        if (error) {
          console.error(`    ❌ 更新エラー:`, error.message);
        }
      } else {
        console.log(`    スキップ: ${mdChoice.label} (既存データあり)`);
      }
    } else {
      // 新規作成
      console.log(`    作成: ${mdChoice.label}. ${mdChoice.text.substring(0, 50)}...`);
      const { error } = await supabase
        .from('choices')
        .insert({
          question_id: questionId,
          choice_label: mdChoice.label,
          choice_text: mdChoice.text,
          is_correct: false,
          has_image: false
        });
      
      if (error) {
        console.error(`    ❌ 作成エラー:`, error.message);
      }
    }
  }
}

async function main() {
  const season = normalizeSeason(targetSeason);
  const rangeText = questionRange ? 
    ` (問${questionRange.start}${questionRange.start !== questionRange.end ? `-${questionRange.end}` : ''})` : 
    '';
  console.log(`🚀 ${targetYear}年${season}${rangeText}の選択肢修復処理を開始します`);

  // 1. PDFディレクトリのtext-data.mdを読み込み
  const pdfDir = getPdfDirPath(targetYear, season);
  const mdPath = path.join(pdfDir, 'text-data.md');
  
  try {
    const mdContent = await fs.readFile(mdPath, 'utf-8');
    console.log(`✅ Markdownファイルを読み込みました: ${mdPath}`);
    
    // 2. Markdownを解析
    const mdQuestions = parseMarkdown(mdContent);
    console.log(`📋 ${mdQuestions.length}問の問題データを解析しました`);
    
    // デバッグ: 特定の問題（例: 問48）の解析結果を表示
    const q48 = mdQuestions.find(q => q.number === 48);
    if (q48) {
      console.log(`\n🔍 問48の解析結果:`);
      console.log(`  選択肢数: ${q48.choices.length}`);
      q48.choices.forEach(c => {
        console.log(`  ${c.label}: ${c.text.substring(0, 60)}...`);
      });
    }
    
    // 3. データベースから問題を取得
    const problemQuestions = await findQuestionsWithMissingChoices(targetYear, season);
    
    if (problemQuestions.length === 0) {
      console.log('✅ すべての問題に選択肢が正しく登録されています');
      return;
    }
    
    console.log(`\n⚠️  ${problemQuestions.length}問に選択肢の問題があります:`);
    console.log(`  - 選択肢なし: ${problemQuestions.filter(q => q.status === 'no_choices').length}問`);
    console.log(`  - 空の選択肢: ${problemQuestions.filter(q => q.status === 'empty_choices').length}問`);
    
    // 4. 各問題を処理
    const questionsToProcess = problemQuestions.filter(q => 
      q.status === 'no_choices' || q.status === 'empty_choices' || questionRange
    );
    
    for (const dbQuestion of questionsToProcess) {
      const mdQuestion = mdQuestions.find(q => q.number === dbQuestion.question_number);
      
      console.log(`\n問${dbQuestion.question_number}:`);
      console.log(`  DB状態: ${dbQuestion.status} (選択肢: ${dbQuestion.choiceCount}個)`);
      
      if (dbQuestion.status === 'has_choices') {
        console.log(`  ✅ 既に選択肢が正常に登録済み`);
        // 詳細表示
        if (dbQuestion.choices && dbQuestion.choices.length > 0) {
          dbQuestion.choices.forEach(c => {
            console.log(`    ${c.choice_label}: ${c.choice_text.substring(0, 50)}...`);
          });
        }
        continue;
      }
      
      if (!mdQuestion) {
        console.log(`  ❌ Markdownにデータなし`);
        continue;
      }
      
      if (dbQuestion.is_checked) {
        console.log(`  ⚠️  チェック済みのためスキップ`);
        continue;
      }
      
      console.log(`  ✅ Markdownにデータあり (選択肢: ${mdQuestion.choices.length}個)`);
      
      // Markdownから読み取った選択肢を表示
      if (mdQuestion.choices.length > 0) {
        console.log(`  📋 Markdownの選択肢:`);
        mdQuestion.choices.forEach(c => {
          console.log(`    ${c.label}: ${c.text.substring(0, 60)}...`);
        });
        
        await updateOrCreateChoices(
          dbQuestion.id, 
          mdQuestion.choices,
          dbQuestion.choices || []
        );
      } else {
        console.log(`  ⚠️  Markdownでも選択肢が見つかりません`);
        // デバッグ情報を表示
        console.log(`  問題文: ${mdQuestion.text.substring(0, 100)}...`);
      }
    }
    
    // 5. 結果を再確認
    console.log('\n📊 処理後の状態を確認中...');
    const remainingProblems = await findQuestionsWithMissingChoices(targetYear, season);
    
    if (remainingProblems.length === 0) {
      console.log('✅ すべての問題の選択肢が修正されました！');
    } else {
      console.log(`⚠️  まだ ${remainingProblems.length}問に問題があります`);
      remainingProblems.forEach(q => {
        console.log(`  問${q.question_number}: ${q.status}`);
      });
    }
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`❌ ファイルが見つかりません: ${mdPath}`);
      console.log('ヒント: PDFディレクトリ構造を確認してください');
      console.log(`期待されるパス: pdfs/${targetYear}_${season === '秋期' ? 'a' : 'h'}/text-data.md`);
    } else {
      console.error('❌ エラー:', error);
    }
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