#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function resetAllAnswers() {
  console.log('全ての正解フラグをリセット中...');
  
  const { error } = await supabase
    .from('choices')
    .update({ is_correct: false })
    .eq('is_correct', true);
  
  if (error) {
    console.error('リセットエラー:', error);
  } else {
    console.log('✅ 全ての正解フラグをリセットしました');
  }
}

resetAllAnswers();