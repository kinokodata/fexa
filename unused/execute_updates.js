import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Load the processed answers to use for targeted updates
const processedAnswers = JSON.parse(fs.readFileSync('2019_autumn_processed_answers.json', 'utf8'));

console.log(`Processing ${processedAnswers.length} questions...`);

let questionUpdatesSuccess = 0;
let questionUpdatesError = 0;
let choiceUpdatesSuccess = 0;
let choiceUpdatesError = 0;

// Update questions with explanations
for (const answer of processedAnswers) {
  try {
    const { error } = await supabase
      .from('questions')
      .update({ explanation: answer.explanation })
      .eq('id', answer.questionId);
    
    if (error) {
      console.error(`Error updating question ${answer.questionNumber}:`, error.message);
      questionUpdatesError++;
    } else {
      questionUpdatesSuccess++;
      console.log(`✓ Updated question ${answer.questionNumber} explanation`);
    }
  } catch (err) {
    console.error(`Exception updating question ${answer.questionNumber}:`, err.message);
    questionUpdatesError++;
  }
  
  // Update choices - first set all to false, then set correct one to true
  try {
    // Reset all choices for this question to false
    const { error: resetError } = await supabase
      .from('choices')
      .update({ is_correct: false })
      .in('id', answer.choices.map(c => c.id));
    
    if (resetError) {
      console.error(`Error resetting choices for question ${answer.questionNumber}:`, resetError.message);
      choiceUpdatesError++;
    } else {
      // Set the correct choice to true
      const { error: correctError } = await supabase
        .from('choices')
        .update({ is_correct: true })
        .eq('id', answer.correctChoiceId);
      
      if (correctError) {
        console.error(`Error setting correct choice for question ${answer.questionNumber}:`, correctError.message);
        choiceUpdatesError++;
      } else {
        choiceUpdatesSuccess++;
        console.log(`✓ Updated choices for question ${answer.questionNumber} (correct: ${answer.correctChoiceLabel})`);
      }
    }
  } catch (err) {
    console.error(`Exception updating choices for question ${answer.questionNumber}:`, err.message);
    choiceUpdatesError++;
  }
  
  // Small delay to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 100));
}

console.log('\n=== FINAL RESULTS ===');
console.log(`Questions - Success: ${questionUpdatesSuccess}, Errors: ${questionUpdatesError}`);
console.log(`Choices - Success: ${choiceUpdatesSuccess}, Errors: ${choiceUpdatesError}`);
console.log(`Total Questions Processed: ${processedAnswers.length}`);