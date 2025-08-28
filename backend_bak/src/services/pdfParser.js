import fs from 'fs/promises';
import pdf from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';
import logger from '../utils/logger.js';

/**
 * PDFから基本情報技術者試験の問題を解析
 */
export class PdfParser {
  constructor() {
    // 問題パターンの定義
    this.patterns = {
      questionNumber: /問\s*(\d+)/g,
      choiceLabel: /^([アイウエ])\s+(.+)/,
      pageBreak: /－\s*\d+\s*－/, // ページ番号パターン
      sectionHeader: /^(午前|午後)問題/
    };
  }

  /**
 * PDFファイルを解析してテキストを抽出
   */
  async extractText(pdfBuffer) {
    try {
      const data = await pdf(pdfBuffer);
      return {
        text: data.text,
        numPages: data.numpages,
        info: data.info
      };
    } catch (error) {
      logger.error('PDF解析エラー:', error);
      throw new Error(`PDFの読み込みに失敗しました: ${error.message}`);
    }
  }

  /**
   * テキストから問題と選択肢を抽出
   */
  parseQuestions(text, questionType = '午前') {
    const questions = [];
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    let currentQuestion = null;
    let currentChoices = [];
    let questionText = [];
    let inQuestion = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // ページ番号行はスキップ
      if (this.patterns.pageBreak.test(line)) {
        continue;
      }

      // 問題番号の検出
      const questionMatch = line.match(/問\s*(\d+)/);
      if (questionMatch) {
        // 前の問題を保存
        if (currentQuestion && questionText.length > 0) {
          questions.push({
            questionNumber: currentQuestion,
            questionType,
            questionText: this.cleanQuestionText(questionText.join(' ')),
            choices: [...currentChoices]
          });
        }

        // 新しい問題を開始
        currentQuestion = parseInt(questionMatch[1]);
        currentChoices = [];
        questionText = [];
        inQuestion = true;
        
        // 問題番号の後のテキストを取得
        const afterNumber = line.substring(questionMatch.index + questionMatch[0].length).trim();
        if (afterNumber) {
          questionText.push(afterNumber);
        }
        continue;
      }

      // 選択肢の検出
      const choiceMatch = line.match(this.patterns.choiceLabel);
      if (choiceMatch && inQuestion) {
        currentChoices.push({
          label: choiceMatch[1],
          text: this.cleanChoiceText(choiceMatch[2])
        });
        continue;
      }

      // 問題文の続き
      if (inQuestion && !choiceMatch) {
        // 次の問題番号が来るまで問題文として扱う
        if (!line.match(/問\s*\d+/) && currentChoices.length === 0) {
          questionText.push(line);
        }
      }
    }

    // 最後の問題を保存
    if (currentQuestion && questionText.length > 0) {
      questions.push({
        questionNumber: currentQuestion,
        questionType,
        questionText: this.cleanQuestionText(questionText.join(' ')),
        choices: [...currentChoices]
      });
    }

    return questions;
  }

  /**
   * 問題文のクリーニング
   */
  cleanQuestionText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/－\s*\d+\s*－/g, '') // ページ番号を除去
      .trim();
  }

  /**
   * 選択肢テキストのクリーニング
   */
  cleanChoiceText(text) {
    return text
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * PDFから画像を抽出（将来の実装用）
   */
  async extractImages(pdfBuffer) {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      const images = [];

      // 現在は画像抽出をスキップ（複雑な実装が必要）
      logger.info(`PDF内の${pages.length}ページを確認しました`);
      
      return images;
    } catch (error) {
      logger.error('画像抽出エラー:', error);
      return [];
    }
  }

  /**
   * 完全なPDF解析処理
   */
  async parsePdf(pdfBuffer, metadata = {}) {
    try {
      logger.info('PDF解析を開始します', metadata);

      // テキスト抽出
      const { text, numPages, info } = await this.extractText(pdfBuffer);
      logger.info(`PDFから${numPages}ページのテキストを抽出しました`);

      // 問題タイプの判定（午前/午後）
      const questionType = this.detectQuestionType(text);
      
      // 問題の解析
      const questions = this.parseQuestions(text, questionType);
      logger.info(`${questions.length}個の問題を抽出しました`);

      // 画像の抽出（オプション）
      const images = await this.extractImages(pdfBuffer);
      if (images.length > 0) {
        logger.info(`${images.length}個の画像を抽出しました`);
      }

      return {
        success: true,
        metadata: {
          ...metadata,
          numPages,
          pdfInfo: info,
          questionType
        },
        questions,
        images,
        stats: {
          totalQuestions: questions.length,
          questionsWithChoices: questions.filter(q => q.choices.length > 0).length,
          totalImages: images.length
        }
      };
    } catch (error) {
      logger.error('PDF解析失敗:', error);
      return {
        success: false,
        error: error.message,
        metadata,
        questions: [],
        images: [],
        stats: {
          totalQuestions: 0,
          questionsWithChoices: 0,
          totalImages: 0
        }
      };
    }
  }

  /**
   * 問題タイプの自動検出
   */
  detectQuestionType(text) {
    const lines = text.substring(0, 1000).toLowerCase();
    if (lines.includes('午後')) {
      return '午後';
    }
    return '午前';
  }
}

export default new PdfParser();