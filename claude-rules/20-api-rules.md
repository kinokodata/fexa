# Backend API開発仕様 (Express.js版)

## システム概要

- **フレームワーク**: Express.js + Node.js
- **データベース**: Supabase (PostgreSQL)
- **認証**: JWT認証 (Bearer Token)
- **ストレージ**: Supabase Storage (画像ファイル)
- **言語**: JavaScript (ES Modules)
- **用途**: 基本情報技術者試験の過去問データベース API
- **デプロイ**: Docker Container (開発・本番共通)

## 共通仕様

### レスポンス形式
```javascript
// 成功時
{
  "success": true,
  "data": {} // データ内容
}

// エラー時
{
  "success": false,
  "error": {
    "message": "エラーメッセージ"
  }
}

// ページング対応時
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### 認証
- JWT認証が必要（`/api/health` 除く）
- `Authorization: Bearer <token>` ヘッダーが必要
- トークン有効期限: 24時間
- リフレッシュトークン: 7日間

### CORS設定
- 開発環境: `http://localhost:43000`
- 本番環境: 設定された`CORS_ORIGIN`

## API エンドポイント仕様

### 1. ヘルスチェック
```
GET /api/health
```

**認証**: 不要

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "development"
  }
}
```

### 2. 認証

#### ログイン
```
POST /api/auth/login
```

**パラメータ**:
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "token": "JWT_TOKEN",
    "refreshToken": "REFRESH_TOKEN"
  }
}
```

**認証方式**:
- 簡易認証（email/passwordがある場合は認証成功）
- 固定のuserIdとrole: adminを返却

### 3. 試験一覧
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
      "id": "uuid",
      "year": 2023,
      "season": "春期",
      "exam_date": "2023-04-01",
      "created_at": "2024-01-01T00:00:00.000Z",
      "total_questions": 80,
      "checked_questions": 75,
      "categorized_questions": 70
    }
  ]
}
```

**特徴**:
- 年度の降順でソート
- 各試験の統計情報（問題数、チェック済み数、カテゴリ登録数）を含む

### 4. 問題関連API

#### 軽量問題リスト（ナビゲーション用）
```
GET /api/questions/list
```

**認証**: 必要

**クエリパラメータ**:
- `year` (optional): 年度
- `season` (optional): 季節（'spring'→'春期', 'autumn'→'秋期'）

**レスポンス**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "question_number": 1,
      "question_text": "問題文（抜粋）",
      "is_checked": false,
      "has_image": false,
      "has_choice_table": false,
      "choices": [
        {
          "id": "uuid",
          "choice_label": "ア",
          "choice_text": "選択肢テキスト",
          "has_image": false,
          "choice_images": []
        }
      ],
      "question_images": []
    }
  ]
}
```

**用途**: サイドバーナビゲーション用の軽量データ

#### 問題一覧（詳細）
```
GET /api/questions
```

**認証**: 必要

**クエリパラメータ**:
- `year` (optional): 年度
- `season` (optional): 季節
- `page` (optional): ページ番号 (default: 1)
- `limit` (optional): 取得件数 (default: 20)

**レスポンス**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "question_number": 1,
      "question_type": "午前",
      "question_text": "問題文...",
      "has_image": false,
      "has_choice_table": false,
      "choice_table_type": null,
      "choice_table_markdown": null,
      "is_checked": false,
      "checked_at": null,
      "checked_by": null,
      "explanation": "解説文...",
      "exam_id": "uuid",
      "choices": [
        {
          "id": "uuid",
          "choice_label": "ア",
          "choice_text": "選択肢A",
          "has_image": false,
          "is_correct": true,
          "choice_images": []
        }
      ],
      "question_images": []
    }
  ]
}
```

#### 問題詳細
```
GET /api/questions/:id
```

**認証**: 必要

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "question_number": 1,
    "question_type": "午前",
    "question_text": "問題文...",
    "explanation": "解説文...",
    "has_image": false,
    "has_choice_table": false,
    "is_checked": true,
    "checked_at": "2024-01-01T00:00:00.000Z",
    "checked_by": "admin",
    "exam": {
      "year": 2023,
      "season": "春期",
      "exam_date": "2023-04-01"
    },
    "choices": [
      {
        "id": "uuid",
        "choice_label": "ア",
        "choice_text": "選択肢A",
        "has_image": false,
        "is_correct": true,
        "choice_images": []
      }
    ],
    "question_images": []
  }
}
```

#### 問題番号による取得
```
GET /api/questions/by-exam-and-number
```

**認証**: 必要

**クエリパラメータ**:
- `year` (required): 年度
- `season` (required): 季節
- `number` (required): 問題番号

**レスポンス**: 問題詳細と同じ形式

#### 問題チェック状態更新
```
PUT /api/questions/:id/check
```

**認証**: 必要

**パラメータ**:
```json
{
  "is_checked": true
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "is_checked": true,
    "checked_at": "2024-01-01T00:00:00.000Z",
    "checked_by": "admin"
  }
}
```

### 5. カテゴリ関連API

