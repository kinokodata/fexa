import pdf from 'pdf-parse';
import logger from '../lib/logger.js';

/**
 * PDFから基本情報技術者試験の問題を解析（Vercel環境対応版）
 */
export class PdfParser {
  constructor() {
    this.patterns = {
      questionNumber: /問\s*(\d+)/g,
      choiceLabel: /^([アイウエ])\s+(.+)/,
      pageBreak: /－\s*\d+\s*－/,
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
      if (inQuestion && !choiceMatch && currentChoices.length === 0) {
        if (!line.match(/問\s*\d+/)) {
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
      .replace(/－\s*\d+\s*－/g, '')
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
   * 完全なPDF解析処理
   */
  async parsePdf(pdfBuffer, metadata = {}) {
    try {
      logger.info('PDF解析を開始します', metadata);

      const { text, numPages, info } = await this.extractText(pdfBuffer);
      logger.info(`PDFから${numPages}ページのテキストを抽出しました`);

      const questionType = this.detectQuestionType(text);
      const questions = this.parseQuestions(text, questionType);
      
      logger.info(`${questions.length}個の問題を抽出しました`);

      return {
        success: true,
        metadata: {
          ...metadata,
          numPages,
          pdfInfo: info,
          questionType
        },
        questions,
        images: [], // Vercel環境では画像抽出をスキップ
        stats: {
          totalQuestions: questions.length,
          questionsWithChoices: questions.filter(q => q.choices.length > 0).length,
          totalImages: 0
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

const pdfParser = new PdfParser();
export default pdfParser;