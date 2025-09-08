// Claude Code環境では、MCPサーバー経由でSupabaseを使用
// 直接のSupabase接続の代わりに、ローカルファイルやMock実装を使用

class SupabaseClient {
  constructor() {
    // Claude Code環境用の設定
    this.client = null;
    console.log('🔗 Claude Code環境でSupabaseクライアントを初期化');
  }

  // 未分類問題を取得（モック実装）
  async getUnclassifiedQuestions(options = {}) {
    const { year, season, limit = 100 } = options;
    
    console.log(`📋 未分類問題を取得中... (limit: ${limit})`);
    
    // Claude Code環境用のモックデータ
    const mockQuestions = [
      {
        id: 'mock-q1',
        question_number: 1,
        question_type: '午前',
        question_text: 'IPv4アドレスのクラスAの特徴として正しいものはどれか。',
        exam_id: 'mock-exam-1',
        exams: { year: 2023, season: '春期' },
        choices: [
          { id: 'choice-1a', choice_label: 'ア', choice_text: 'ホスト部が8ビットである' },
          { id: 'choice-1b', choice_label: 'イ', choice_text: 'ネットワーク部が8ビットである' },
          { id: 'choice-1c', choice_label: 'ウ', choice_text: 'ホスト部が24ビットである' },
          { id: 'choice-1d', choice_label: 'エ', choice_text: 'ネットワーク部が24ビットである' }
        ]
      },
      {
        id: 'mock-q2',
        question_number: 2,
        question_type: '午前',
        question_text: 'データベースの正規化に関する記述として適切なものはどれか。',
        exam_id: 'mock-exam-1',
        exams: { year: 2023, season: '春期' },
        choices: [
          { id: 'choice-2a', choice_label: 'ア', choice_text: '第1正規形は重複を排除する' },
          { id: 'choice-2b', choice_label: 'イ', choice_text: '第2正規形は部分関数従属を排除する' },
          { id: 'choice-2c', choice_label: 'ウ', choice_text: '第3正規形は推移関数従属を排除する' },
          { id: 'choice-2d', choice_label: 'エ', choice_text: 'すべて正しい' }
        ]
      },
      {
        id: 'mock-q3',
        question_number: 3,
        question_type: '午前',
        question_text: '2進数1011を10進数に変換した値はどれか。',
        exam_id: 'mock-exam-1',
        exams: { year: 2023, season: '春期' },
        choices: [
          { id: 'choice-3a', choice_label: 'ア', choice_text: '9' },
          { id: 'choice-3b', choice_label: 'イ', choice_text: '11' },
          { id: 'choice-3c', choice_label: 'ウ', choice_text: '13' },
          { id: 'choice-3d', choice_label: 'エ', choice_text: '15' }
        ]
      }
    ];
    
    // 制限に応じて結果を調整
    const filteredQuestions = mockQuestions.slice(0, Math.min(limit, mockQuestions.length));
    
    console.log(`📊 ${filteredQuestions.length}件の未分類問題を取得しました`);
    return filteredQuestions;
  }

  // 全カテゴリ階層を取得（モック実装）
  async getCategoryHierarchy() {
    console.log('🏗️ カテゴリ階層を取得中...');
    
    // Claude Code環境用のモック階層データ
    const mockHierarchy = {
      "テクノロジ系": {
        "基礎理論": {
          "基礎理論": {
            "離散数学": {
              knowledge: [
                { id: 'know-1', name: '数値の表現', description: '2進数、16進数など' },
                { id: 'know-2', name: '集合・論理演算', description: '集合と論理演算' }
              ]
            }
          }
        },
        "技術要素": {
          "ネットワーク": {
            "ネットワーク方式": {
              knowledge: [
                { id: 'know-3', name: 'インターネットプロトコル', description: 'TCP/IP、HTTP、DNS等' },
                { id: 'know-4', name: 'ネットワーク機器', description: 'ルーター、スイッチ等' }
              ]
            }
          },
          "データベース": {
            "データベース方式": {
              knowledge: [
                { id: 'know-5', name: '関係データベース', description: 'RDB、正規化等' },
                { id: 'know-6', name: 'SQL', description: 'データベース言語' }
              ]
            }
          }
        }
      },
      "マネジメント系": {
        "プロジェクトマネジメント": {
          "プロジェクトマネジメント": {
            "プロジェクトの統合": {
              knowledge: [
                { id: 'know-7', name: 'プロジェクト計画', description: 'WBS、スケジュール管理' }
              ]
            }
          }
        }
      },
      "ストラテジ系": {
        "システム戦略": {
          "システム戦略": {
            "情報システム戦略": {
              knowledge: [
                { id: 'know-8', name: '情報システム企画', description: 'システム計画、要件定義' }
              ]
            }
          }
        }
      }
    };
    
    console.log(`📂 カテゴリ階層: ${Object.keys(mockHierarchy).length}フィールド`);
    return mockHierarchy;
  }

  // 新規ナレッジを作成（モック実装）
  async createKnowledge(proposal) {
    console.log(`✨ 新規ナレッジ作成（モック）: ${proposal.knowledge_name}`);
    
    // モック実装では実際の作成は行わない
    return {
      id: `mock-new-${Date.now()}`,
      knowledge_item: proposal.knowledge_name,
      description: `LLM提案: ${proposal.reason}`
    };
  }

  // 問題にカテゴリを関連付け（モック実装）
  async assignCategoryToQuestion(questionId, categoryId, options = {}) {
    const { relevanceScore = 0.8, isPrimary = false } = options;
    
    console.log(`🔗 カテゴリ関連付け（モック）: 問題${questionId} → カテゴリ${categoryId} (スコア: ${relevanceScore}, 主要: ${isPrimary})`);
    
    // モック実装では実際の関連付けは行わない
    return {
      question_id: questionId,
      category_id: categoryId,
      relevance_score: relevanceScore,
      is_primary: isPrimary
    };
  }

  // ナレッジが既に存在するかチェック（モック実装）
  async knowledgeExists(field, major, medium, minor, knowledgeName) {
    // 一部のナレッジは既存として扱う
    const existingKnowledge = [
      '数値の表現', 'インターネットプロトコル', '関係データベース'
    ];
    
    const exists = existingKnowledge.includes(knowledgeName);
    console.log(`🔍 ナレッジ存在チェック: ${knowledgeName} → ${exists ? '既存' : '新規'}`);
    
    return exists ? { id: `existing-${knowledgeName}` } : null;
  }

  // カテゴリIDを取得（モック実装）
  async getCategoryId(field, major, medium, minor, knowledge) {
    // カテゴリ名からIDをマッピング
    const categoryMapping = {
      '数値の表現': 'know-1',
      '集合・論理演算': 'know-2', 
      'インターネットプロトコル': 'know-3',
      'ネットワーク機器': 'know-4',
      '関係データベース': 'know-5',
      'SQL': 'know-6',
      'プロジェクト計画': 'know-7',
      '情報システム企画': 'know-8'
    };
    
    const categoryId = categoryMapping[knowledge] || `mock-${knowledge.replace(/\s+/g, '-')}`;
    console.log(`🆔 カテゴリID取得: ${knowledge} → ${categoryId}`);
    
    return categoryId;
  }
}

export default SupabaseClient;