# Fexa API 仕様書（Vercel Functions版）

## システム概要

- **フレームワーク**: Next.js API Routes (Vercel Functions)
- **データベース**: Supabase (PostgreSQL)
- **認証**: JWT認証
- **ストレージ**: Supabase Storage (画像ファイル)
- **言語**: Japanese (日本語)
- **用途**: 基本情報技術者試験の過去問データベース
- **デプロイ**: Vercel (サーバーレス関数)

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
- Vercel Functions での実装

### CORS設定
- 本番: 自動的に同一オリジンアクセス
- 開発: `http://localhost:3000`
- Vercel の組み込み CORS 対応

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

### 2. 認証
```
POST /api/auth/login
```

**パラメータ**:
```json
{
  "username": "管理者ユーザー名",
  "password": "パスワード"
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "accessToken": "JWT_TOKEN",
    "refreshToken": "REFRESH_TOKEN",
    "user": {
      "username": "管理者ユーザー名"
    }
  }
}
```

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
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**ソート**: 年度の降順 (year DESC)

### 4. 問題一覧
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
      "explanation": null,
      "created_at": "2024-01-01T00:00:00.000Z",
      "exam_id": "uuid",
      "choices": [
        {
          "id": "uuid",
          "choice_label": "ア",
          "choice_text": "選択肢A",
          "has_image": false,
          "is_correct": false,
          "choice_images": []
        }
      ],
      "categories": [
        {
          "id": "uuid",
          "name": "カテゴリ名"
        }
      ],
      "question_images": []
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
- 選択肢は「ア、イ、ウ、エ」の順番でソートして返す
- ページング対応（offset/limit）
- 問題番号順でソート
- 署名付きURL（24時間有効）で画像を配信

### 5. 問題詳細
```
GET /api/questions/[id]
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
    "has_image": false,
    "has_choice_table": true,
    "choice_table_type": "markdown",
    "choice_table_markdown": "| 項目 | 値 |\n|------|-----|\n| A | 1 |",
    "is_checked": true,
    "checked_at": "2024-01-01T00:00:00.000Z",
    "checked_by": "管理者",
    "explanation": "この問題の解説...",
    "exam": {
      "year": 2023,
      "season": "春期",
      "exam_date": "2023-04-01"
    },
    "question_images": [
      {
        "id": "uuid",
        "image_type": "png", 
        "image_url": "https://...signed_url"
      }
    ],
    "choices": [
      {
        "id": "uuid",
        "choice_label": "ア",
        "choice_text": "選択肢A",
        "has_image": false,
        "is_correct": false,
        "choice_images": []
      }
    ],
    "answer": {
      "correct_choice": "ア",
      "explanation": "解説..."
    },
    "categories": [
      {
        "id": "uuid",
        "name": "カテゴリ名"
      }
    ]
  }
}
```

### 6. 画像アップロード
```
POST /api/images/upload
```

**認証**: 必要

**Content-Type**: `multipart/form-data`

**パラメータ**:
- `image`: 画像ファイル (max 10MB)
- `questionId`: 問題ID
- `choiceId`: 選択肢ID（選択肢画像の場合）

**機能**:
- Supabase Storageに画像をアップロード
- `question_images` または `choice_images` テーブルに記録
- `questions` または `choices` テーブルの `has_image` フラグを更新

## データベーススキーマ

### exams テーブル
- `id`: Primary Key (UUID)
- `year`: 年度
- `season`: 季節（春期/秋期）
- `exam_date`: 試験日
- `created_at`: 作成日時

### questions テーブル
- `id`: Primary Key (UUID)
- `question_number`: 問題番号
- `question_type`: 問題タイプ（午前/午後）
- `question_text`: 問題文
- `has_image`: 画像有無フラグ
- `has_choice_table`: 選択肢テーブル有無フラグ
- `choice_table_type`: テーブル形式（markdown/image）
- `choice_table_markdown`: Markdownテーブル
- `is_checked`: チェック完了フラグ
- `checked_at`: チェック日時
- `checked_by`: チェック者
- `explanation`: 解説
- `exam_id`: 試験ID (FK)
- `category_id`: カテゴリID (FK)
- `created_at`: 作成日時

### choices テーブル
- `id`: Primary Key (UUID)
- `choice_label`: 選択肢ラベル（ア、イ、ウ、エ）
- `choice_text`: 選択肢テキスト
- `has_image`: 画像有無フラグ
- `is_correct`: 正解フラグ
- `question_id`: 問題ID (FK)
- `created_at`: 作成日時

