import { buildClassificationPrompt } from '../prompts/classification-prompt.js';

class QuestionClassifier {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.classificationCache = new Map();
  }

  // Claude Code環境での分類実行（内蔵Claude APIを活用）
  async classifyQuestion(question, categoryHierarchy, retries = 3) {
    const cacheKey = `${question.id}_${JSON.stringify(categoryHierarchy).slice(0, 100)}`;
    
    // キャッシュチェック
    if (this.classificationCache.has(cacheKey)) {
      return this.classificationCache.get(cacheKey);
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const prompt = buildClassificationPrompt(question, categoryHierarchy);
        
        // Claude Code環境では内蔵Claude APIを使用
        // この部分はClaude Codeの機能を活用
        console.log(`🤔 問題${question.question_number}を分析中... (試行 ${attempt}/${retries})`);
        console.log(`プロンプト: ${prompt.slice(0, 200)}...`);
        
        // Claude Code環境でのAI推論をシミュレート
        // 実際の環境では内蔵Claude機能を使用
        const mockResponse = await this.generateMockClassification(question, categoryHierarchy);
        
        // 結果を検証
        const validation = this.validateClassification(mockResponse);
        if (!validation.isValid) {
          throw new Error(`分類結果が無効: ${validation.errors.join(', ')}`);
        }

        // キャッシュに保存
        this.classificationCache.set(cacheKey, mockResponse);
        
        console.log(`✅ 問題${question.question_number}の分類完了`);
        return mockResponse;
        
      } catch (error) {
        console.error(`❌ 問題${question.question_number}の分類失敗 (試行 ${attempt}/${retries}): ${error.message}`);
        
        if (attempt === retries) {
          return {
            error: true,
            message: error.message,
            question_id: question.id
          };
        }
        
        // 指数バックオフで待機
        await this.sleep(1000 * attempt);
      }
    }
  }

  // モック分類（実際の環境ではClaude APIレスポンス）
  async generateMockClassification(question, categoryHierarchy) {
    // 問題文に基づく簡単なルールベース分類
    const questionText = question.question_text.toLowerCase();
    
    if (questionText.includes('ipv4') || questionText.includes('ネットワーク') || questionText.includes('tcp') || questionText.includes('プロトコル')) {
      return {
        categories: [{
          field: "テクノロジ系",
          major: "技術要素",
          medium: "ネットワーク",
          minor: "ネットワーク方式",
          knowledge: "インターネットプロトコル",
          relevance_score: 0.9,
          is_primary: true,
          reasoning: "ネットワーク関連のキーワードが含まれているため"
        }],
        new_knowledge_proposals: [],
        overall_confidence: 0.8,
        notes: "ルールベース分類（モック）"
      };
    }
    
    if (questionText.includes('データベース') || questionText.includes('sql') || questionText.includes('table')) {
      return {
        categories: [{
          field: "テクノロジ系",
          major: "技術要素", 
          medium: "データベース",
          minor: "データベース方式",
          knowledge: "関係データベース",
          relevance_score: 0.85,
          is_primary: true,
          reasoning: "データベース関連のキーワードが含まれているため"
        }],
        new_knowledge_proposals: [],
        overall_confidence: 0.8,
        notes: "ルールベース分類（モック）"
      };
    }
    
    // デフォルト分類
    return {
      categories: [{
        field: "テクノロジ系",
        major: "基礎理論",
        medium: "基礎理論", 
        minor: "離散数学",
        knowledge: "数値の表現",
        relevance_score: 0.6,
        is_primary: true,
        reasoning: "具体的なカテゴリが特定できないため基礎理論に分類"
      }],
      new_knowledge_proposals: [{
        field: "テクノロジ系",
        major: "基礎理論",
        medium: "基礎理論",
        minor: "離散数学", 
        knowledge_name: "問題分析技法",
        reason: "具体的な技術分野を特定できない問題のための分類",
        confidence: 0.5
      }],
      overall_confidence: 0.6,
      notes: "デフォルト分類（要人間レビュー）"
    };
  }

  // 分類結果の検証
  validateClassification(classification) {
    const errors = [];
    
    if (!classification.categories || !Array.isArray(classification.categories)) {
      errors.push('categories配列が必須');
    }
    
    if (classification.categories) {
      const primaryCount = classification.categories.filter(c => c.is_primary).length;
      if (primaryCount !== 1) {
        errors.push(`主要カテゴリは1つのみ必須（現在: ${primaryCount}個）`);
      }
      
      for (const cat of classification.categories) {
        if (!cat.field || !cat.major || !cat.medium || !cat.minor || !cat.knowledge) {
          errors.push('カテゴリの階層情報が不完全');
        }
        
        if (cat.relevance_score < 0.1 || cat.relevance_score > 1.0) {
          errors.push('関連度スコアは0.1-1.0の範囲で設定');
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default QuestionClassifier;