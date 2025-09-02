#!/usr/bin/env node

// Check the questions table schema
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

async function checkSchema() {
  console.log('🔍 Checking questions table schema\n');
  
  // Get a few sample questions to see the structure
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .limit(3);
    
  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }
  
  if (questions && questions.length > 0) {
    console.log('Sample question structure:');
    console.log('Columns:', Object.keys(questions[0]));
    console.log('\nFirst question data:');
    console.log(JSON.stringify(questions[0], null, 2));
  }
}

checkSchema().catch(console.error);