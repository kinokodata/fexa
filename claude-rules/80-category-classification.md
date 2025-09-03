# LLMカテゴリ自動分類システム開発ルール

## 概要

LLM（Claude API）を使用して、全問題に対してカテゴリの自動分類・関連付けを行うツールの開発・運用ルールです。

## 目的

- 全問題への自動カテゴリ付与
- 複数カテゴリの適切な関連付け  
- 新規ナレッジの自動提案・作成
- 分類品質の確保と継続改善

## システム構成

### ディレクトリ構造

```
tools/
└── category-classification/
    ├── Dockerfile
    ├── package.json
    ├── README.md
    ├── classify-all.js           # メインスクリプト
    ├── classify-batch.js         # バッチ処理
    ├── reclassify.js            # 既存分類見直し
    ├── suggest-knowledge.js      # 新規ナレッジ提案
    ├── lib/
    │   ├── claude-client.js      # Claude API接続
    │   ├── classifier.js         # 分類ロジック
    │   ├── category-utils.js     # カテゴリ操作
    │   ├── knowledge-manager.js  # ナレッジ管理
    │   ├── validator.js          # 分類結果検証
    │   └── logger.js            # ログ機能
    ├── prompts/
    │   ├── classification.txt    # メイン分類プロンプト
    │   ├── knowledge-creation.txt # ナレッジ作成プロンプト
    │   └── examples.json        # Few-shot例
    ├── config/
    │   └── categories.json       # カテゴリ設定
    └── logs/
        └── .gitkeep
```

## 実装仕様

### 1. メインスクリプト（classify-all.js）

```javascript
// 実行例
// node classify-all.js --year=2023 --season=春期 --dry-run
// node classify-all.js --all --batch-size=10
// node classify-all.js --review-only

const main = async (options) => {
  // 1. 対象問題の取得
  const questions = await getTargetQuestions(options);
  
  // 2. 既存カテゴリ階層の読み込み
  const categoryHierarchy = await loadCategoryHierarchy();
  
  // 3. バッチ処理実行
  await processBatches(questions, categoryHierarchy, options);
  
  // 4. 結果レポート生成
  await generateReport(results);
};
```

### 2. Claude API連携（claude-client.js）

```javascript
class ClaudeClient {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.model = 'claude-3-haiku-20240307'; // コスト効率重視
    this.maxTokens = 4096;
  }
  
  async classifyQuestion(question, categoryHierarchy) {
    const prompt = await buildClassificationPrompt(question, categoryHierarchy);
    
    const response = await this.sendRequest({
      model: this.model,
      max_tokens: this.maxTokens,
      messages: [{ role: 'user', content: prompt }]
    });
    
    return JSON.parse(response.content[0].text);
  }
}
```

### 3. プロンプト設計（classification.txt）

```
# 基本情報技術者試験問題のカテゴリ分類

あなたは基本情報技術者試験の専門家です。問題を分析し、適切なカテゴリに分類してください。

## カテゴリ階層構造
{categoryHierarchy}

## 分類ルール
1. 最大3つのナレッジまで付与可能
2. 主要カテゴリは1つ（is_primary: true）
3. 関連度スコア（0.1-1.0）を適切に設定
4. 該当ナレッジがない場合は新規提案

## 分類対象問題
**年度・季節**: {year}年{season}
**問題番号**: 問{questionNumber}
**問題種別**: {questionType}

**問題文**:
{questionText}

**選択肢**:
{choices}

## 出力形式（JSON）
```json
{
  "categories": [
    {
      "field": "テクノロジ系",
      "major": "基礎理論", 
      "medium": "基礎理論",
      "minor": "離散数学",
      "knowledge": "集合・論理演算",
      "relevance_score": 0.9,
      "is_primary": true,
      "reasoning": "この問題は集合の演算について扱っているため"
    }
  ],
  "new_knowledge_proposals": [
    {
      "field": "テクノロジ系",
      "major": "基礎理論",
      "medium": "基礎理論", 
      "minor": "離散数学",
      "knowledge_name": "ベン図",
      "reason": "集合の関係をベン図で表現する問題が頻出するため",
      "confidence": 0.8
    }
  ],
  "overall_confidence": 0.9,
  "notes": "追加コメント（あれば）"
}
```

重要: 有効なJSONのみ出力してください。説明文は含めないでください。
```

### 4. バッチ処理（classify-batch.js）

```javascript
const processBatch = async (questions, categoryHierarchy, options = {}) => {
  const { batchSize = 10, delayMs = 1000, dryRun = false } = options;
  
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    
    // 並列処理でClaude API呼び出し（レート制限内で）
    const classifications = await Promise.all(
      batch.map(q => claudeClient.classifyQuestion(q, categoryHierarchy))
    );
    
    // 新規ナレッジ処理
    if (!dryRun) {
      await handleNewKnowledgeProposals(classifications);
      await assignCategoriesToQuestions(batch, classifications);
    }
    
    // 進捗表示
    logger.info(`進捗: ${Math.min(i + batchSize, questions.length)}/${questions.length}`);
    
    // レート制限対応
    await sleep(delayMs);
  }
};
```

### 5. 新規ナレッジ管理（knowledge-manager.js）

