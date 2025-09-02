#!/usr/bin/env node

// Verify that the 2009 answers updates were successful
import { createClient } from '@supabase/supabase-js';
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

// Sample question IDs to verify
const sampleQuestionIds = [
  'b3081ea1-57a8-421f-8121-49d22cf0843a', // Question 22 - Router
  'fe5c0dd6-315f-4718-880c-22577bd77962', // Question 26 - Database normalization
  '9257e93a-10b9-4c0a-a22c-33d55ce586cd', // Question 29 - E-R diagram
  'a306ccfe-05a5-4eac-89e8-63d812eea790', // Question 49 - Marketing mix 4P
  'ce430beb-03f2-49f2-b5f9-e2d1bf68217c'  // Question 80 - CSR
];

async function verifyUpdates() {
  console.log('=== VERIFICATION REPORT ===\n');
  
  let questionsWithExplanations = 0;
  let questionsWithoutExplanations = 0;
  let correctAnswersSet = 0;
  
  for (const questionId of sampleQuestionIds) {
    console.log(`📝 Question ID: ${questionId}`);
    
    // Check question explanation
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('explanation, question_number')
      .eq('id', questionId)
      .single();
    
    if (questionError) {
      console.error(`❌ Error fetching question:`, questionError);
      continue;
    }
    
    if (question.explanation && question.explanation.trim() !== '') {
      console.log(`✅ Question ${question.question_number}: Has explanation (${question.explanation.length} chars)`);
      questionsWithExplanations++;
    } else {
      console.log(`❌ Question ${question.question_number}: Missing explanation`);
      questionsWithoutExplanations++;
    }
    
    // Check correct choice
    const { data: choices, error: choicesError } = await supabase
      .from('choices')
      .select('choice_label, is_correct')
      .eq('question_id', questionId);
    
    if (choicesError) {
      console.error(`❌ Error fetching choices:`, choicesError);
      continue;
    }
    
    const correctChoice = choices.find(choice => choice.is_correct);
    if (correctChoice) {
      console.log(`✅ Question ${question.question_number}: Correct answer is ${correctChoice.choice_label}`);
      correctAnswersSet++;
    } else {
      console.log(`❌ Question ${question.question_number}: No correct answer marked`);
    }
    
    console.log('');
  }
  
  // Count total 2009 autumn questions with explanations
  const { data: allQuestions, error } = await supabase
    .from('questions')
    .select('id, explanation, question_number')
    .eq('exam_year', 2009)
    .eq('exam_season', 'autumn');
    
  if (!error) {
    const totalQuestions = allQuestions.length;
    const questionsWithExp = allQuestions.filter(q => q.explanation && q.explanation.trim() !== '').length;
    console.log(`📊 OVERALL STATISTICS:`);
    console.log(`Total 2009 autumn questions: ${totalQuestions}`);
    console.log(`Questions with explanations: ${questionsWithExp}`);
    console.log(`Questions without explanations: ${totalQuestions - questionsWithExp}`);
    
    if (questionsWithExp === totalQuestions) {
      console.log('🎉 All questions have explanations!');
    }
  }
  
  console.log(`\n=== SAMPLE VERIFICATION SUMMARY ===`);
  console.log(`Sample questions checked: ${sampleQuestionIds.length}`);
  console.log(`Questions with explanations: ${questionsWithExplanations}`);
  console.log(`Questions with correct answers: ${correctAnswersSet}`);
  
  if (questionsWithExplanations === sampleQuestionIds.length && 
      correctAnswersSet === sampleQuestionIds.length) {
    console.log('✅ All sample questions verified successfully!');
  } else {
    console.log('⚠️  Some issues found in verification');
  }
}

verifyUpdates().catch(console.error);