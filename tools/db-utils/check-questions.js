#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkQuestions() {
  // 2017年春期の最初の数問を確認
  const { data: examData } = await supabase.from('exams').select('id').eq('year', 2017).eq('season', '春期').single();
  const { data: questions } = await supabase
    .from('questions')
    .select('question_number, question_text, choices(choice_label, choice_text)')
    .eq('exam_id', examData.id)
    .order('question_number')
    .limit(10);

  questions.forEach(q => {
    console.log(`=== 問題${q.question_number} ===`);
    console.log(q.question_text?.substring(0, 300) + '...');
    console.log('選択肢:', q.choices?.map(c => `${c.choice_label}: ${c.choice_text?.substring(0, 80)}...`).join(' | '));
    console.log('');
  });
}

checkQuestions().catch(console.error);