### categories テーブル
- `id`: Primary Key (UUID)
- `name`: カテゴリ名
- `description`: 説明
- `parent_id`: 親カテゴリID (FK)
- `created_at`: 作成日時

### answers テーブル
- `id`: Primary Key (UUID)
- `question_id`: 問題ID (FK)
- `correct_choice`: 正解選択肢
- `explanation`: 解説
- `reference_url`: 参考URL
- `created_at`: 作成日時

### question_images テーブル（画像機能用）
- `id`: Primary Key (UUID)
- `question_id`: 問題ID (FK)
- `image_type`: 拡張子（png, jpg, gif等）
- `caption`: キャプション
- `display_order`: 表示順
- `created_at`: 作成日時

### choice_images テーブル（画像機能用）
- `id`: Primary Key (UUID)
- `choice_id`: 選択肢ID (FK)
- `image_type`: 拡張子（png, jpg, gif等）
- `caption`: キャプション
- `display_order`: 表示順
- `created_at`: 作成日時

## 環境設定

### 必要な環境変数
- `NODE_ENV`: 実行環境
- `SUPABASE_URL`: Supabase プロジェクト URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase サービスロールキー
- `SUPABASE_STORAGE_BUCKET`: Supabase Storage バケット名
- `JWT_SECRET`: JWT トークン署名用秘密鍵

### 起動方法
```bash
npm run dev  # Next.js 開発サーバー
# または
vercel dev   # Vercel ローカル環境
```

## Vercel Functions 実装詳細

### API Route 実装パターン
```typescript
// /src/app/api/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyJWT } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // JWT認証
    const authResult = await verifyJWT(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: { message: '認証が必要です' } },
        { status: 401 }
      );
    }

    // クエリパラメータの取得
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const season = searchParams.get('season');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Supabase クエリ実行
    const supabase = getSupabase();
    // ... クエリ実装

    return NextResponse.json({
      success: true,
      data: data,
      pagination: { page, limit, total: count }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'サーバーエラーが発生しました' } },
      { status: 500 }
    );
  }
}
```

### 動的ルート実装
```typescript
// /src/app/api/questions/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const questionId = params.id;
  // ... 実装
}
```

## ファイル構成

```
frontend/
├── package.json              # 依存関係と設定
├── src/
│   ├── app/
│   │   ├── api/              # Vercel Functions API
│   │   │   ├── health/
│   │   │   │   └── route.ts  # ヘルスチェックAPI
│   │   │   ├── auth/
│   │   │   │   └── login/
│   │   │   │       └── route.ts # 認証API
│   │   │   ├── exams/
│   │   │   │   └── route.ts  # 試験一覧API
│   │   │   ├── questions/
│   │   │   │   ├── route.ts  # 問題一覧API
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts # 問題詳細API
│   │   │   └── images/
│   │   │       └── upload/
│   │   │           └── route.ts # 画像アップロードAPI
│   │   └── ... # フロントエンド pages
│   ├── lib/
│   │   ├── supabase.ts       # Supabaseクライアント設定
│   │   └── auth.ts           # JWT認証ユーティリティ
│   ├── services/
│   │   └── api.ts            # APIクライアント（フロントエンド用）
│   └── types/
│       └── api.ts            # 型定義
```

## 実装方針

### ✅ Vercel Functions での実装
- API Routes での各エンドポイント実装
- TypeScript での型安全性確保
- 統一レスポンス形式 (共通ユーティリティ)
- Supabaseクライアント (lib/supabase.ts)
- JWT認証ユーティリティ (lib/auth.ts)
- ヘルスチェックAPI (/api/health)
- 認証API (/api/auth/login)
- 試験一覧API (/api/exams)
- 問題関連API (/api/questions)
- 画像アップロードAPI (/api/images/upload)

### ✅ 実装完了事項
1. **Vercel Functions**: サーバーレス関数として各API実装済み
2. **選択肢ソート**: 「ア、イ、ウ、エ」の順番で確実にソート実装済み
3. **画像機能**: アップロード・表示機能完全実装済み
4. **認証機能**: JWT認証完全実装済み
5. **エラーハンドリング**: 統一されたエラーレスポンス実装済み
6. **TypeScript**: 型安全性を確保した実装完了