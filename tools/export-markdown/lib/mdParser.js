import fs from 'fs/promises';
import path from 'path';
import Logger from './logger.js';

const logger = new Logger();

class MarkdownParser {
  constructor() {
    this.questionPattern = /^##\s*問\s*(\d+)/gm;
    this.choicePattern = /^-\s*([アイウエ])[、．\s]\s*(.+)/gm;
    this.imagePattern = /!\[([^\]]*)\]\(\.\/images\/([^)]+)\)/g;
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
      const season = yearMatch[2] === 'h' ? '秋期' : '春期';
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
    
    if (choiceMatches.length === 0) {
      logger.warn(`問題${questionNumber}: 選択肢が見つかりません`);
      return null;
    }
    
    const firstChoiceIndex = content.search(this.choicePattern);
    const questionText = content.substring(0, firstChoiceIndex).trim();
    
    if (!questionText) {
      logger.warn(`問題${questionNumber}: 問題文が空です`);
      return null;
    }
    
    const choices = choiceMatches.map(match => ({
      option: match[1],
      text: match[2].trim(),
      images: this.extractImages(match[2])
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