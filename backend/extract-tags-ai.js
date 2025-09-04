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
  console.error('SUPABASE_URLまたはSUPABASE_KEYが設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// IT用語辞書（既存のものを使用）
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

// AIプロンプトテンプレート
const AI_PROMPT = `
あなたは基本情報技術者試験のIT専門家です。以下の問題文と選択肢から、ITに関連するキーワードとタグを抽出してください。

【問題文】
{QUESTION_TEXT}

【選択肢】  
{CHOICES}

【指示】
1. この問題の主要なITテーマを1-5個のタグとして抽出
2. 各タグは以下のカテゴリに分類：ネットワーク、セキュリティ、データベース、プログラミング、システム開発、ハードウェア、その他
3. 必ず最低1個のタグを抽出してください
4. 日本語またはアルファベットで回答

【出力形式】
以下のJSON形式で回答してください：
{
  "tags": [
    {"keyword": "タグ名", "category": "カテゴリ", "priority": "high/medium/low", "reason": "抽出理由"}
  ]
}

例：
{
  "tags": [
    {"keyword": "TCP/IP", "category": "ネットワーク", "priority": "high", "reason": "問題の中心的なプロトコルとして言及"},
    {"keyword": "ルーティング", "category": "ネットワーク", "priority": "medium", "reason": "選択肢で扱われている技術概念"}
  ]
}
`;

// ChatGPT APIを使用してタグを抽出
async function extractTagsWithAI(questionText, choices) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.log('OPENAI_API_KEYが設定されていません。模擬AI分析を使用します。');
      return await mockAIAnalysis(questionText, choices);
    }
    
    const prompt = AI_PROMPT
      .replace('{QUESTION_TEXT}', questionText || 'なし')
      .replace('{CHOICES}', choices ? choices.map(c => `${c.choice_label}: ${c.choice_text}`).join('\n') : 'なし');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // JSONレスポンスを解析
    try {
      const parsedResponse = JSON.parse(aiResponse);
      if (parsedResponse.tags && Array.isArray(parsedResponse.tags)) {
        return parsedResponse.tags;
      }
    } catch (parseError) {
      console.error('AI回答のJSON解析エラー:', parseError);
      console.log('AI回答:', aiResponse);
    }
    
    // JSON解析失敗時は模擬AI分析にフォールバック
    return await mockAIAnalysis(questionText, choices);
    
  } catch (error) {
    console.error('AI処理エラー:', error);
    // エラー時は模擬AI分析にフォールバック
    return await mockAIAnalysis(questionText, choices);
  }
}

// 模擬AI分析（実際のAPI実装まではこれを使用）
async function mockAIAnalysis(questionText, choices) {
  const text = (questionText || '') + ' ' + (choices?.map(c => c.choice_text).join(' ') || '');
  const tags = [];
  
  // === 数学・理論系 ===
  if (text.includes('集合') || text.includes('和集合') || text.includes('積集合')) {
    tags.push({ keyword: '集合論', category: 'その他', priority: 'high' });
  }
  
  if (text.includes('浮動小数点') || text.includes('正規化') || text.includes('仮数部')) {
    tags.push({ keyword: '浮動小数点', category: 'ハードウェア', priority: 'high' });
  }
  
  if (text.includes('論理積') || text.includes('NAND') || text.includes('AND') || text.includes('OR') || text.includes('NOT')) {
    tags.push({ keyword: '論理演算', category: 'ハードウェア', priority: 'high' });
  }
  
  // === データ構造・アルゴリズム系 ===
  if (text.includes('リスト') || text.includes('配列') || text.includes('ポインタ')) {
    tags.push({ keyword: 'データ構造', category: 'プログラミング', priority: 'high' });
  }
  
  if (text.includes('2分探索') || text.includes('二分探索') || text.includes('探索')) {
    tags.push({ keyword: '探索アルゴリズム', category: 'プログラミング', priority: 'high' });
  }
  
  if (text.includes('ハッシュ') || text.includes('ハッシュ値')) {
    tags.push({ keyword: 'ハッシュ', category: 'プログラミング', priority: 'high' });
  }
  
  if (text.includes('ソート') || text.includes('昇順') || text.includes('降順')) {
    tags.push({ keyword: 'ソートアルゴリズム', category: 'プログラミング', priority: 'high' });
  }
  
  if (text.includes('シフト演算') || text.includes('ビット') || text.includes('論理シフト')) {
    tags.push({ keyword: 'ビット演算', category: 'プログラミング', priority: 'high' });
  }
  
  if (text.includes('再帰') || text.includes('mod') || text.includes('余り')) {
    tags.push({ keyword: '再帰アルゴリズム', category: 'プログラミング', priority: 'medium' });
  }
  
  // === ハードウェア・アーキテクチャ系 ===
  if (text.includes('クロック') || text.includes('MHz') || text.includes('MIPS')) {
    tags.push({ keyword: 'CPU性能', category: 'ハードウェア', priority: 'high' });
  }
  
  if (text.includes('キャッシュ') || text.includes('ライトスルー') || text.includes('ライトバック')) {
    tags.push({ keyword: 'メモリアーキテクチャ', category: 'ハードウェア', priority: 'high' });
  }
  
  if (text.includes('USB') || text.includes('シリアル') || text.includes('インタフェース')) {
    tags.push({ keyword: 'インタフェース', category: 'ハードウェア', priority: 'high' });
  }
  
  if (text.includes('プロセッサ') || text.includes('レジスタ') || text.includes('命令')) {
    tags.push({ keyword: 'プロセッサアーキテクチャ', category: 'ハードウェア', priority: 'high' });
  }
  
  // === システム開発系 ===
  if (text.includes('要件定義') || text.includes('設計') || text.includes('仕様')) {
    tags.push({ keyword: 'システム設計', category: 'システム開発', priority: 'high' });
  }
  
  if (text.includes('テスト') && (text.includes('単体') || text.includes('結合') || text.includes('システム'))) {
    tags.push({ keyword: 'ソフトウェアテスト', category: 'システム開発', priority: 'high' });
  }
  
  // === 数値計算・処理系 ===
  if (text.includes('乗算') || text.includes('演算') || text.includes('計算')) {
    tags.push({ keyword: '数値計算', category: 'プログラミング', priority: 'medium' });
  }
  
  // === 性能・効率系 ===
  if (text.includes('効率') || text.includes('性能') || text.includes('速度') || text.includes('スループット')) {
    tags.push({ keyword: '性能評価', category: 'その他', priority: 'medium' });
  }
  
  // === 転送・通信系 ===
  if (text.includes('転送') || text.includes('伝送') || text.includes('Gビット') || text.includes('データ転送')) {
    tags.push({ keyword: 'データ転送', category: 'ハードウェア', priority: 'medium' });
  }
  
  // === システム管理系 ===
  if (text.includes('管理') || text.includes('運用') || text.includes('コヒーレンシ')) {
    tags.push({ keyword: 'システム管理', category: 'システム開発', priority: 'medium' });
  }
  
  // 最低1個のタグを保証（より具体的に）
  if (tags.length === 0) {
    // 問題文の長さや内容から推測
    if (text.length > 200) {
      tags.push({ keyword: '複合問題', category: 'その他', priority: 'low' });
    } else if (text.includes('適切') || text.includes('正しい')) {
      tags.push({ keyword: '知識問題', category: 'その他', priority: 'low' });
    } else {
      tags.push({ keyword: '基礎理論', category: 'その他', priority: 'low' });
    }
  }
  
  return tags;
}

