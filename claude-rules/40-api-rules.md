# Fexa Backend API 仕様書

## システム概要

- **フレームワーク**: Express.js (Node.js)
- **データベース**: Supabase (PostgreSQL)
- **認証**: JWT認証
- **ストレージ**: Supabase Storage (画像ファイル)
- **言語**: Japanese (日本語)
- **用途**: 基本情報技術者試験の過去問データベース

## 共通仕様

### レスポンス形式
```json
// 成功時
{
  "success": true,
  "data": {}, // データ内容
  "pagination": {} // ページング情報（該当する場合）
}

// エラー時
{
  "success": false,
  "error": {
    "message": "エラーメッセージ"
  }
}
```

### 認証
- JWT認証が必要（`/api/health` 除く）
- `Authorization: Bearer <token>` ヘッダーが必要

### CORS設定
- Origin: `http://localhost:43000`
- Credentials: true

## API エンドポイント仕様

### 1. ヘルスチェック
```
GET /api/health
```

**パラメータ**:
- `detailed=true` (optional): データベース接続状況も含める

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "development",
    "database": { "status": "healthy" } // detailedパラメータ時のみ
  }
}
```

### 2. 試験一覧
```
GET /api/exams
```

**認証**: 必要

**レスポンス**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "year": 2023,
      "season": "春期",
      "exam_date": "2023-04-01",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**ソート**: 年度の降順 (year DESC)

### 3. 問題一覧
```
GET /api/questions
```

**認証**: 必要

**クエリパラメータ**:
- `year` (optional): 年度
- `season` (optional): 季節 (`spring` → `春期`, `autumn` → `秋期`)
- `page` (optional): ページ番号 (default: 1)
- `limit` (optional): 取得件数 (default: 20)

**レスポンス**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "question_number": 1,
      "question_type": "選択式",
      "question_text": "問題文...",
      "has_image": false,
      "created_at": "2024-01-01T00:00:00.000Z",
      "exam_id": 1,
      "choices": [
        {
          "id": 1,
          "choice_label": "ア",
          "choice_text": "選択肢A",
          "has_image": false,
          "is_table_format": false,
          "table_headers": null,
          "table_data": null
        }
      ],
      "categories": [
        {
          "id": 1,
          "name": "カテゴリ名"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

**重要な仕様**:
- 選択肢は必ず「ア、イ、ウ、エ」の順番でソートして返す
- ページング対応（offset/limit）
- 問題番号順でソート

### 4. 問題詳細
```
GET /api/questions/:id
```

**認証**: 必要

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "question_number": 1,
    "question_type": "選択式",
    "question_text": "問題文...",
    "has_image": false,
    "exam": {
      "year": 2023,
      "season": "春期",
      "exam_date": "2023-04-01"
    },
    "choices": [
      {
        "id": 1,
        "choice_label": "ア",
        "choice_text": "選択肢A",
        "is_correct": false
      }
    ],
    "answer": [
      {
        "correct_choice": "ア",
        "explanation": "解説..."
      }
    ]
  }
}
```

### 5. 画像アップロード
```
POST /api/images/upload
```

**認証**: 必要

**Content-Type**: `multipart/form-data`

**パラメータ**:
- `image`: 画像ファイル (max 10MB)
- `questionId`: 問題ID
- `choiceId`: 選択肢ID or "question"

**機能**:
- Supabase Storageに画像をアップロード
- `question_images` または `choice_images` テーブルに記録
- `questions` または `choices` テーブルの `has_image` フラグを更新

## データベーススキーマ

### exams テーブル
- `id`: Primary Key
- `year`: 年度
- `season`: 季節（春期/秋期）
- `exam_date`: 試験日
- `created_at`: 作成日時

### questions テーブル
- `id`: Primary Key
- `question_number`: 問題番号
- `question_type`: 問題タイプ
- `question_text`: 問題文
- `has_image`: 画像有無フラグ
- `exam_id`: 試験ID (FK)
- `created_at`: 作成日時

### choices テーブル
- `id`: Primary Key
- `choice_label`: 選択肢ラベル（ア、イ、ウ、エ）
- `choice_text`: 選択肢テキスト
- `has_image`: 画像有無フラグ
- `is_table_format`: テーブル形式フラグ
- `table_headers`: テーブルヘッダー
- `table_data`: テーブルデータ
- `is_correct`: 正解フラグ

### categories テーブル
- `id`: Primary Key
- `name`: カテゴリ名

### answers テーブル
- `correct_choice`: 正解選択肢
- `explanation`: 解説

### question_images テーブル（画像機能用）
- `id`: Primary Key
- `question_id`: 問題ID (FK)
- `image_url`: 画像URL
- `caption`: キャプション
- `image_type`: 画像タイプ

### choice_images テーブル（画像機能用）
- `id`: Primary Key
- `choice_id`: 選択肢ID (FK)
- `image_url`: 画像URL
- `caption`: キャプション
- `image_type`: 画像タイプ

## 環境設定

### 必要な環境変数
- `PORT`: サーバーポート (default: 3000)
- `NODE_ENV`: 実行環境
- `CORS_ORIGIN`: CORS許可オリジン (default: http://localhost:43000)
- `SUPABASE_STORAGE_BUCKET`: Supabase Storage バケット名

### 起動方法
```bash
npm start  # または npm run dev
```

## ファイル構成

```
backend/
├── package.json              # 依存関係と設定
├── src/
│   ├── index.js              # メインエントリーポイント
│   ├── lib/
│   │   ├── supabase.js       # Supabaseクライアント設定
│   │   └── logger.js         # ログ設定（Winston）
│   ├── middleware/
│   │   ├── auth.js           # JWT認証ミドルウェア
│   │   └── cors.js           # CORS設定
│   ├── routes/
│   │   ├── health.js         # ヘルスチェックAPI
│   │   ├── exams.js          # 試験関連API
│   │   ├── questions.js      # 問題関連API
│   │   └── images.js         # 画像アップロードAPI
│   └── utils/
│       └── response.js       # 統一レスポンス形式
```

## 実装方針

### ✅ 今回実装する機能
- メインエントリーポイント (index.js)
- 統一レスポンス形式 (utils/response.js)
- ログ機能 (lib/logger.js)
- Supabaseクライアント (lib/supabase.js)
- JWT認証ミドルウェア (middleware/auth.js)
- CORS設定 (middleware/cors.js)
- ヘルスチェックAPI (routes/health.js)
- 試験一覧API (routes/exams.js)
- 問題関連API (routes/questions.js) ※選択肢ソート機能付き
- 画像アップロードAPI (routes/images.js)

### 🎯 重点対応事項
1. **選択肢ソート**: 「ア、イ、ウ、エ」の順番を確実に維持
2. **エラーハンドリング**: 統一されたエラーレスポンス
3. **ログ出力**: デバッグしやすいログ形式
4. **ファイル分割**: 責務の明確な分離