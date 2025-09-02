#!/usr/bin/env node

// Count 2009 autumn questions and their completion status
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

async function countQuestions() {
  console.log('📊 2009 Autumn Exam Questions Status\n');
  
  // Get all 2009 autumn questions
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, question_number, explanation')
    .eq('exam_year', 2009)
    .eq('exam_season', 'autumn')
    .order('question_number');
    
  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }
  
  console.log(`Total 2009 autumn questions: ${questions.length}`);
  
  const questionsWithExplanations = questions.filter(q => q.explanation && q.explanation.trim() !== '');
  const questionsWithoutExplanations = questions.filter(q => !q.explanation || q.explanation.trim() === '');
  
  console.log(`Questions with explanations: ${questionsWithExplanations.length}`);
  console.log(`Questions without explanations: ${questionsWithoutExplanations.length}`);
  
  if (questionsWithoutExplanations.length > 0) {
    console.log('\n❌ Questions without explanations:');
    questionsWithoutExplanations.forEach(q => {
      console.log(`  - Question ${q.question_number} (ID: ${q.id})`);
    });
  }
  
  // Check correct answers for all questions
  let questionsWithCorrectAnswers = 0;
  let questionsWithoutCorrectAnswers = [];
  
  for (const question of questions) {
    const { data: choices } = await supabase
      .from('choices')
      .select('choice_label, is_correct')
      .eq('question_id', question.id);
      
    const hasCorrectAnswer = choices && choices.some(choice => choice.is_correct);
    if (hasCorrectAnswer) {
      questionsWithCorrectAnswers++;
    } else {
      questionsWithoutCorrectAnswers.push(question);
    }
  }
  
  console.log(`\n🎯 Correct Answers Status:`);
  console.log(`Questions with correct answers: ${questionsWithCorrectAnswers}`);
  console.log(`Questions without correct answers: ${questionsWithoutCorrectAnswers.length}`);
  
  if (questionsWithoutCorrectAnswers.length > 0) {
    console.log('\n❌ Questions without correct answers:');
    questionsWithoutCorrectAnswers.forEach(q => {
      console.log(`  - Question ${q.question_number} (ID: ${q.id})`);
    });
  }
  
  console.log('\n=== COMPLETION STATUS ===');
  const fullyComplete = questionsWithExplanations.length === questions.length && 
                       questionsWithCorrectAnswers === questions.length;
                       
  if (fullyComplete) {
    console.log('🎉 ALL 2009 AUTUMN QUESTIONS ARE COMPLETE!');
    console.log('✅ All questions have explanations');
    console.log('✅ All questions have correct answers marked');
  } else {
    console.log('⚠️  Some questions are still incomplete');
  }
}

countQuestions().catch(console.error);