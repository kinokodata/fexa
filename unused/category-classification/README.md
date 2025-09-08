# LLM カテゴリ自動分類ツール

Claude Code環境で動作する、基本情報技術者試験問題の自動カテゴリ分類ツールです。

## 機能

- ✅ 未分類問題の自動カテゴリ付与
- ✅ 複数カテゴリの関連付け対応
- ✅ 新規ナレッジの自動提案・作成
- ✅ バッチ処理による効率的な実行
- ✅ 分類結果の検証とレポート生成
- ✅ ドライラン機能（テスト実行）

## セットアップ

```bash
cd tools/category-classification
npm install
```

## 使用方法

### 1. テスト実行

```bash
# 5問のサンプルでテスト（ドライラン）
node test-classify.js
```

### 2. 基本実行

```bash
# 10問を対象にドライラン
node classify-all.js --limit=10 --dryRun=true

# 10問を実際に分類・登録
node classify-all.js --limit=10 --dryRun=false
```

### 3. 特定条件での実行

```bash
# 特定年度・季節の問題のみ
node classify-all.js --year=2023 --season=春期 --dryRun=true

# バッチサイズを調整
node classify-all.js --limit=20 --batchSize=3
```

### 4. 全問題の分類

```bash
# 全未分類問題を処理（本格運用）
node classify-all.js --limit=1000 --dryRun=false
```

## オプション

| オプション | 説明 | デフォルト | 例 |
|-----------|------|-----------|---|
| `--year` | 対象年度 | なし | `--year=2023` |
| `--season` | 対象季節 | なし | `--season=春期` |
| `--limit` | 処理問題数の上限 | 100 | `--limit=50` |
| `--dryRun` | テスト実行（実際の更新なし） | false | `--dryRun=true` |
| `--batchSize` | バッチサイズ | 5 | `--batchSize=3` |

## 出力

### コンソール出力例
```
🚀 カテゴリ自動分類を開始...
📋 対象問題を取得中...
📊 対象問題数: 25問
🏗️ カテゴリ階層を取得中...
📂 カテゴリ階層: 3フィールド

📦 バッチ 1/5 処理中...
🔍 問題1 を分析中...
🤔 問題1を分析中... (試行 1/3)
✅ 問題1の分類完了
🔍 問題2 を分析中...
🤔 問題2を分析中... (試行 1/3)
✨ 新規ナレッジ作成: IPv6プロトコル
✅ 問題2の分類完了

📈 進捗: 10/25 (40%)

📊 分類結果レポート:
- 総問題数: 25
- 成功: 23
- 失敗: 2
- 低信頼度: 3
- 新規ナレッジ作成: 5
- カテゴリ関連付け: 35
📄 詳細レポート: logs/classification-report-1699123456789.json
```

### レポートファイル例
```json
{
  "timestamp": "2023-11-04T12:34:56.789Z",
  "mode": "PRODUCTION",
  "summary": {
    "total_questions": 25,
    "successful_classifications": 23,
    "failed_classifications": 2,
    "low_confidence_count": 3,
    "new_knowledge_created": 5,
    "categories_assigned": 35
  },
  "failed_questions": [
    {
      "questionId": "abc-123",
      "questionNumber": 15,
      "error": "分類結果が無効"
    }
  ],
  "low_confidence_questions": [
    {
      "questionId": "def-456", 
      "questionNumber": 22,
      "confidence": 0.65
    }
  ],
  "new_knowledge": [
    {
      "field": "テクノロジ系",
      "major": "技術要素",
      "medium": "ネットワーク", 
      "minor": "ネットワーク方式",
      "knowledge_name": "IPv6プロトコル",
      "reason": "IPv6関連問題の増加に対応",
      "confidence": 0.85
    }
  ]
}
```

## ファイル構成

```
tools/category-classification/
├── package.json              # パッケージ設定
├── README.md                 # このファイル
├── classify-all.js           # メインスクリプト
├── test-classify.js          # テスト実行スクリプト
├── lib/
│   ├── supabase-client.js    # Supabase操作
│   └── classifier.js         # Claude分類処理
├── prompts/
│   └── classification-prompt.js # 分類プロンプト
└── logs/
    └── classification-report-*.json # 実行レポート
```

## 注意点

### 環境変数
以下の環境変数が必要です：
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 分類精度
- 現在はモック実装（ルールベース分類）
- 実際の運用ではClaude Code内蔵AI機能を使用
- 低信頼度（<0.7）の分類は人間レビュー推奨

### パフォーマンス
- バッチサイズを調整してメモリ使用量を制御
- レート制限を考慮したバッチ間待機時間
- 大量データ処理時は段階的実行を推奨

## トラブルシューティング

### よくあるエラー

1. **Supabase接続エラー**
   ```
   Error: Supabase credentials are required
   ```
   → 環境変数を確認してください

2. **分類結果が無効**
   ```
   Error: 分類結果が無効: categories配列が必須
   ```
   → Claude APIレスポンスの形式を確認

3. **メモリ不足**
   ```
   Error: JavaScript heap out of memory
   ```
   → バッチサイズを小さくしてください（`--batchSize=2`）

### デバッグモード
詳細なログが必要な場合：
```bash
DEBUG=1 node classify-all.js --limit=5 --dryRun=true
```