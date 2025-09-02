#!/usr/bin/env node

// Check exam info and count 2009 autumn questions
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

async function checkExamInfo() {
  console.log('📊 Checking exam information and 2009 autumn questions\n');
  
  // First, get the 2009 autumn exam info
  const { data: exams, error: examError } = await supabase
    .from('exams')
    .select('id, year, season, exam_type')
    .eq('year', 2009)
    .eq('season', 'autumn');
    
  if (examError) {
    console.error('Error fetching exams:', examError);
    return;
  }
  
  console.log('2009 Autumn Exams found:', exams.length);
  exams.forEach(exam => {
    console.log(`- ID: ${exam.id}, Year: ${exam.year}, Season: ${exam.season}, Type: ${exam.exam_type}`);
  });
  
  if (exams.length === 0) {
    console.log('No 2009 autumn exams found.');
    return;
  }
  
  // Get questions for 2009 autumn exam
  const examId = exams[0].id; // Assuming there's one 2009 autumn exam
  
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, question_number, explanation')
    .eq('exam_id', examId)
    .order('question_number');
    
  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
    return;
  }
  
  console.log(`\n📝 2009 Autumn Questions Status:`);
  console.log(`Total questions: ${questions.length}`);
  
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
  
  // Check correct answers
  let questionsWithCorrectAnswers = 0;
  let questionsWithoutCorrectAnswers = [];
  
  for (const question of questions.slice(0, 10)) { // Check first 10 for performance
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
  
  console.log(`\n🎯 Correct Answers Status (first 10 questions):`);
  console.log(`Questions with correct answers: ${questionsWithCorrectAnswers}`);
  console.log(`Questions without correct answers: ${questionsWithoutCorrectAnswers.length}`);
  
  console.log('\n=== COMPLETION STATUS ===');
  const allHaveExplanations = questionsWithExplanations.length === questions.length;
                       
  if (allHaveExplanations) {
    console.log('🎉 ALL 2009 AUTUMN QUESTIONS HAVE EXPLANATIONS!');
  } else {
    console.log(`⚠️  ${questionsWithoutExplanations.length} questions still need explanations`);
  }
  
  console.log(`\n✅ Successfully updated ${questionsWithExplanations.length}/${questions.length} questions with explanations`);
}

checkExamInfo().catch(console.error);