// 辞書ベースキーワード抽出
function extractKeywords(text) {
  if (!text) return [];
  
  const keywords = [];
  
  for (const [keyword, info] of Object.entries(IT_KEYWORDS)) {
    const keywordVariations = [
      keyword,
      keyword.toLowerCase(),
      keyword.toUpperCase()
    ];
    
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
  // 1. 辞書ベースでキーワードを抽出
  let dictionaryKeywords = extractKeywords(questionText);
  
  if (choices && Array.isArray(choices)) {
    for (const choice of choices) {
      if (choice.choice_text) {
        const choiceKeywords = extractKeywords(choice.choice_text);
        dictionaryKeywords = dictionaryKeywords.concat(choiceKeywords);
      }
    }
  }
  
  // 2. AI分析でタグを抽出
  const aiTags = await extractTagsWithAI(questionText, choices);
  
  // 3. 両方の結果を統合
  const allKeywords = [
    ...dictionaryKeywords,
    ...aiTags
  ];
  
  // 重複を除去
  const uniqueKeywords = allKeywords.filter((item, index, self) => 
    index === self.findIndex(t => t.keyword === item.keyword)
  );
  
  // 最低1個のタグを保証
  if (uniqueKeywords.length === 0) {
    uniqueKeywords.push({ keyword: '情報処理基礎', category: 'その他', priority: 'low' });
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
            description: `${keywordInfo.category}カテゴリのタグ（AI+辞書抽出）`,
            category_id: null
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
        const relevanceScore = keywordInfo.priority === 'high' ? 1.0 : 
                              keywordInfo.priority === 'medium' ? 0.8 : 0.6;
        
        const { error: relationError } = await supabase
          .from('question_tags')
          .insert({
            question_id: questionId,
            tag_id: tagId,
            relevance_score: relevanceScore,
            is_primary: keywordInfo.priority === 'high',
            created_by: 'ai_extraction'
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
  console.log(`\n=== ${year}年${season}の問題からAI+辞書でタグを抽出開始 ===`);
  
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
      console.log(`問題${question.question_number}をAI+辞書で処理中...`);
      
      const extractedTags = await extractAndSaveTags(
        question.id,
        question.question_text,
        question.choices
      );
      
      if (extractedTags.length > 0) {
        console.log(`  → ${extractedTags.length}個のタグを抽出: ${extractedTags.map(t => t.keyword).join(', ')}`);
        totalExtractedTags += extractedTags.length;
      } else {
        console.log(`  → エラーのためタグなし`);
      }
      
      processedQuestions++;
      
      // 1秒待機（API制限対策）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`問題${question.question_number}の処理でエラー:`, error);
    }
  }
  
  console.log(`\n=== ${year}年${season} AI+辞書処理完了 ===`);
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
  
  console.log('\n=== AI+辞書による全体処理完了 ===');
}

// コマンドライン引数の処理
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('すべての年度・季節をAI+辞書で処理します...');
    await processAllExams();
  } else if (args.length === 2) {
    const [year, season] = args;
    await processExamQuestions(parseInt(year), season);
  } else {
    console.log('使用方法:');
    console.log('  すべての年度を処理: node extract-tags-ai.js');
    console.log('  特定の年度を処理: node extract-tags-ai.js 2023 春期');
    console.log('  または: node extract-tags-ai.js 2023 秋期');
    process.exit(1);
  }
}

// スクリプト実行
main().catch(console.error);