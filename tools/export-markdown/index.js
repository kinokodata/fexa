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
      skippedQuestions: 0,
      reregisteredQuestions: 0,
      errors: [],
      startTime: null,
      endTime: null
    };
  }

  async validateArgs(args) {
    if (args.length < 1) {
      throw new Error('使用方法: node index.js <text-data.mdファイルパス> [年度] [季節] [--question N] [--overwrite]');
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

    // オプション引数の解析
    let year = null;
    let season = null;
    let questionNumber = null;
    let overwrite = false;

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--question' && i + 1 < args.length) {
        questionNumber = parseInt(args[i + 1]);
        i++; // 次の引数もスキップ
      } else if (arg === '--overwrite') {
        overwrite = true;
      } else if (!arg.startsWith('--')) {
        // 位置引数として年度、季節を処理
        if (year === null && !isNaN(parseInt(arg))) {
          year = parseInt(arg);
        } else if (season === null) {
          season = arg;
        }
      }
    }

    return {
      mdPath,
      year,
      season,
      questionNumber,
      overwrite
    };
  }

  async exportMarkdown(mdPath, overrideYear = null, overrideSeason = null, questionNumber = null, overwrite = false) {
    this.stats.startTime = new Date();
    logger.start('Markdownエクスポート開始...');
    logger.info(`ファイル: ${mdPath}`);

    if (questionNumber) {
      logger.info(`単体問題モード: 問${questionNumber}`);
      if (overwrite) {
        logger.info(`上書きモード: 有効`);
      }
    }

    try {
      await this.supabase.connect();

      logger.search('Markdown解析開始...');
      const parseResult = await this.parser.parseFile(mdPath);
      
      const examInfo = {
        year: overrideYear || parseResult.examInfo.year,
        season: overrideSeason || parseResult.examInfo.season
      };

      logger.info(`年度: ${examInfo.year}年 ${examInfo.season}`);

      // 単体問題指定の場合は対象問題をフィルタ
      let targetQuestions = parseResult.questions;
      if (questionNumber) {
        targetQuestions = parseResult.questions.filter(q => q.number === questionNumber);
        if (targetQuestions.length === 0) {
          throw new Error(`問題${questionNumber}が見つかりません`);
        }
      }
      
      this.stats.totalQuestions = targetQuestions.length;

      const exam = await this.supabase.upsertExam(examInfo.year, examInfo.season);
      logger.success(`試験情報: ${examInfo.year}年 ${examInfo.season} (ID: ${exam.id})`);

      await this.parser.validateImageFiles(targetQuestions, mdPath);

      await this.processQuestions(targetQuestions, exam.id, overwrite);


      this.stats.endTime = new Date();
      this.printFinalReport();

    } catch (error) {
      logger.error('エクスポート失敗:', error.message);
      throw error;
    }
  }

  async processQuestions(questions, examId, overwrite = false) {
    logger.info(`問題保存開始: ${questions.length}問`);

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      try {
        const existing = await this.supabase.findExistingQuestion(examId, question.number, '午前');
        
        if (existing) {
          if (overwrite) {
            logger.warn(`問題${question.number}: 上書きモードのため更新`);
            await this.updateExistingQuestion(question, existing.id);
            this.stats.reregisteredQuestions++;
          } else {
            // 選択肢の存在を確認
            const hasChoices = await this.supabase.checkQuestionHasChoices(existing.id);
            
            if (hasChoices) {
              logger.warn(`問題${question.number}: 既に完全に登録済みのためスキップ`);
              this.stats.skippedQuestions++;
              continue;
            } else {
              logger.warn(`問題${question.number}: 選択肢が不完全なため削除して再登録`);
              // 不完全な問題を削除してから再登録
              await this.supabase.deleteQuestion(existing.id);
              this.stats.reregisteredQuestions++;
            }
          }
        }

        if (!existing || !overwrite) {
          await this.saveQuestion(question, examId);
          this.stats.successfulQuestions++;
        }

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
    // 表形式選択肢かどうかを判定
    const hasChoiceTable = question.choices.some(c => c.isTableFormat);
    let choiceTableMarkdown = null;
    
    if (hasChoiceTable && question.choices.length > 0) {
      // 表形式の場合、Markdownテーブルを生成
      choiceTableMarkdown = this.generateChoiceTableMarkdown(question.choices);
    }
    
    const questionData = {
      exam_id: examId,
      question_number: question.number,
      question_type: '午前',
      question_text: question.text,
      has_choice_table: hasChoiceTable,
      choice_table_type: hasChoiceTable ? 'markdown' : null,
      choice_table_markdown: choiceTableMarkdown
    };

    const savedQuestion = await this.supabase.insertQuestion(questionData);

    let savedChoices = [];
    if (question.choices.length > 0 && !hasChoiceTable) {
      // 表形式でない場合のみ、通常の選択肢として保存
      const choicesData = question.choices.map(choice => ({
        question_id: savedQuestion.id,
        choice_label: choice.option,
        choice_text: choice.text,
        has_image: choice.images.length > 0
      }));

      savedChoices = await this.supabase.insertChoices(choicesData);
    } else if (hasChoiceTable) {
      // 表形式の場合も選択肢レコードは作成（ただしchoice_textは簡略化）
      const choicesData = question.choices.map(choice => ({
        question_id: savedQuestion.id,
        choice_label: choice.option,
        choice_text: choice.text || '',  // 表形式の場合の簡略テキスト
        has_image: false
      }));

      savedChoices = await this.supabase.insertChoices(choicesData);
    }

    // 問題画像の保存
    if (question.images.length > 0) {
      const questionImageData = question.images.map(img => ({
        question_id: savedQuestion.id,
        image_url: img.filename,
        caption: img.altText,
        image_type: 'question'
      }));

      await this.supabase.insertQuestionImages(questionImageData);
    }

    // 選択肢画像の保存
    for (let i = 0; i < question.choices.length; i++) {
      const choice = question.choices[i];
      const savedChoice = savedChoices[i];
      
      if (choice.images.length > 0 && savedChoice) {
        const choiceImageData = choice.images.map(img => ({
          choice_id: savedChoice.id,
          image_url: img.filename,
          caption: img.altText,
          image_type: 'choice'
        }));

        await this.supabase.insertChoiceImages(choiceImageData);
      }
    }
  }

  async updateExistingQuestion(question, questionId) {
    // 表形式選択肢かどうかを判定
    const hasChoiceTable = question.choices.some(c => c.isTableFormat);
    let choiceTableMarkdown = null;
    
    if (hasChoiceTable && question.choices.length > 0) {
      // 表形式の場合、Markdownテーブルを生成
      choiceTableMarkdown = this.generateChoiceTableMarkdown(question.choices);
    }
    
    // 問題本文を更新
    const questionData = {
      question_text: question.text,
      has_choice_table: hasChoiceTable,
      choice_table_type: hasChoiceTable ? 'markdown' : null,
      choice_table_markdown: choiceTableMarkdown
    };

    await this.supabase.updateQuestion(questionId, questionData);

    // 既存の画像データを削除
    await this.supabase.deleteQuestionImages(questionId);

    // 選択肢を更新
    let savedChoices = [];
    if (question.choices.length > 0) {
      const choicesData = question.choices.map(choice => ({
        choice_text: choice.text,
        has_image: choice.images.length > 0
      }));

      savedChoices = await this.supabase.updateChoices(questionId, choicesData);
    }

    // 問題画像の保存
    if (question.images.length > 0) {
      const questionImageData = question.images.map(img => ({
        question_id: questionId,
        image_url: img.filename,
        caption: img.altText,
        image_type: 'question'
      }));

      await this.supabase.insertQuestionImages(questionImageData);
    }

    // 選択肢画像の保存
    for (let i = 0; i < question.choices.length; i++) {
      const choice = question.choices[i];
      const savedChoice = savedChoices[i];
      
      if (choice.images.length > 0 && savedChoice) {
        const choiceImageData = choice.images.map(img => ({
          choice_id: savedChoice.id,
          image_url: img.filename,
          caption: img.altText,
          image_type: 'choice'
        }));

        await this.supabase.insertChoiceImages(choiceImageData);
      }
    }
  }


  generateChoiceTableMarkdown(choices) {
    if (!choices || choices.length === 0 || !choices[0].isTableFormat) {
      return null;
    }
    
    // ヘッダー行の生成
    const headers = choices[0].tableHeaders || [];
    let markdown = '| ' + headers.join(' | ') + ' |\n';
    markdown += '|' + headers.map(() => '---').join('|') + '|\n';
    
    // データ行の生成
    for (const choice of choices) {
      if (choice.tableData) {
        markdown += '| ' + choice.tableData.join(' | ') + ' |\n';
      }
    }
    
    return markdown.trim();
  }

  printFinalReport() {
    const duration = Math.round((this.stats.endTime - this.stats.startTime) / 1000);
    
    logger.complete('エクスポート完了!');
    logger.stats(`処理時間: ${duration}秒`);
    logger.stats(`新規登録: ${this.stats.successfulQuestions - this.stats.reregisteredQuestions}問`);
    
    if (this.stats.reregisteredQuestions > 0) {
      logger.stats(`再登録: ${this.stats.reregisteredQuestions}問`);
    }
    
    if (this.stats.skippedQuestions > 0) {
      logger.stats(`スキップ: ${this.stats.skippedQuestions}問（既に完全登録済み）`);
    }
    
    if (this.stats.failedQuestions > 0) {
      logger.stats(`失敗: ${this.stats.failedQuestions}問`);
      logger.error('エラー一覧:');
      this.stats.errors.forEach(error => {
        logger.error(`  - 問題${error.questionNumber}: ${error.error}`);
      });
    }
    
    const totalProcessed = this.stats.successfulQuestions + this.stats.skippedQuestions + this.stats.failedQuestions;
    logger.stats(`合計: ${totalProcessed}問を処理`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const exporter = new MarkdownExporter();

  try {
    const { mdPath, year, season, questionNumber, overwrite } = await exporter.validateArgs(args);
    await exporter.exportMarkdown(mdPath, year, season, questionNumber, overwrite);
    process.exit(0);
  } catch (error) {
    logger.error('実行エラー:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}