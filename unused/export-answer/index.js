#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Season mapping
const seasonMap = {
  '春期': 'h',
  '秋期': 'a'
};

/**
 * Export answers from answers.json to Supabase
 */
async function exportAnswers(year, season) {
  try {
    console.log(`Exporting ${year} ${season} answers to Supabase...`);
    
    // Read answers.json file
    const seasonCode = seasonMap[season] || season.toLowerCase();
    const answersFile = `./pdfs/${year}_${seasonCode}/answers.json`;
    
    if (!fs.existsSync(answersFile)) {
      throw new Error(`Answers file not found: ${answersFile}`);
    }
    
    const answersData = JSON.parse(fs.readFileSync(answersFile, 'utf8'));
    console.log(`Found ${Object.keys(answersData).length} answers to process`);
    
    let updatedQuestions = 0;
    let updatedChoices = 0;
    let errors = 0;
    
    // Process each question
    for (const [questionId, answerData] of Object.entries(answersData)) {
      try {
        console.log(`Processing question ${answerData.question_number} (${questionId})`);
        
        // Update question explanation
        const { error: questionError } = await supabase
          .from('questions')
          .update({ explanation: answerData.explanation })
          .eq('id', questionId);
        
        if (questionError) {
          console.error(`Question ${answerData.question_number} explanation update error:`, questionError);
          errors++;
          continue;
        }
        
        updatedQuestions++;
        
        // Get all choices for this question
        const { data: choices, error: choicesError } = await supabase
          .from('choices')
          .select('id, choice_label')
          .eq('question_id', questionId);
        
        if (choicesError) {
          console.error(`Failed to get choices for question ${answerData.question_number}:`, choicesError);
          errors++;
          continue;
        }
        
        // Reset all choices to false
        const choiceIds = choices.map(c => c.id);
        const { error: resetError } = await supabase
          .from('choices')
          .update({ is_correct: false })
          .in('id', choiceIds);
        
        if (resetError) {
          console.error(`Failed to reset choices for question ${answerData.question_number}:`, resetError);
          errors++;
          continue;
        }
        
        // Set correct choice to true
        const correctChoice = choices.find(c => c.choice_label === answerData.correct_choice);
        if (!correctChoice) {
          console.error(`Correct choice ${answerData.correct_choice} not found for question ${answerData.question_number}`);
          errors++;
          continue;
        }
        
        const { error: updateError } = await supabase
          .from('choices')
          .update({ is_correct: true })
          .eq('id', correctChoice.id);
        
        if (updateError) {
          console.error(`Failed to update correct choice for question ${answerData.question_number}:`, updateError);
          errors++;
          continue;
        }
        
        updatedChoices++;
        console.log(`✅ Question ${answerData.question_number}: Set ${answerData.correct_choice} as correct`);
        
      } catch (error) {
        console.error(`Error processing question ${answerData.question_number}:`, error);
        errors++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n=== Export Complete ===');
    console.log(`Updated questions: ${updatedQuestions}`);
    console.log(`Updated choices: ${updatedChoices}`);
    console.log(`Errors: ${errors}`);
    
    if (errors === 0) {
      console.log('🎉 All updates completed successfully!');
    } else {
      console.log('⚠️  Some updates failed. Check the logs above.');
    }
    
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node index.js <year> <season>');
    console.error('Example: node index.js 2019 春期');
    process.exit(1);
  }
  
  const [year, season] = args;
  await exportAnswers(parseInt(year), season);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { exportAnswers };