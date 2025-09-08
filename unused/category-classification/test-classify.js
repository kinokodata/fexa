#!/usr/bin/env node

import CategoryClassificationTool from './classify-all.js';

async function testClassification() {
  console.log('🧪 カテゴリ分類ツールのテスト実行\n');
  
  try {
    const tool = new CategoryClassificationTool();
    
    // テスト用のオプション
    const testOptions = {
      limit: 5,        // 5問のみでテスト
      dryRun: true,    // 実際の更新は行わない
      batchSize: 2     // バッチサイズ2
    };
    
    console.log('📋 テスト設定:', testOptions);
    console.log(''); 
    
    await tool.run(testOptions);
    
    console.log('\n✅ テスト完了！');
    console.log('\n💡 本格実行する場合:');
    console.log('node classify-all.js --limit=10 --dryRun=false');
    console.log('node classify-all.js --year=2023 --season=春期');
    console.log('node classify-all.js --all');
    
  } catch (error) {
    console.error('\n❌ テスト失敗:', error.message);
    console.error('詳細:', error);
  }
}

testClassification();