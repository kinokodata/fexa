#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// 環境変数の読み込み
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URLまたはSUPABASE_ANON_KEYが設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// IT用語辞書（基本的なものから拡張可能）
const IT_KEYWORDS = {
  // ネットワーク
  'TCP/IP': { category: 'ネットワーク', priority: 'high' },
  'TCP': { category: 'ネットワーク', priority: 'high' },
  'IP': { category: 'ネットワーク', priority: 'high' },
  'HTTP': { category: 'ネットワーク', priority: 'high' },
  'HTTPS': { category: 'ネットワーク', priority: 'high' },
  'DNS': { category: 'ネットワーク', priority: 'high' },
  'DHCP': { category: 'ネットワーク', priority: 'high' },
  'FTP': { category: 'ネットワーク', priority: 'medium' },
  'SMTP': { category: 'ネットワーク', priority: 'medium' },
  'POP': { category: 'ネットワーク', priority: 'medium' },
  'IMAP': { category: 'ネットワーク', priority: 'medium' },
  'SSL': { category: 'ネットワーク', priority: 'high' },
  'TLS': { category: 'ネットワーク', priority: 'high' },
  'VPN': { category: 'ネットワーク', priority: 'high' },
  'LAN': { category: 'ネットワーク', priority: 'high' },
  'WAN': { category: 'ネットワーク', priority: 'high' },
  'ファイアウォール': { category: 'ネットワーク', priority: 'high' },
  'ルータ': { category: 'ネットワーク', priority: 'high' },
  'スイッチ': { category: 'ネットワーク', priority: 'high' },
  'プロキシ': { category: 'ネットワーク', priority: 'medium' },
  
  // セキュリティ
  '暗号化': { category: 'セキュリティ', priority: 'high' },
  'パスワード': { category: 'セキュリティ', priority: 'high' },
  '認証': { category: 'セキュリティ', priority: 'high' },
  '認可': { category: 'セキュリティ', priority: 'high' },
  'デジタル署名': { category: 'セキュリティ', priority: 'high' },
  'PKI': { category: 'セキュリティ', priority: 'medium' },
  'RSA': { category: 'セキュリティ', priority: 'medium' },
  'AES': { category: 'セキュリティ', priority: 'medium' },
  'MD5': { category: 'セキュリティ', priority: 'medium' },
  'SHA': { category: 'セキュリティ', priority: 'medium' },
  'ハッシュ': { category: 'セキュリティ', priority: 'high' },
  'ウイルス': { category: 'セキュリティ', priority: 'high' },
  'マルウェア': { category: 'セキュリティ', priority: 'high' },
  'スパイウェア': { category: 'セキュリティ', priority: 'medium' },
  'フィッシング': { category: 'セキュリティ', priority: 'high' },
  
  // データベース
  'SQL': { category: 'データベース', priority: 'high' },
  'SELECT': { category: 'データベース', priority: 'high' },
  'INSERT': { category: 'データベース', priority: 'high' },
  'UPDATE': { category: 'データベース', priority: 'high' },
  'DELETE': { category: 'データベース', priority: 'high' },
  'JOIN': { category: 'データベース', priority: 'high' },
  'INNER JOIN': { category: 'データベース', priority: 'high' },
  'LEFT JOIN': { category: 'データベース', priority: 'medium' },
  'RIGHT JOIN': { category: 'データベース', priority: 'medium' },
  'WHERE': { category: 'データベース', priority: 'high' },
  'GROUP BY': { category: 'データベース', priority: 'high' },
  'ORDER BY': { category: 'データベース', priority: 'high' },
  'PRIMARY KEY': { category: 'データベース', priority: 'high' },
  'FOREIGN KEY': { category: 'データベース', priority: 'high' },
  'インデックス': { category: 'データベース', priority: 'high' },
  'トランザクション': { category: 'データベース', priority: 'high' },
  'ACID': { category: 'データベース', priority: 'medium' },
  '正規化': { category: 'データベース', priority: 'high' },
  'ER図': { category: 'データベース', priority: 'medium' },
  
  // プログラミング
  'オブジェクト指向': { category: 'プログラミング', priority: 'high' },
  'クラス': { category: 'プログラミング', priority: 'high' },
  'インスタンス': { category: 'プログラミング', priority: 'high' },
  '継承': { category: 'プログラミング', priority: 'high' },
  'ポリモーフィズム': { category: 'プログラミング', priority: 'medium' },
  'カプセル化': { category: 'プログラミング', priority: 'medium' },
  'Java': { category: 'プログラミング', priority: 'high' },
  'JavaScript': { category: 'プログラミング', priority: 'high' },
  'Python': { category: 'プログラミング', priority: 'high' },
  'C言語': { category: 'プログラミング', priority: 'high' },
  'C++': { category: 'プログラミング', priority: 'medium' },
  'アルゴリズム': { category: 'プログラミング', priority: 'high' },
  'ソート': { category: 'プログラミング', priority: 'high' },
  '探索': { category: 'プログラミング', priority: 'high' },
  'バブルソート': { category: 'プログラミング', priority: 'medium' },
  'クイックソート': { category: 'プログラミング', priority: 'medium' },
  '二分探索': { category: 'プログラミング', priority: 'medium' },
  
  // システム開発
  'ウォーターフォール': { category: 'システム開発', priority: 'high' },
  'アジャイル': { category: 'システム開発', priority: 'high' },
  'スクラム': { category: 'システム開発', priority: 'medium' },
  '要件定義': { category: 'システム開発', priority: 'high' },
  '基本設計': { category: 'システム開発', priority: 'high' },
  '詳細設計': { category: 'システム開発', priority: 'high' },
  'テスト': { category: 'システム開発', priority: 'high' },
  '単体テスト': { category: 'システム開発', priority: 'high' },
  '結合テスト': { category: 'システム開発', priority: 'high' },
  'システムテスト': { category: 'システム開発', priority: 'high' },
  '受入テスト': { category: 'システム開発', priority: 'medium' },
  'バージョン管理': { category: 'システム開発', priority: 'high' },
  'Git': { category: 'システム開発', priority: 'high' },
  
  // ハードウェア
  'CPU': { category: 'ハードウェア', priority: 'high' },
  'メモリ': { category: 'ハードウェア', priority: 'high' },
  'RAM': { category: 'ハードウェア', priority: 'high' },
  'ROM': { category: 'ハードウェア', priority: 'high' },
  'HDD': { category: 'ハードウェア', priority: 'high' },
  'SSD': { category: 'ハードウェア', priority: 'high' },
  'キャッシュ': { category: 'ハードウェア', priority: 'high' },
  'バス': { category: 'ハードウェア', priority: 'medium' },
  'I/O': { category: 'ハードウェア', priority: 'high' },
  'USB': { category: 'ハードウェア', priority: 'high' },
  'Bluetooth': { category: 'ハードウェア', priority: 'high' },
  'Wi-Fi': { category: 'ハードウェア', priority: 'high' }
};