```javascript
class KnowledgeManager {
  async handleProposals(proposals) {
    const filteredProposals = await this.filterExistingKnowledge(proposals);
    
    for (const proposal of filteredProposals) {
      // 信頼度チェック
      if (proposal.confidence < 0.7) {
        await this.queueForReview(proposal);
        continue;
      }
      
      // 自動承認・作成
      const created = await this.createKnowledge(proposal);
      if (created) {
        logger.info(`✅ 新規ナレッジ作成: ${proposal.knowledge_name}`);
      }
    }
  }
  
  async createKnowledge(proposal) {
    // 階層の完全性チェック
    const parentExists = await this.validateHierarchy(proposal);
    if (!parentExists) {
      logger.warn(`階層不整合: ${JSON.stringify(proposal)}`);
      return false;
    }
    
    // Supabaseに新規ナレッジ作成
    const result = await supabase.from('categories').insert({
      exam_code: 'FE',
      level: 5,
      category_type: 'knowledge',
      field_name: proposal.field,
      major_category: proposal.major,
      medium_category: proposal.medium,
      minor_category: proposal.minor,
      knowledge_item: proposal.knowledge_name,
      name: proposal.knowledge_name,
      description: `LLM提案: ${proposal.reason}`
    });
    
    return result.error === null;
  }
}
```

### 6. 分類結果検証（validator.js）

```javascript
class ClassificationValidator {
  async validateBatch(questions, classifications) {
    const issues = [];
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const classification = classifications[i];
      
      // 1. 基本構造チェック
      if (!this.isValidStructure(classification)) {
        issues.push({ questionId: question.id, type: 'invalid_structure' });
      }
      
      // 2. スコア妥当性チェック  
      if (!this.isValidScores(classification)) {
        issues.push({ questionId: question.id, type: 'invalid_scores' });
      }
      
      // 3. カテゴリ階層整合性チェック
      if (!await this.isValidHierarchy(classification)) {
        issues.push({ questionId: question.id, type: 'invalid_hierarchy' });
      }
      
      // 4. 重複チェック
      if (await this.hasDuplicateAssignment(question.id, classification)) {
        issues.push({ questionId: question.id, type: 'duplicate_assignment' });
      }
    }
    
    return issues;
  }
  
  isValidScores(classification) {
    return classification.categories.every(cat => 
      cat.relevance_score >= 0.1 && 
      cat.relevance_score <= 1.0 &&
      classification.categories.filter(c => c.is_primary).length === 1
    );
  }
}
```

## 実行コマンド仕様

### Docker実行

```bash
# 全問題分類（本番実行）
docker compose run category-classifier node classify-all.js --all

# 特定年度・季節
docker compose run category-classifier node classify-all.js --year=2023 --season=春期

# ドライラン（実際の更新なし）
docker compose run category-classifier node classify-all.js --all --dry-run

# 既存分類の見直し
docker compose run category-classifier node reclassify.js --confidence-threshold=0.8

# 新規ナレッジ提案のみ
docker compose run category-classifier node suggest-knowledge.js --output=proposals.json

# バッチサイズとレート調整
docker compose run category-classifier node classify-all.js --all --batch-size=5 --delay=2000
```

### 環境変数

```env
# 必須環境変数
CLAUDE_API_KEY=sk-ant-api03-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# オプション環境変数
CLAUDE_MODEL=claude-3-haiku-20240307  # デフォルトモデル
MAX_TOKENS=4096                       # レスポンス最大トークン
BATCH_SIZE=10                        # デフォルトバッチサイズ
RATE_LIMIT_DELAY=1000               # API呼び出し間隔（ms）
LOG_LEVEL=info                      # ログレベル
```

## 品質管理

### 分類精度の確保

1. **Few-shot例の活用**: 高品質な分類例をプロンプトに含める
2. **信頼度スコア**: 低信頼度分類は人間レビュー対象
3. **結果検証**: 自動検証ロジックで異常検知
4. **継続改善**: 分類結果の分析に基づくプロンプト改善

### エラーハンドリング

```javascript
const robustClassify = async (question, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await claudeClient.classifyQuestion(question);
      return result;
    } catch (error) {
      logger.warn(`分類失敗 (試行${i+1}/${retries}): ${error.message}`);
      if (i === retries - 1) {
        // 最終的に失敗した場合はスキップして継続
        await logFailedQuestion(question, error);
        return null;
      }
      await sleep(1000 * (i + 1)); // 指数バックオフ
    }
  }
};
```

### レポート機能

```javascript
const generateReport = (results) => {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total_questions: results.length,
      successfully_classified: results.filter(r => r.success).length,
      failed_classifications: results.filter(r => !r.success).length,
      new_knowledge_created: results.filter(r => r.newKnowledgeCount > 0).length
    },
    new_knowledge: results.flatMap(r => r.newKnowledge || []),
    failed_questions: results.filter(r => !r.success).map(r => r.questionId),
    low_confidence: results.filter(r => r.confidence < 0.7).map(r => r.questionId)
  };
  
  fs.writeFileSync(`logs/classification-report-${Date.now()}.json`, JSON.stringify(report, null, 2));
  logger.info(`📊 レポート生成完了: ${report.summary.successfully_classified}/${report.summary.total_questions} 問題を分類`);
};
```

## 運用フロー

### 初回実行

1. **プロトタイプテスト**: 10-20問での動作確認
2. **プロンプト調整**: 分類精度の改善
3. **本格実行**: 全問題の分類実行
4. **結果レビュー**: 低信頼度分類の手動確認

### 継続運用

1. **新問題対応**: PDFインポート後の自動分類
2. **定期見直し**: 既存分類の精度向上
3. **カテゴリ進化**: 新しいナレッジの継続追加

## セキュリティ

- Claude API キーの適切な管理
- Supabase SERVICE_ROLE_KEY の保護
- ログファイルでの機密情報漏洩防止
- レート制限の遵守

---

このルールに従って、効率的かつ品質の高い自動カテゴリ分類システムを構築・運用する。