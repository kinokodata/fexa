#!/usr/bin/env node

// Execute SQL statements from 2009_answers_remaining.sql using Supabase client
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read and parse the SQL file
const sqlFile = path.join(__dirname, '../2009_answers_remaining.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

// Extract UPDATE statements
const updateStatements = sqlContent
  .split('\n')
  .filter(line => line.trim().startsWith('UPDATE'))
  .map(line => line.trim().replace(/;$/, ''));

console.log(`Found ${updateStatements.length} UPDATE statements`);

async function executeUpdates() {
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < updateStatements.length; i++) {
    const statement = updateStatements[i];
    console.log(`\n${i + 1}/${updateStatements.length}: Executing statement...`);
    
    try {
      // Parse the UPDATE statement
      if (statement.includes('UPDATE questions SET explanation')) {
        // Extract explanation and id from questions update
        const explanationMatch = statement.match(/SET explanation = '(.+)' WHERE id = '([^']+)'/);
        if (explanationMatch) {
          const explanation = explanationMatch[1];
          const id = explanationMatch[2];
          
          const { error } = await supabase
            .from('questions')
            .update({ explanation: explanation })
            .eq('id', id);
            
          if (error) {
            console.error(`Error updating question ${id}:`, error);
            errorCount++;
          } else {
            console.log(`✅ Updated question ${id}`);
            successCount++;
          }
        }
      } else if (statement.includes('UPDATE choices SET is_correct')) {
        // Extract question_id and choice_label from choices update
        const choicesMatch = statement.match(/WHERE question_id = '([^']+)' AND choice_label = '([^']+)'/);
        if (choicesMatch) {
          const questionId = choicesMatch[1];
          const choiceLabel = choicesMatch[2];
          
          const { error } = await supabase
            .from('choices')
            .update({ is_correct: true })
            .eq('question_id', questionId)
            .eq('choice_label', choiceLabel);
            
          if (error) {
            console.error(`Error updating choice ${questionId}-${choiceLabel}:`, error);
            errorCount++;
          } else {
            console.log(`✅ Updated choice ${questionId}-${choiceLabel}`);
            successCount++;
          }
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error executing statement ${i + 1}:`, error);
      errorCount++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total statements: ${updateStatements.length}`);
  console.log(`Successful updates: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('🎉 All SQL statements executed successfully!');
  } else {
    console.log('⚠️  Some statements failed. Please check the errors above.');
  }
}

executeUpdates().catch(console.error);