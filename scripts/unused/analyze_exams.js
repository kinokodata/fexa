#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(dirname(__dirname), '.env') });

class ExamAnalyzer {
  constructor() {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
  }

  async fetchExams() {
    try {
      const { data: exams, error: examsError } = await this.supabase
        .from('exams')
        .select('id, year, season, exam_date, created_at')
        .order('year', { ascending: false });

      if (examsError) throw examsError;

      // Get question counts for each exam
      const examsWithProgress = await Promise.all(exams.map(async (exam) => {
        const { data: questions, error: questionsError } = await this.supabase
          .from('questions')
          .select('id, is_checked')
          .eq('exam_id', exam.id);
        
        if (questionsError) {
          console.error(`試験 ${exam.id} の問題取得エラー:`, questionsError);
          return {
            ...exam,
            total_questions: 0,
            checked_questions: 0
          };
        }

        const totalQuestions = questions ? questions.length : 0;
        const checkedQuestions = questions ? questions.filter(q => q.is_checked).length : 0;

        return {
          ...exam,
          total_questions: totalQuestions,
          checked_questions: checkedQuestions
        };
      }));

      return examsWithProgress;
    } catch (error) {
      console.error('❌ 試験データ取得エラー:', error.message);
      return null;
    }
  }

  async fetchQuestionsForExam(examId) {
    try {
      const { data: questions, error } = await this.supabase
        .from('questions')
        .select(`
          id, question_number, question_type, explanation, exam_id,
          choices(id, choice_label, choice_text, is_correct)
        `)
        .eq('exam_id', examId);

      if (error) {
        console.error(`問題データ取得エラー (exam_id: ${examId}):`, error);
        return [];
      }

      return questions || [];
    } catch (error) {
      console.error(`❌ 問題データ取得エラー (exam_id: ${examId}):`, error.message);
      return [];
    }
  }

  analyzeQuestionCompleteness(questions) {
    const stats = {
      total: questions.length,
      withExplanation: 0,
      withoutExplanation: 0,
      withCorrectAnswer: 0,
      withoutCorrectAnswer: 0,
      fullyComplete: 0,
      needsWork: []
    };

    for (const question of questions) {
      // Check if explanation exists
      const hasExplanation = question.explanation && question.explanation.trim().length > 0;
      if (hasExplanation) {
        stats.withExplanation++;
      } else {
        stats.withoutExplanation++;
      }

      // Check if any choice is marked as correct
      const hasCorrectAnswer = question.choices && question.choices.some(choice => choice.is_correct === true);
      if (hasCorrectAnswer) {
        stats.withCorrectAnswer++;
      } else {
        stats.withoutCorrectAnswer++;
      }

      // Check if question is fully complete
      if (hasExplanation && hasCorrectAnswer) {
        stats.fullyComplete++;
      } else {
        stats.needsWork.push({
          id: question.id,
          question_number: question.question_number,
          question_type: question.question_type,
          hasExplanation,
          hasCorrectAnswer,
          missingItems: [
            ...(!hasExplanation ? ['explanation'] : []),
            ...(!hasCorrectAnswer ? ['correct_answer'] : [])
          ]
        });
      }
    }

    return stats;
  }

  formatSeasonDisplay(season) {
    return season === '春期' ? 'Spring' : 'Autumn';
  }

