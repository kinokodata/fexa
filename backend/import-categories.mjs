#!/usr/bin/env node

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Supabase設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません');
  console.error('SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '設定済み' : '未設定');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importCategories() {
  console.log('🚀 カテゴリデータのインポートを開始...');

  try {
    // JSONファイルを読み込み
    const jsonData = readFileSync('/Users/kinoko/work/kinokodata/fexa/pdfs/categories/fe_exam_syllabus.json', 'utf8');
    const syllabus = JSON.parse(jsonData);

    console.log(`📖 ${syllabus.exam_name}のシラバスデータを読み込みました`);

    // 既存のカテゴリデータを削除
    console.log('🧹 既存のカテゴリデータをクリア...');
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('exam_code', syllabus.exam_code);

    if (deleteError) {
      throw new Error(`既存データ削除エラー: ${deleteError.message}`);
    }

    const categories = [];
    let displayOrder = 1;

    // 階層データを展開してフラットな配列に変換
    for (const field of syllabus.fields) {
      console.log(`📂 ${field.field_name}の処理中...`);
      
      // fieldレベルを登録
      const fieldId = `field_${displayOrder}`;
      categories.push({
        id: fieldId,
        name: field.field_name,
        level: 1,
        parent_id: null,
        display_order: displayOrder++,
        exam_code: syllabus.exam_code
      });
      
      for (const major of field.major_categories) {
        // major_categoryレベルを登録
        const majorId = `major_${displayOrder}`;
        categories.push({
          id: majorId,
          name: major.major_category,
          level: 2,
          parent_id: fieldId,
          display_order: displayOrder++,
          exam_code: syllabus.exam_code
        });
        
        for (const medium of major.medium_categories) {
          // medium_categoryレベルを登録
          const mediumId = `medium_${displayOrder}`;
          categories.push({
            id: mediumId,
            name: medium.medium_category,
            level: 3,
            parent_id: majorId,
            display_order: displayOrder++,
            exam_code: syllabus.exam_code
          });
          
          for (const minor of medium.minor_categories) {
            // minor_categoryレベルを登録
            const minorId = `minor_${displayOrder}`;
            categories.push({
              id: minorId,
              name: minor.minor_category,
              level: 4,
              parent_id: mediumId,
              display_order: displayOrder++,
              exam_code: syllabus.exam_code
            });
            
            // ナレッジ項目がある場合
            if (minor.knowledge_items && minor.knowledge_items.length > 0) {
              for (const knowledge of minor.knowledge_items) {
                categories.push({
                  id: `knowledge_${displayOrder}`,
                  name: knowledge,
                  level: 5,
                  parent_id: minorId,
                  display_order: displayOrder++,
                  exam_code: syllabus.exam_code
                });
              }
            }
          }
        }
      }
    }

    // 重複を除去（idが重複しないようにチェック）
    const uniqueCategories = [];
    const seen = new Set();
    
    for (const category of categories) {
      const key = `${category.level}-${category.name}-${category.parent_id || 'null'}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCategories.push(category);
      }
    }

    console.log(`📊 インポート対象: ${uniqueCategories.length}カテゴリ`);

    // バッチでインサート（Supabaseの制限を考慮）
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < uniqueCategories.length; i += batchSize) {
      const batch = uniqueCategories.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('categories')
        .insert(batch);

      if (error) {
        console.error(`❌ バッチ ${Math.floor(i/batchSize) + 1} でエラー:`, error);
        throw error;
      }

      insertedCount += batch.length;
      console.log(`✅ ${insertedCount}/${uniqueCategories.length} インポート完了`);
    }

    // インポート結果の確認
    console.log('\n📈 インポート結果:');
    
    const { count: fieldCount } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('exam_code', syllabus.exam_code)
      .eq('level', 1);

    const { count: majorCount } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('exam_code', syllabus.exam_code)
      .eq('level', 2);

    const { count: mediumCount } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('exam_code', syllabus.exam_code)
      .eq('level', 3);

    const { count: minorCount } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('exam_code', syllabus.exam_code)
      .eq('level', 4);

    const { count: knowledgeCount } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('exam_code', syllabus.exam_code)
      .eq('level', 5);

    console.log(`- 分野: ${fieldCount || 0}`);
    console.log(`- 大分類: ${majorCount || 0}`);
    console.log(`- 中分類: ${mediumCount || 0}`);
    console.log(`- 小分類: ${minorCount || 0}`);
    console.log(`- ナレッジ: ${knowledgeCount || 0}`);
    console.log(`- 総計: ${insertedCount}`);

    console.log('\n🎉 カテゴリデータのインポートが完了しました！');

  } catch (error) {
    console.error('💥 エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  importCategories();
}