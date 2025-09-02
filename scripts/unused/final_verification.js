#!/usr/bin/env node

// Final verification of 2009 autumn questions completion
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

async function finalVerification() {
  console.log('🎯 FINAL VERIFICATION: 2009 Autumn Exam Questions\n');
  
  // Get the 2009 autumn exam
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id, year, season')
    .eq('year', 2009)
    .eq('season', '秋期')
    .single();
    
  if (examError) {
    console.error('Error fetching 2009 autumn exam:', examError);
    return;
  }
  
  console.log(`📋 Exam: ${exam.year} ${exam.season} (ID: ${exam.id})\n`);
  
  // Get all questions for this exam
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, question_number, explanation')
    .eq('exam_id', exam.id)
    .order('question_number');
    
  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
    return;
  }
  
  console.log(`📝 QUESTIONS ANALYSIS:`);
  console.log(`Total questions: ${questions.length}`);
  
  const questionsWithExplanations = questions.filter(q => q.explanation && q.explanation.trim() !== '');
  const questionsWithoutExplanations = questions.filter(q => !q.explanation || q.explanation.trim() === '');
  
  console.log(`Questions with explanations: ${questionsWithExplanations.length}`);
  console.log(`Questions without explanations: ${questionsWithoutExplanations.length}`);
  
  if (questionsWithoutExplanations.length > 0) {
    console.log('\n❌ Questions still missing explanations:');
    questionsWithoutExplanations.forEach(q => {
      console.log(`  - Question ${q.question_number} (ID: ${q.id})`);
    });
  }
  
  // Check correct answers for all questions
  console.log(`\n🎯 CORRECT ANSWERS ANALYSIS:`);
  let questionsWithCorrectAnswers = 0;
  let questionsWithoutCorrectAnswers = [];
  let totalChoices = 0;
  
  for (const question of questions) {
    const { data: choices } = await supabase
      .from('choices')
      .select('choice_label, is_correct')
      .eq('question_id', question.id);
      
    if (choices) {
      totalChoices += choices.length;
      const correctChoices = choices.filter(choice => choice.is_correct);
      
      if (correctChoices.length === 1) {
        questionsWithCorrectAnswers++;
      } else if (correctChoices.length === 0) {
        questionsWithoutCorrectAnswers.push({
          ...question,
          issue: 'No correct answer'
        });
      } else {
        questionsWithoutCorrectAnswers.push({
          ...question,
          issue: `Multiple correct answers (${correctChoices.length})`
        });
      }
    } else {
      questionsWithoutCorrectAnswers.push({
        ...question,
        issue: 'No choices found'
      });
    }
  }
  
  console.log(`Questions with correct answers: ${questionsWithCorrectAnswers}`);
  console.log(`Questions with issues: ${questionsWithoutCorrectAnswers.length}`);
  console.log(`Total choices across all questions: ${totalChoices}`);
  
  if (questionsWithoutCorrectAnswers.length > 0) {
    console.log('\n❌ Questions with correct answer issues:');
    questionsWithoutCorrectAnswers.forEach(q => {
      console.log(`  - Question ${q.question_number}: ${q.issue} (ID: ${q.id})`);
    });
  }
  
  // FINAL SUMMARY
  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL COMPLETION STATUS');
  console.log('='.repeat(50));
  
  const explanationComplete = questionsWithExplanations.length === questions.length;
  const answersComplete = questionsWithCorrectAnswers === questions.length;
  const fullyComplete = explanationComplete && answersComplete;
  
  console.log(`Total Questions: ${questions.length}`);
  console.log(`Explanations Complete: ${questionsWithExplanations.length}/${questions.length} ${explanationComplete ? '✅' : '❌'}`);
  console.log(`Correct Answers Complete: ${questionsWithCorrectAnswers}/${questions.length} ${answersComplete ? '✅' : '❌'}`);
  
  if (fullyComplete) {
    console.log('\n🎉 SUCCESS: All 2009 autumn exam questions are complete!');
    console.log('✅ All questions have explanations');
    console.log('✅ All questions have correct answers marked');
    console.log('\nThe 2009 autumn exam is ready for students! 🎓');
  } else {
    console.log('\n⚠️  INCOMPLETE: Some questions still need work');
    if (!explanationComplete) {
      console.log(`❌ ${questionsWithoutExplanations.length} questions need explanations`);
    }
    if (!answersComplete) {
      console.log(`❌ ${questionsWithoutCorrectAnswers.length} questions have answer issues`);
    }
  }
}

finalVerification().catch(console.error);