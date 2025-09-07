#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateTagsSchema() {
  console.log('Updating tags table schema...');
  
  try {
    // primary_category_idカラムを追加
    const { error: addPrimaryError } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE tags 
        ADD COLUMN IF NOT EXISTS primary_category_id UUID REFERENCES categories(id);
      `
    });
    
    if (addPrimaryError && !addPrimaryError.message.includes('already exists')) {
      throw addPrimaryError;
    }
    console.log('✓ Added primary_category_id column');

    // secondary_keywordsカラムを追加
    const { error: addSecondaryError } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE tags 
        ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[];
      `
    });
    
    if (addSecondaryError && !addSecondaryError.message.includes('already exists')) {
      throw addSecondaryError;
    }
    console.log('✓ Added secondary_keywords column');

    // 既存のcategory_idをprimary_category_idにコピー
    const { error: copyError } = await supabase.rpc('execute_sql', {
      sql: `
        UPDATE tags 
        SET primary_category_id = category_id 
        WHERE category_id IS NOT NULL AND primary_category_id IS NULL;
      `
    });
    
    if (copyError) throw copyError;
    console.log('✓ Copied existing category_id to primary_category_id');

    // インデックス追加
    const { error: indexError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_tags_primary_category ON tags(primary_category_id);
        CREATE INDEX IF NOT EXISTS idx_tags_secondary_keywords ON tags USING GIN(secondary_keywords);
      `
    });
    
    if (indexError) throw indexError;
    console.log('✓ Created indexes');

    console.log('Schema update completed successfully!');
    
    // 更新結果を確認
    const { data: sampleTags, error: selectError } = await supabase
      .from('tags')
      .select('id, name, category_id, primary_category_id, secondary_keywords')
      .limit(5);
    
    if (selectError) throw selectError;
    
    console.log('\nSample tags after update:');
    console.table(sampleTags);
    
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
}

updateTagsSchema();