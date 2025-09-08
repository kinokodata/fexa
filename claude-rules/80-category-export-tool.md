# Export Categories ツール開発仕様

Claude Web版で作成された`category-data.json`ファイルをデータベースの`question_categories`テーブルに登録するツール（export-categories）の開発仕様です。

## 基本方針

### 手動カテゴリ分類の反映
- Claude Web版で人間が分析・作成したカテゴリ分類を使用
- AI自動分類ではなく、手動での高品質な分類結果を重視
- category-data.jsonファイルを中間形式として使用

### バッチ処理特化
- APIサーバー経由でのデータベース登録
- 重複チェック機能
- エラー耐性の高い設計

## ファイル構成

```
tools/
└── export-categories/
    ├── Dockerfile
    ├── package.json
    ├── README.md
    └── index.js           # メインスクリプト
```

## 実行方法

### Docker環境での実行
```bash
# 2010年春期のカテゴリデータを登録
docker compose run --rm export-categories node index.js 2010 h

# 2019年秋期のカテゴリデータを登録
docker compose run --rm export-categories node index.js 2019 a
```

### 引数仕様
- 第1引数: 年度（4桁数字、必須）
- 第2引数: 季節（h=春期、a=秋期、必須）

## 入力ファイル仕様

### ファイルパス
読み込み対象: `/pdfs/YYYY_X/category-data.json`

例: `/pdfs/2010_h/category-data.json`, `/pdfs/2019_a/category-data.json`

### JSON形式
```json
{
  "2010年春期": [
    {
      "questionNumber": 1,
      "categories": [
        {
          "field": "テクノロジ系",
          "major": "基礎理論",
          "medium": "基礎理論", 
          "minor": "離散数学",
          "knowledge": "集合・論理演算"
        }
      ]
    },
    {
      "questionNumber": 2,
      "categories": [
        {
          "field": "テクノロジ系",
          "major": "コンピュータシステム",
          "medium": "コンピュータ構成要素",
          "minor": "プロセッサ",
          "knowledge": "命令実行制御"
        }
      ]
    }
  ]
}
```

## 処理フロー

1. **認証処理**
   - APIサーバーにJWT認証でログイン
   - Bearer Tokenの取得

2. **ファイル読み込み**
   - category-data.jsonファイルの存在確認
   - JSON構造の検証

3. **データベース照合**
   - 問題番号から問題IDを取得
   - カテゴリ階層からカテゴリIDを取得

4. **重複チェック**
   - question_categoriesテーブルの既存レコード確認
   - 重複する場合はスキップ

5. **データベース登録**
   - question_categoriesテーブルに新規レコード挿入

## データベース仕様

### 登録先テーブル: question_categories
```javascript
{
  question_id: questionId,    // 問題ID (FK)
  category_id: categoryId,    // カテゴリID (FK)
  created_at: timestamp,      // 作成日時
  updated_at: timestamp       // 更新日時
}
```

### 参照テーブル
- **questions**: 問題マスタ（question_numberで照合）
- **categories**: カテゴリマスタ（階層構造で照合）

## エラーハンドリング

### 継続処理方針
- 1問の失敗が全体を停止しない
- エラー詳細をログ出力
- 成功分は確実に保存

### エラー分類
```javascript
// ファイルアクセスエラー
if (!fs.existsSync(filePath)) {
  throw new Error(`カテゴリデータファイルが見つかりません: ${filePath}`);
}

// 問題ID取得エラー
if (!questionId) {
  console.error(`❌ 問題が見つかりません: ${year}年${seasonJp} 問${questionNumber}`);
  continue;
}

// カテゴリID取得エラー
if (!categoryId) {
  console.error(`❌ カテゴリが見つかりません: ${JSON.stringify(category)}`);
  continue;
}

// 重複チェック
if (existingRelation) {
  console.log(`⏭️  既に登録済み: 問${questionNumber} - ${category.knowledge}`);
  continue;
}
```

### リトライ機能
- API接続エラー時は3回まで自動リトライ
- JSON解析エラーは即座に失敗
- ネットワークエラーは指数バックオフで再試行

## ログ・進捗表示

### 標準出力形式
```
🚀 カテゴリエクスポート開始
📅 対象: 2010年春期
🔐 API認証を実行中...
✅ 認証成功
📁 カテゴリデータファイルを読み込み中: /pdfs/2010_h/category-data.json
📊 処理対象: 73問の問題
💾 カテゴリ登録中: 15/73
🎉 すべての処理が正常に完了しました！
```

### 統計情報
- 処理対象問題数
- 成功登録数
- スキップ数（重複）
- エラー発生数

## API連携

### 認証設定
```javascript
// JWT認証でAPIサーバーにログイン
const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: this.authUser,
    password: this.authPassword,
  }),
});
```

### データベース操作
```javascript
// 問題ID取得
const questionResponse = await fetch(
  `${this.apiBaseUrl}/api/questions/by-exam-and-number?year=${year}&season=${seasonJp}&number=${questionNumber}`,
  { headers: { 'Authorization': `Bearer ${this.authToken}` } }
);

// カテゴリ登録
const createResponse = await fetch(`${this.apiBaseUrl}/api/categories/assign`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.authToken}`
  },
  body: JSON.stringify({ questionId, categoryId })
});
```

## 環境変数

### 必須設定
```env
# .envファイルに記載
API_BASE_URL=http://backend:3000
APPLICATION_SERVICE_USER=service@example.com
APPLICATION_SERVICE_PASSWORD=password
```

### compose.yml設定
```yaml
export-categories:
  build:
    context: ./tools/export-categories
    dockerfile: Dockerfile
  environment:
    NODE_ENV: development
    API_BASE_URL: http://backend:3000
    APPLICATION_SERVICE_USER: ${APPLICATION_SERVICE_USER}
    APPLICATION_SERVICE_PASSWORD: ${APPLICATION_SERVICE_PASSWORD}
  volumes:
    - ./tools/export-categories:/app
    - /app/node_modules
    - ./pdfs:/pdfs:ro  # PDFディレクトリを読み取り専用でマウント
  working_dir: /app
  depends_on:
    - backend
  profiles:
    - tools
```

## ワークフロー連携

### 前提条件
1. Claude Web版でPDF解析完了
2. tools/export-markdownで問題データ登録完了
3. Claude Web版でカテゴリ分析完了（category-data.json作成）

### 実行タイミング
- カテゴリ分析完了後
- 問題データ登録後
- フロントエンド確認前

### 後続処理
- フロントエンドでのカテゴリ表示確認
- 必要に応じてextract-tagsでのタグ抽出

## テスト・検証

### 動作確認手順
1. category-data.jsonファイル配置確認
2. エクスポート実行
3. question_categoriesテーブル確認
4. フロントエンドでカテゴリ表示確認

### 品質チェック
- category-data.jsonの形式検証
- 問題番号の存在確認
- カテゴリ階層の整合性確認
- 重複登録の防止確認

## パフォーマンス

### 処理速度目標
- 小規模（〜50問）: 1分以内
- 大規模（80問+）: 2分以内
- 1問あたりの平均処理時間: 0.5秒

### メモリ使用量
- JSONファイル全体をメモリ読み込み
- 問題ごとに順次処理してメモリ開放

この設計により、Claude Web版で作成された高品質なカテゴリ分類をデータベースに効率的に反映し、問題とカテゴリの正確な紐づけを実現できます。