// テキストからキーワードを抽出する関数
function extractKeywords(text) {
  if (!text) return [];
  
  const keywords = [];
  const normalizedText = text.toLowerCase();
  
  for (const [keyword, info] of Object.entries(IT_KEYWORDS)) {
    const keywordVariations = [
      keyword,
      keyword.toLowerCase(),
      keyword.toUpperCase()
    ];
    
    // キーワードが含まれているかチェック
    if (keywordVariations.some(variation => text.includes(variation))) {
      keywords.push({
        keyword,
        category: info.category,
        priority: info.priority
      });
    }
  }
  
  return keywords;
}

// タグ名を正規化する関数
function normalizeTagName(keyword) {
  return keyword
    .toLowerCase()
    .replace(/[\/\s\-\.]/g, '_')
    .replace(/[^a-z0-9_\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// 問題からタグを抽出して保存する関数
async function extractAndSaveTags(questionId, questionText, choices) {
  // 問題文からキーワードを抽出
  let allKeywords = extractKeywords(questionText);
  
  // 選択肢からもキーワードを抽出
  if (choices && Array.isArray(choices)) {
    for (const choice of choices) {
      if (choice.choice_text) {
        const choiceKeywords = extractKeywords(choice.choice_text);
        allKeywords = allKeywords.concat(choiceKeywords);
      }
    }
  }
  
  // 重複を除去
  const uniqueKeywords = allKeywords.filter((item, index, self) => 
    index === self.findIndex(t => t.keyword === item.keyword)
  );
  
  if (uniqueKeywords.length === 0) {
    return [];
  }
  
  const savedTags = [];
  
  for (const keywordInfo of uniqueKeywords) {
    try {
      const tagName = normalizeTagName(keywordInfo.keyword);
      
      // タグが既に存在するかチェック
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id, name')
        .eq('name', tagName)
        .single();
      
      let tagId;
      
      if (existingTag) {
        tagId = existingTag.id;
      } else {
        // 新しいタグを作成
        const { data: newTag, error: tagError } = await supabase
          .from('tags')
          .insert({
            name: tagName,
            display_name: keywordInfo.keyword,
            description: `${keywordInfo.category}カテゴリのタグ（自動抽出）`,
            category_id: null // 後で手動で設定
          })
          .select()
          .single();
        
        if (tagError) {
          console.error(`タグ作成エラー (${keywordInfo.keyword}):`, tagError);
          continue;
        }
        
        tagId = newTag.id;
        console.log(`新しいタグを作成: ${keywordInfo.keyword} (${tagName})`);
      }
      
      // 問題とタグの関連をチェック
      const { data: existingRelation } = await supabase
        .from('question_tags')
        .select('id')
        .eq('question_id', questionId)
        .eq('tag_id', tagId)
        .single();
      
      if (!existingRelation) {
        // 問題とタグの関連を作成
        const relevanceScore = keywordInfo.priority === 'high' ? 1.0 : 
                              keywordInfo.priority === 'medium' ? 0.8 : 0.6;
        
        const { error: relationError } = await supabase
          .from('question_tags')
          .insert({
            question_id: questionId,
            tag_id: tagId,
            relevance_score: relevanceScore,
            is_primary: keywordInfo.priority === 'high',
            created_by: 'auto_extraction'
          });
        
        if (relationError) {
          console.error(`関連作成エラー (${keywordInfo.keyword}):`, relationError);
          continue;
        }
        
        savedTags.push({
          keyword: keywordInfo.keyword,
          category: keywordInfo.category,
          priority: keywordInfo.priority
        });
      }
      
    } catch (error) {
      console.error(`タグ処理エラー (${keywordInfo.keyword}):`, error);
    }
  }
  
  return savedTags;
}

// 指定された年度・季節の問題を処理
async function processExamQuestions(year, season) {
  console.log(`\n=== ${year}年${season}の問題からタグを抽出開始 ===`);
  
  // 試験情報を取得
  const { data: examData, error: examError } = await supabase
    .from('exams')
    .select('id, year, season')
    .eq('year', year)
    .eq('season', season)
    .single();
  
  if (examError || !examData) {
    console.error(`試験が見つかりません: ${year}年${season}`, examError);
    return;
  }
  
  // 問題一覧を取得
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select(`
      id, question_number, question_text,
      choices(id, choice_text, choice_label)
    `)
    .eq('exam_id', examData.id)
    .order('question_number');
  
  if (questionsError || !questions) {
    console.error(`問題取得エラー: ${year}年${season}`, questionsError);
    return;
  }
  
  console.log(`処理対象問題数: ${questions.length}問`);
  
  let totalExtractedTags = 0;
  let processedQuestions = 0;
  
  for (const question of questions) {
    try {
      console.log(`問題${question.question_number}を処理中...`);
      
      const extractedTags = await extractAndSaveTags(
        question.id,
        question.question_text,
        question.choices
      );
      
      if (extractedTags.length > 0) {
        console.log(`  → ${extractedTags.length}個のタグを抽出: ${extractedTags.map(t => t.keyword).join(', ')}`);
        totalExtractedTags += extractedTags.length;
      } else {
        console.log(`  → タグなし`);
      }
      
      processedQuestions++;
      
      // 1秒待機（API制限対策）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`問題${question.question_number}の処理でエラー:`, error);
    }
  }
  
  console.log(`\n=== ${year}年${season} 処理完了 ===`);
  console.log(`処理済み問題数: ${processedQuestions}/${questions.length}`);
  console.log(`抽出タグ数: ${totalExtractedTags}`);
}

// すべての年度・季節を処理
async function processAllExams() {
  console.log('利用可能な試験を取得中...');
  
  const { data: exams, error: examsError } = await supabase
    .from('exams')
    .select('year, season')
    .order('year', { ascending: true })
    .order('season', { ascending: true });
  
  if (examsError || !exams) {
    console.error('試験一覧取得エラー:', examsError);
    return;
  }
  
  console.log(`処理対象試験数: ${exams.length}`);
  console.log('試験一覧:', exams.map(e => `${e.year}年${e.season}`).join(', '));
  
  for (const exam of exams) {
    await processExamQuestions(exam.year, exam.season);
  }
  
  console.log('\n=== 全体処理完了 ===');
}

// コマンドライン引数の処理
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('すべての年度・季節を処理します...');
    await processAllExams();
  } else if (args.length === 2) {
    const [year, season] = args;
    await processExamQuestions(parseInt(year), season);
  } else {
    console.log('使用方法:');
    console.log('  すべての年度を処理: node extract-tags.js');
    console.log('  特定の年度を処理: node extract-tags.js 2023 春期');
    console.log('  または: node extract-tags.js 2023 秋期');
    process.exit(1);
  }
}

// スクリプト実行
main().catch(console.error);