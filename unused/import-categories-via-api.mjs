#!/usr/bin/env node

import { readFileSync } from 'fs';

const API_BASE_URL = 'http://localhost:43001';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjZWMyMTJjZC1iOWIyLTRkYWEtODhiYy0zMjc5YmNlYjRhNDIiLCJlbWFpbCI6ImluZm9Aa2lub2tvZGF0YS5uZXQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTY5MDU0NzUsImV4cCI6MTc1Njk5MTg3NX0.dmryiwBL4djMBPWoQrzwirH93qsFoOCCaiDuZ5nXCS0';

// API呼び出し関数
async function apiCall(endpoint, method = 'GET', body = null) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
    body: body ? JSON.stringify(body) : null
  });
  
  return await response.json();
}

async function importCategories() {
  console.log('🚀 API経由でカテゴリデータのインポートを開始...');

  try {
    // JSONファイルを読み込み
    const jsonData = readFileSync('/Users/kinoko/work/kinokodata/fexa/pdfs/categories/fe_exam_syllabus.json', 'utf8');
    const syllabus = JSON.parse(jsonData);

    console.log(`📖 ${syllabus.exam_name}のシラバスデータを読み込みました`);

    // 既存のカテゴリデータを削除
    console.log('🧹 既存のカテゴリデータをクリア...');
    const deleteResult = await apiCall('/api/categories/bulk', 'DELETE', {
      exam_code: syllabus.exam_code
    });
    
    if (!deleteResult.success) {
      throw new Error(`既存データ削除エラー: ${deleteResult.error?.message}`);
    }

    const categories = [];
    const categoryMap = new Map(); // name -> id のマッピング
    let displayOrder = 1;

    // 階層データを展開してフラットな配列に変換
    for (const field of syllabus.fields) {
      console.log(`📂 ${field.field_name}の処理中...`);
      
      // fieldレベルを登録
      const fieldCategory = {
        name: field.field_name,
        level: 1,
        parent_id: null,
        display_order: displayOrder++,
        exam_code: syllabus.exam_code
      };
      categories.push(fieldCategory);
      
      for (const major of field.major_categories) {
        // major_categoryレベルを登録
        const majorCategory = {
          name: major.major_category,
          level: 2,
          parent_field: field.field_name,
          display_order: displayOrder++,
          exam_code: syllabus.exam_code
        };
        categories.push(majorCategory);
        
        for (const medium of major.medium_categories) {
          // medium_categoryレベルを登録
          const mediumCategory = {
            name: medium.medium_category,
            level: 3,
            parent_field: field.field_name,
            parent_major: major.major_category,
            display_order: displayOrder++,
            exam_code: syllabus.exam_code
          };
          categories.push(mediumCategory);
          
          for (const minor of medium.minor_categories) {
            // minor_categoryレベルを登録
            const minorCategory = {
              name: minor.minor_category,
              level: 4,
              parent_field: field.field_name,
              parent_major: major.major_category,
              parent_medium: medium.medium_category,
              display_order: displayOrder++,
              exam_code: syllabus.exam_code
            };
            categories.push(minorCategory);
            
            // ナレッジ項目がある場合
            if (minor.knowledge_items && minor.knowledge_items.length > 0) {
              for (const knowledge of minor.knowledge_items) {
                const knowledgeCategory = {
                  name: knowledge,
                  level: 5,
                  parent_field: field.field_name,
                  parent_major: major.major_category,
                  parent_medium: medium.medium_category,
                  parent_minor: minor.minor_category,
                  display_order: displayOrder++,
                  exam_code: syllabus.exam_code
                };
                categories.push(knowledgeCategory);
              }
            }
          }
        }
      }
    }

    console.log(`📊 インポート対象: ${categories.length}カテゴリ`);

    // 順次インポート（親子関係を維持するため）
    let insertedCount = 0;
    
    // レベル順にソート
    categories.sort((a, b) => a.level - b.level || a.display_order - b.display_order);

    for (const category of categories) {
      // 親IDを解決
      let parent_id = null;
      if (category.level > 1) {
        let parentName = '';
        if (category.level === 2) {
          parentName = category.parent_field;
        } else if (category.level === 3) {
          parentName = category.parent_major;
        } else if (category.level === 4) {
          parentName = category.parent_medium;
        } else if (category.level === 5) {
          parentName = category.parent_minor;
        }
        
        parent_id = categoryMap.get(parentName) || null;
      }

      // levelに基づいてcategory_typeを決定
      let categoryType;
      switch (category.level) {
        case 1: categoryType = 'field'; break;
        case 2: categoryType = 'major'; break;
        case 3: categoryType = 'medium'; break;
        case 4: categoryType = 'minor'; break;
        case 5: categoryType = 'knowledge'; break;
        default: categoryType = 'unknown';
      }

      const categoryData = {
        name: category.name,
        level: category.level,
        parent_id,
        display_order: category.display_order,
        exam_code: category.exam_code,
        category_type: categoryType
      };

      const result = await apiCall('/api/categories', 'POST', categoryData);
      
      if (!result.success) {
        console.error(`❌ カテゴリ作成エラー: ${category.name}`, result.error);
        continue;
      }

      // マッピングに追加
      categoryMap.set(category.name, result.data.id);
      insertedCount++;
      
      if (insertedCount % 50 === 0) {
        console.log(`✅ ${insertedCount}/${categories.length} インポート完了`);
      }
    }

    console.log(`✅ ${insertedCount}/${categories.length} インポート完了`);

    // インポート結果の確認
    console.log('\n📈 インポート結果:');
    const flatResult = await apiCall(`/api/categories/flat?exam_code=${syllabus.exam_code}`);
    
    if (flatResult.success) {
      const categoriesData = flatResult.data;
      const fieldCount = categoriesData.filter(c => c.level === 1).length;
      const majorCount = categoriesData.filter(c => c.level === 2).length;
      const mediumCount = categoriesData.filter(c => c.level === 3).length;
      const minorCount = categoriesData.filter(c => c.level === 4).length;
      const knowledgeCount = categoriesData.filter(c => c.level === 5).length;

      console.log(`- 分野: ${fieldCount}`);
      console.log(`- 大分類: ${majorCount}`);
      console.log(`- 中分類: ${mediumCount}`);
      console.log(`- 小分類: ${minorCount}`);
      console.log(`- ナレッジ: ${knowledgeCount}`);
      console.log(`- 総計: ${categoriesData.length}`);
    }

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