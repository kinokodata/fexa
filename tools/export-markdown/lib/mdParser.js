import fs from 'fs/promises';
import path from 'path';
import Logger from './logger.js';

const logger = new Logger();

class MarkdownParser {
  constructor() {
    this.questionPattern = /^##\s*問\s*(\d+)/gm;
    this.choicePattern = /^-\s*([アイウエ])\.\s*(.+)/gm;
    this.imagePattern = /!\[([^\]]*)\]\(\.\/images\/([^)]+)\)/g;
    this.tablePattern = /^\|\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/gm;
  }

  async parseFile(mdPath) {
    try {
      const content = await fs.readFile(mdPath, 'utf8');
      logger.info(`Markdownファイル読み込み完了: ${path.basename(mdPath)}`);
      
      const { year, season } = this.extractExamInfo(mdPath, content);
      const questions = this.parseQuestions(content, mdPath);
      
      logger.stats(`解析結果: ${questions.length}問を検出`);
      
      const imageCount = questions.reduce((count, q) => count + q.images.length, 0);
      if (imageCount > 0) {
        logger.image(`画像参照: ${imageCount}個を検出`);
      }
      
      return {
        examInfo: { year, season },
        questions,
        stats: {
          totalQuestions: questions.length,
          totalImages: imageCount
        }
      };
    } catch (error) {
      logger.error(`Markdown解析失敗: ${error.message}`);
      throw error;
    }
  }

  extractExamInfo(mdPath, content) {
    const dirName = path.dirname(mdPath);
    const yearMatch = dirName.match(/(\d{4})_([ah])/);
    
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      const season = yearMatch[2] === 'a' ? '秋期' : '春期';
      return { year, season };
    }
    
    const contentMatch = content.match(/([平成令和]*\d+年度)\s*(春期|秋期)/);
    if (contentMatch) {
      let yearStr = contentMatch[1];
      const season = contentMatch[2];
      
      if (yearStr.includes('平成')) {
        const heisei = parseInt(yearStr.match(/\d+/)[0]);
        const year = heisei + 1988;
        return { year, season };
      } else if (yearStr.includes('令和')) {
        const reiwa = parseInt(yearStr.match(/\d+/)[0]);
        const year = reiwa + 2018;
        return { year, season };
      } else {
        const year = parseInt(yearStr.match(/\d+/)[0]);
        return { year, season };
      }
    }
    
    throw new Error(`年度・季節の判定に失敗: ${path.basename(mdPath)}`);
  }

  parseQuestions(content) {
    const sections = content.split(this.questionPattern);
    const questions = [];
    
    for (let i = 1; i < sections.length; i += 2) {
      const questionNumber = parseInt(sections[i]);
      const questionContent = sections[i + 1] || '';
      
      try {
        const parsedQuestion = this.parseQuestionContent(questionNumber, questionContent);
        if (parsedQuestion) {
          questions.push(parsedQuestion);
        }
      } catch (error) {
        logger.warn(`問題${questionNumber}の解析に失敗: ${error.message}`);
      }
    }
    
    return questions;
  }

  parseQuestionContent(questionNumber, content) {
    const choiceMatches = [...content.matchAll(this.choicePattern)];
    
    // 通常の箇条書き選択肢がある場合
    if (choiceMatches.length > 0) {
      const firstChoiceIndex = content.search(this.choicePattern);
      const questionText = content.substring(0, firstChoiceIndex).trim();
      
      if (!questionText) {
        logger.warn(`問題${questionNumber}: 問題文が空です`);
        return null;
      }
      
      const choices = choiceMatches.map(match => ({
        option: match[1],
        text: match[2].trim(),
        images: this.extractImages(match[2]),
        isTableFormat: false
      }));
      
      const questionImages = this.extractImages(questionText);
      
      return {
        number: questionNumber,
        text: questionText,
        choices,
        images: questionImages,
        hasImages: questionImages.length > 0 || choices.some(c => c.images.length > 0)
      };
    }
    
    // 表形式選択肢を検出
    const tableChoices = this.parseTableChoices(content);
    if (tableChoices.length > 0) {
      const tableStartIndex = content.search(/^\|\s*\|/gm);
      const questionText = content.substring(0, tableStartIndex).trim();
      
      if (!questionText) {
        logger.warn(`問題${questionNumber}: 問題文が空です`);
        return null;
      }
      
      const questionImages = this.extractImages(questionText);
      
      return {
        number: questionNumber,
        text: questionText,
        choices: tableChoices,
        images: questionImages,
        hasImages: questionImages.length > 0
      };
    }
    
    logger.warn(`問題${questionNumber}: 選択肢が見つかりません`);
    return null;
  }

  parseTableChoices(content) {
    // Markdown表の行を抽出
    const tableLines = content.split('\n').filter(line => line.trim().startsWith('|'));
    
    if (tableLines.length < 3) { // ヘッダー、区切り線、データ行が必要
      return [];
    }
    
    // ヘッダー行を解析
    const headerLine = tableLines[0];
    const headers = headerLine.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
    
    // データ行を解析（区切り線をスキップ）
    const dataRows = tableLines.slice(2); // 最初の2行（ヘッダーと区切り線）をスキップ
    const choices = [];
    
    for (const row of dataRows) {
      const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
      
      if (cells.length >= 2 && ['ア', 'イ', 'ウ', 'エ'].includes(cells[0])) {
        const option = cells[0];
        const rowData = cells.slice(1); // 最初のセル（選択肢記号）を除く
        
        // テキスト表現を作成
        const textParts = [];
        for (let i = 0; i < Math.min(headers.length - 1, rowData.length); i++) {
          if (headers[i + 1] && rowData[i]) { // headers[0]は空の可能性があるので+1
            textParts.push(`${headers[i + 1]}=${rowData[i]}`);
          }
        }
        const text = textParts.join(', ');
        
        choices.push({
          option,
          text,
          images: this.extractImages(text),
          isTableFormat: true,
          tableHeaders: headers,
          tableData: [option, ...rowData]
        });
      }
    }
    
    return choices;
  }

  extractImages(text) {
    const imageMatches = [...text.matchAll(this.imagePattern)];
    return imageMatches.map(match => ({
      filename: match[2],
      altText: match[1] || '',
      originalMatch: match[0]
    }));
  }

  async validateImageFiles(questions, mdPath) {
    const basePath = path.dirname(mdPath);
    const missingImages = [];
    
    for (const question of questions) {
      for (const image of question.images) {
        const imagePath = path.join(basePath, 'images', image.filename);
        try {
          await fs.access(imagePath);
        } catch {
          missingImages.push({
            questionNumber: question.number,
            filename: image.filename,
            altText: image.altText
          });
        }
      }
      
      for (const choice of question.choices) {
        for (const image of choice.images) {
          const imagePath = path.join(basePath, 'images', image.filename);
          try {
            await fs.access(imagePath);
          } catch {
            missingImages.push({
              questionNumber: question.number,
              choice: choice.option,
              filename: image.filename,
              altText: image.altText
            });
          }
        }
      }
    }
    
    if (missingImages.length > 0) {
      logger.warn(`画像ファイル未配置: ${missingImages.length}個`);
      missingImages.forEach(img => {
        const location = img.choice ? `問題${img.questionNumber}選択肢${img.choice}` : `問題${img.questionNumber}`;
        logger.warn(`  - ${img.filename} (${location}: ${img.altText})`);
      });
    }
    
    return missingImages;
  }
}

export default MarkdownParser;