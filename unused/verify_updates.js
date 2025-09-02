import { createClient } from '@supabase/supabase-js';
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

async function verifyUpdates() {
  console.log('Verifying 2019 autumn exam updates...\n');
  
  // Get all questions for the 2019 autumn exam
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select(`
      id,
      question_number,
      explanation,
      exam_id,
      choices (
        id,
        choice_label,
        is_correct,
        choice_text
      )
    `)
    .eq('exam_id', 'eb6db0cf-72ef-4cff-ab4d-f94ac063b58c')
    .order('question_number');
  
  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
    return;
  }
  
  console.log(`Found ${questions.length} questions for 2019 autumn exam\n`);
  
  let questionsWithExplanations = 0;
  let questionsWithCorrectAnswers = 0;
  let totalQuestions = questions.length;
  
  // Verify each question
  questions.forEach((question, index) => {
    const hasExplanation = question.explanation && question.explanation.trim().length > 0;
    const correctChoices = question.choices.filter(choice => choice.is_correct);
    const hasCorrectAnswer = correctChoices.length === 1;
    
    if (hasExplanation) {
      questionsWithExplanations++;
    }
    
    if (hasCorrectAnswer) {
      questionsWithCorrectAnswers++;
    }
    
    // Show details for first 5 questions
    if (index < 5) {
      console.log(`Question ${question.question_number}:`);
      console.log(`  Explanation: ${hasExplanation ? '✓' : '✗'} ${hasExplanation ? '(length: ' + question.explanation.length + ')' : ''}`);
      console.log(`  Correct Answer: ${hasCorrectAnswer ? '✓' : '✗'} ${hasCorrectAnswer ? '(' + correctChoices[0].choice_label + ')' : ''}`);
      if (hasExplanation) {
        console.log(`  Preview: ${question.explanation.substring(0, 100)}...`);
      }
      console.log('');
    }
  });
  
  console.log('=== VERIFICATION SUMMARY ===');
  console.log(`Total Questions: ${totalQuestions}`);
  console.log(`Questions with Explanations: ${questionsWithExplanations} / ${totalQuestions} (${(questionsWithExplanations/totalQuestions*100).toFixed(1)}%)`);
  console.log(`Questions with Correct Answers: ${questionsWithCorrectAnswers} / ${totalQuestions} (${(questionsWithCorrectAnswers/totalQuestions*100).toFixed(1)}%)`);
  
  if (questionsWithExplanations === totalQuestions && questionsWithCorrectAnswers === totalQuestions) {
    console.log('\n🎉 ALL QUESTIONS SUCCESSFULLY UPDATED! 🎉');
    console.log('✓ All 76 questions have explanations');
    console.log('✓ All 76 questions have correct answers marked');
  } else {
    console.log('\n⚠️  Some questions may need attention:');
    if (questionsWithExplanations < totalQuestions) {
      console.log(`- ${totalQuestions - questionsWithExplanations} questions missing explanations`);
    }
    if (questionsWithCorrectAnswers < totalQuestions) {
      console.log(`- ${totalQuestions - questionsWithCorrectAnswers} questions missing correct answers`);
    }
  }
}

verifyUpdates();