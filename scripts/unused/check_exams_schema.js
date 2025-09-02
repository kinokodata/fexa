#!/usr/bin/env node

// Check the exams table schema
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExamsSchema() {
  console.log('🔍 Checking exams table schema\n');
  
  // Get a few sample exams to see the structure
  const { data: exams, error } = await supabase
    .from('exams')
    .select('*')
    .limit(3);
    
  if (error) {
    console.error('Error fetching exams:', error);
    return;
  }
  
  if (exams && exams.length > 0) {
    console.log('Sample exam structure:');
    console.log('Columns:', Object.keys(exams[0]));
    console.log('\nSample exams:');
    exams.forEach((exam, index) => {
      console.log(`${index + 1}. ID: ${exam.id}`);
      console.log(`   Year: ${exam.year}, Season: ${exam.season}`);
      console.log(`   Date: ${exam.exam_date}`);
      console.log('');
    });
  }
}

checkExamsSchema().catch(console.error);