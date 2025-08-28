#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import Logger from './lib/logger.js';
import MarkdownParser from './lib/mdParser.js';
import SupabaseClient from './lib/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = new Logger();

class MarkdownExporter {
  constructor() {
    this.parser = new MarkdownParser();
    this.supabase = new SupabaseClient();
    this.stats = {
      totalQuestions: 0,
      successfulQuestions: 0,
      failedQuestions: 0,
      errors: [],
      startTime: null,
      endTime: null
    };
  }

  async validateArgs(args) {
    if (args.length < 1) {
      throw new Error('使用方法: node index.js <text-data.mdファイルパス> [年度] [季節]');
    }

    const mdPath = path.resolve(args[0]);
    
    try {
      await fs.access(mdPath);
    } catch {
      throw new Error(`ファイルが見つかりません: ${mdPath}`);
    }

    if (!mdPath.endsWith('.md')) {
      throw new Error('Markdownファイル(.md)を指定してください');
    }

    return {
      mdPath,
      year: args[1] ? parseInt(args[1]) : null,
      season: args[2] || null
    };
  }

  async exportMarkdown(mdPath, overrideYear = null, overrideSeason = null) {
    this.stats.startTime = new Date();
    logger.start('Markdownエクスポート開始...');
    logger.info(`ファイル: ${mdPath}`);

    try {
      await this.supabase.connect();

      logger.search('Markdown解析開始...');
      const parseResult = await this.parser.parseFile(mdPath);
      
      const examInfo = {
        year: overrideYear || parseResult.examInfo.year,
        season: overrideSeason || parseResult.examInfo.season
      };

      logger.info(`年度: ${examInfo.year}年 ${examInfo.season}`);
      this.stats.totalQuestions = parseResult.questions.length;

      const exam = await this.supabase.upsertExam(examInfo.year, examInfo.season);
      logger.success(`試験情報: ${examInfo.year}年 ${examInfo.season} (ID: ${exam.id})`);

      await this.parser.validateImageFiles(parseResult.questions, mdPath);

      await this.processQuestions(parseResult.questions, exam.id);

      await this.saveImportHistory(mdPath, exam.id, parseResult.stats);

      this.stats.endTime = new Date();
      this.printFinalReport();

    } catch (error) {
      logger.error('エクスポート失敗:', error.message);
      throw error;
    }
  }

  async processQuestions(questions, examId) {
    logger.info(`問題保存開始: ${questions.length}問`);

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      try {
        const existing = await this.supabase.findExistingQuestion(examId, question.number);
        
        if (existing) {
          logger.warn(`問題${question.number}: 既に存在するためスキップ`);
          continue;
        }

        await this.saveQuestion(question, examId);
        this.stats.successfulQuestions++;

        if ((i + 1) % 10 === 0 || i === questions.length - 1) {
          logger.progress('問題保存中', i + 1, questions.length);
        }

      } catch (error) {
        this.stats.failedQuestions++;
        this.stats.errors.push({
          questionNumber: question.number,
          error: error.message
        });
        logger.error(`問題${question.number}の保存エラー:`, error.message);
      }
    }
  }

  async saveQuestion(question, examId) {
    const questionData = {
      exam_id: examId,
      question_number: question.number,
      question_text: question.text,
      has_images: question.hasImages
    };

    const savedQuestion = await this.supabase.insertQuestion(questionData);

    if (question.choices.length > 0) {
      const choicesData = question.choices.map(choice => ({
        question_id: savedQuestion.id,
        option: choice.option,
        text: choice.text,
        has_images: choice.images.length > 0
      }));

      await this.supabase.insertChoices(choicesData);
    }

    const allImages = [
      ...question.images.map(img => ({ ...img, type: 'question' })),
      ...question.choices.flatMap(choice => 
        choice.images.map(img => ({ ...img, type: 'choice', choice_option: choice.option }))
      )
    ];

    if (allImages.length > 0) {
      const imageData = allImages.map(img => ({
        question_id: savedQuestion.id,
        filename: img.filename,
        alt_text: img.altText,
        image_type: img.type,
        choice_option: img.choice_option || null,
        is_uploaded: false
      }));

      await this.supabase.insertQuestionImages(imageData);
    }
  }

  async saveImportHistory(mdPath, examId, stats) {
    const historyData = {
      exam_id: examId,
      source_file: path.basename(mdPath),
      questions_imported: this.stats.successfulQuestions,
      questions_failed: this.stats.failedQuestions,
      total_images: stats.totalImages,
      import_status: this.stats.failedQuestions > 0 ? 'partial_success' : 'success',
      error_details: this.stats.errors.length > 0 ? JSON.stringify(this.stats.errors) : null,
      imported_at: new Date()
    };

    await this.supabase.insertImportHistory(historyData);
  }

  printFinalReport() {
    const duration = Math.round((this.stats.endTime - this.stats.startTime) / 1000);
    
    logger.complete('エクスポート完了!');
    logger.stats(`処理時間: ${duration}秒`);
    logger.stats(`成功: ${this.stats.successfulQuestions}問`);
    
    if (this.stats.failedQuestions > 0) {
      logger.stats(`失敗: ${this.stats.failedQuestions}問`);
      logger.error('エラー一覧:');
      this.stats.errors.forEach(error => {
        logger.error(`  - 問題${error.questionNumber}: ${error.error}`);
      });
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const exporter = new MarkdownExporter();

  try {
    const { mdPath, year, season } = await exporter.validateArgs(args);
    await exporter.exportMarkdown(mdPath, year, season);
    process.exit(0);
  } catch (error) {
    logger.error('実行エラー:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}