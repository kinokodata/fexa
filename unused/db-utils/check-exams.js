#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkExams() {
  const { data, error } = await supabase
    .from('exams')
    .select('year, season')
    .order('year', { ascending: true });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Available exams:');
  data.forEach(exam => {
    console.log(`- ${exam.year}年${exam.season}`);
  });
}

checkExams().catch(console.error);