#### カテゴリ階層取得
```
GET /api/categories/hierarchy
```

**認証**: 必要

**クエリパラメータ**:
- `exam_code` (optional): 試験コード

**レスポンス**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "level": 1,
      "category_type": "field",
      "field_name": "テクノロジ系",
      "name": "テクノロジ系",
      "description": "技術系分野"
    }
  ]
}
```

#### カテゴリ名検索
```
GET /api/categories/search
```

**認証**: 必要

**クエリパラメータ**:
- `name` (required): 検索するカテゴリ名
- `exact` (optional): 完全一致検索 (default: false)

#### カテゴリ割り当て
```
POST /api/categories/assign
```

**認証**: 必要

**パラメータ**:
```json
{
  "questionId": "uuid",
  "categoryId": "uuid"
}
```

### 6. 画像関連API
```
POST /api/images/upload
GET /api/images/:filename
```

**認証**: 必要（アップロードのみ）

**機能**:
- Supabase Storageへのアップロード
- 署名付きURL生成（24時間有効）

## データベーススキーマ

### 主要テーブル

#### exams
- id (UUID, PK)
- year (INTEGER)
- season (TEXT) - '春期', '秋期', '特別'
- exam_date (DATE)
- created_at (TIMESTAMP)

#### questions
- id (UUID, PK)
- question_number (INTEGER)
- question_type (TEXT) - '午前', '午後'
- question_text (TEXT)
- has_image (BOOLEAN)
- has_choice_table (BOOLEAN)
- choice_table_type (TEXT)
- choice_table_markdown (TEXT)
- is_checked (BOOLEAN)
- checked_at (TIMESTAMP)
- checked_by (TEXT)
- explanation (TEXT) - 解説
- exam_id (UUID, FK)

#### choices
- id (UUID, PK)
- choice_label (TEXT) - 'ア', 'イ', 'ウ', 'エ'
- choice_text (TEXT)
- has_image (BOOLEAN)
- is_correct (BOOLEAN) - 正解フラグ
- question_id (UUID, FK)

#### categories
- id (UUID, PK)
- level (INTEGER) - 階層レベル
- category_type (TEXT) - 'field', 'major', 'medium', 'minor', 'knowledge'
- field_name (TEXT)
- major_category (TEXT)
- medium_category (TEXT)
- minor_category (TEXT)
- knowledge_item (TEXT)
- name (TEXT)
- description (TEXT)

#### question_categories (中間テーブル)
- id (UUID, PK)
- question_id (UUID, FK)
- category_id (UUID, FK)
- created_at (TIMESTAMP)

## 実装パターン

### ルーター実装
```javascript
import express from 'express';
import { getSupabase } from '../lib/supabase.js';
import { success, error } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../lib/logger.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const supabase = getSupabase();
    // クエリ実装
    const { data, error: queryError } = await supabase
      .from('table_name')
      .select('*');
      
    if (queryError) throw queryError;
    
    res.json(success(data));
  } catch (err) {
    logger.error('エラー:', err);
    res.status(500).json(error(err.message));
  }
});

export default router;
```

### 認証ミドルウェア
```javascript
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json(error('認証トークンが必要です'));
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json(error('無効なトークンです'));
    req.user = user;
    next();
  });
};
```

## 環境設定

### 必要な環境変数
```env
NODE_ENV=development
PORT=3000

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=fexa-images

# JWT
JWT_SECRET=your-secret-key
REFRESH_TOKEN_SECRET=your-refresh-secret-key

# CORS
CORS_ORIGIN=http://localhost:43000
```

### ファイル構成
```
backend/
├── src/
│   ├── index.js              # サーバーエントリーポイント
│   ├── lib/
│   │   ├── supabase.js       # Supabaseクライアント
│   │   └── logger.js         # ログ機能
│   ├── middleware/
│   │   ├── auth.js           # JWT認証ミドルウェア
│   │   └── cors.js           # CORS設定
│   ├── routes/
│   │   ├── health.js         # ヘルスチェック
│   │   ├── auth.js           # 認証API
│   │   ├── exams.js          # 試験API
│   │   ├── questions.js      # 問題API
│   │   ├── categories.js     # カテゴリAPI
│   │   └── images.js         # 画像API
│   └── utils/
│       └── response.js       # レスポンス形式統一
└── package.json
```

## 実装完了機能

### ✅ 認証機能
- JWT認証の実装完了
- Bearer Token形式での認証
- リフレッシュトークンサポート

### ✅ 問題管理機能
- 軽量リスト取得（/list エンドポイント）
- 詳細問題取得
- 問題チェック状態管理
- ページング対応

### ✅ カテゴリ機能
- 階層カテゴリ取得
- カテゴリ名検索
- 問題とカテゴリの関連付け

### ✅ 画像機能
- Supabase Storage連携
- 署名付きURL生成
- アップロード機能

### ✅ 統計機能
- 試験ごとの問題数集計
- チェック済み問題数
- カテゴリ登録済み問題数

この仕様に基づいて、Express.js + Supabaseによる安定したAPIサーバーを構築・運用します。