  async analyzeAllExams() {
    const exams = await this.fetchExams();
    if (!exams) {
      return;
    }

    console.log('\n📊 Exam Analysis Report');
    console.log('='.repeat(80));

    const examAnalysis = [];

    for (const exam of exams) {
      console.log(`\n🔍 Analyzing: ${exam.year} ${this.formatSeasonDisplay(exam.season)}`);
      
      const questions = await this.fetchQuestionsForExam(exam.id);
      const stats = this.analyzeQuestionCompleteness(questions);
      
      const completionPercentage = stats.total > 0 ? (stats.fullyComplete / stats.total * 100).toFixed(1) : '0.0';
      
      const examData = {
        ...exam,
        questions: stats.total,
        fullyComplete: stats.fullyComplete,
        needsWork: stats.total - stats.fullyComplete,
        completionPercentage: parseFloat(completionPercentage),
        withExplanation: stats.withExplanation,
        withoutExplanation: stats.withoutExplanation,
        withCorrectAnswer: stats.withCorrectAnswer,
        withoutCorrectAnswer: stats.withoutCorrectAnswer,
        questionDetails: stats.needsWork,
        readyForProcessing: stats.total - stats.fullyComplete // Questions that need work
      };

      examAnalysis.push(examData);

      console.log(`   📝 Total Questions: ${stats.total}`);
      console.log(`   ✅ Fully Complete: ${stats.fullyComplete} (${completionPercentage}%)`);
      console.log(`   📚 With Explanations: ${stats.withExplanation}/${stats.total}`);
      console.log(`   🎯 With Correct Answers: ${stats.withCorrectAnswer}/${stats.total}`);
      console.log(`   🚧 Need Work: ${stats.total - stats.fullyComplete}`);
    }

    // Sort by priority criteria
    const prioritizedExams = examAnalysis
      .filter(exam => exam.readyForProcessing > 0) // Only exams that need work
      .sort((a, b) => {
        // First priority: Most recent years
        if (a.year !== b.year) {
          return b.year - a.year;
        }
        // Second priority: Most questions ready for processing
        return b.readyForProcessing - a.readyForProcessing;
      });

    console.log('\n🎯 PRIORITIZED RECOMMENDATIONS');
    console.log('='.repeat(80));
    console.log('Exams sorted by: 1) Most recent years first, 2) Most questions needing work\n');

    if (prioritizedExams.length === 0) {
      console.log('🎉 All exams are fully complete! No further work needed.');
      return;
    }

    prioritizedExams.forEach((exam, index) => {
      const priority = index === 0 ? '🥇 HIGHEST PRIORITY' : 
                      index === 1 ? '🥈 SECOND PRIORITY' : 
                      index === 2 ? '🥉 THIRD PRIORITY' : `#${index + 1}`;
      
      console.log(`${priority}: ${exam.year} ${this.formatSeasonDisplay(exam.season)}`);
      console.log(`   📊 Progress: ${exam.fullyComplete}/${exam.questions} complete (${exam.completionPercentage}%)`);
      console.log(`   🚧 Work needed: ${exam.readyForProcessing} questions`);
      console.log(`   📝 Missing explanations: ${exam.withoutExplanation}`);
      console.log(`   🎯 Missing correct answers: ${exam.withoutCorrectAnswer}`);
      console.log('');
    });

    // Special note about 2009 autumn
    const autumn2009 = examAnalysis.find(exam => exam.year === 2009 && exam.season === '秋期');
    if (autumn2009) {
      console.log('\n📋 CURRENT STATUS: 2009 Autumn');
      console.log('-'.repeat(40));
      console.log(`Progress: ${autumn2009.fullyComplete}/${autumn2009.questions} complete (${autumn2009.completionPercentage}%)`);
      console.log(`Work needed: ${autumn2009.readyForProcessing} questions`);
    }

    // Recommend next exam after 2009 autumn
    const nextRecommendation = prioritizedExams.find(exam => !(exam.year === 2009 && exam.season === '秋期'));
    if (nextRecommendation) {
      console.log('\n🎯 RECOMMENDED NEXT EXAM AFTER 2009 AUTUMN:');
      console.log('-'.repeat(50));
      console.log(`${nextRecommendation.year} ${this.formatSeasonDisplay(nextRecommendation.season)}`);
      console.log(`${nextRecommendation.readyForProcessing} questions ready for processing`);
      console.log(`Current completion: ${nextRecommendation.completionPercentage}%`);
      
      // Show detailed breakdown for top priority exam
      if (nextRecommendation.questionDetails.length > 0) {
        console.log('\n🔍 DETAILED BREAKDOWN FOR TOP PRIORITY EXAM:');
        console.log(`${nextRecommendation.year} ${this.formatSeasonDisplay(nextRecommendation.season)} - First 10 questions needing work:`);
        
        const sampleQuestions = nextRecommendation.questionDetails.slice(0, 10);
        sampleQuestions.forEach((q, index) => {
          const missing = q.missingItems.join(', ');
          console.log(`   ${index + 1}. Q${q.question_number} (${q.question_type}) - Missing: ${missing}`);
        });
        
        if (nextRecommendation.questionDetails.length > 10) {
          console.log(`   ... and ${nextRecommendation.questionDetails.length - 10} more questions`);
        }
      }
    }

    // Summary statistics
    const totalQuestions = examAnalysis.reduce((sum, exam) => sum + exam.questions, 0);
    const totalComplete = examAnalysis.reduce((sum, exam) => sum + exam.fullyComplete, 0);
    const overallCompletion = totalQuestions > 0 ? (totalComplete / totalQuestions * 100).toFixed(1) : '0.0';

    console.log('\n📈 OVERALL STATISTICS');
    console.log('='.repeat(80));
    console.log(`Total Exams: ${examAnalysis.length}`);
    console.log(`Total Questions: ${totalQuestions}`);
    console.log(`Fully Complete Questions: ${totalComplete} (${overallCompletion}%)`);
    console.log(`Questions Needing Work: ${totalQuestions - totalComplete}`);
  }
}

// Run the analysis
const analyzer = new ExamAnalyzer();
analyzer.analyzeAllExams().catch(console.error);