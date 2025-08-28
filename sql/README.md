# データベース スキーマ & マイグレーション

Fexa プロジェクトのデータベーススキーマとマイグレーション手順のドキュメントです。

## 📋 スキーマ概要

### 基本設計思想
- **UUID主キー**: 全テーブルでUUIDを使用（分散システム対応）
- **画像分離管理**: 問題・選択肢別の画像テーブル
- **選択肢テーブル統合**: 表データを問題レベルで一元管理
- **動的パス生成**: メタデータからファイルパスを構築

## 🗄️ テーブル構造

### 基本エンティティ

#### exams（試験情報）
```sql
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    season TEXT NOT NULL CHECK (season IN ('春期', '秋期')),
    exam_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### questions（問題）
```sql
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id),
    question_number INTEGER NOT NULL,
    question_type TEXT,
    question_text TEXT,
    has_image BOOLEAN DEFAULT FALSE,
    
    -- 選択肢テーブル機能（2024年追加）
    has_choice_table BOOLEAN DEFAULT FALSE,
    choice_table_type VARCHAR(20) CHECK (choice_table_type IN ('markdown', 'image')),
    choice_table_markdown TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- コメント
COMMENT ON COLUMN questions.has_choice_table IS '選択肢が表形式かどうかのフラグ';
COMMENT ON COLUMN questions.choice_table_type IS '表の種類（markdown または image）';
COMMENT ON COLUMN questions.choice_table_markdown IS '表のMarkdownテキスト（choice_table_type が markdown の場合に使用）';
```

#### choices（選択肢）
```sql
CREATE TABLE choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id),
    choice_label TEXT NOT NULL, -- ア、イ、ウ、エ
    choice_text TEXT,
    has_image BOOLEAN DEFAULT FALSE,
    is_correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ⚠️ 削除されたカラム（2024年マイグレーション後）
-- is_table_format BOOLEAN
-- table_headers TEXT[]
-- table_data JSONB
```

### 画像管理テーブル

#### question_images（問題画像）
```sql
CREATE TABLE question_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id),
    image_id UUID NOT NULL, -- ファイル名としても使用
    image_type TEXT NOT NULL, -- png, jpg, gif等
    caption TEXT,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### choice_images（選択肢画像）
```sql
CREATE TABLE choice_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    choice_id UUID REFERENCES choices(id),
    image_id UUID NOT NULL, -- ファイル名としても使用
    image_type TEXT NOT NULL, -- png, jpg, gif等
    caption TEXT,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 補助テーブル

#### answers（解答・解説）
```sql
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id),
    correct_choice TEXT,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### categories（カテゴリ）
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 マイグレーション履歴

### 初期スキーマ（init.sql）
- 基本テーブル構造の作成
- UUID主キー、外部キー制約の設定
- 基本的なインデックス作成

### 2024年 選択肢テーブル機能拡張

#### Phase 1: 新カラム追加（add_choice_table_columns.sql）
```sql
-- questionsテーブルに表形式選択肢用のカラムを追加
ALTER TABLE questions 
ADD COLUMN has_choice_table BOOLEAN DEFAULT FALSE;

ALTER TABLE questions 
ADD COLUMN choice_table_type VARCHAR(20) CHECK (choice_table_type IN ('markdown', 'image'));

ALTER TABLE questions 
ADD COLUMN choice_table_markdown TEXT;
```

#### Phase 2: 旧カラム削除（remove_obsolete_choice_columns.sql）
```sql
-- choicesテーブルから不要になったカラムを削除
ALTER TABLE choices 
DROP COLUMN IF EXISTS is_table_format;

ALTER TABLE choices 
DROP COLUMN IF EXISTS table_headers;

ALTER TABLE choices 
DROP COLUMN IF EXISTS table_data;
```

## 🚀 ファイル管理システム

### ストレージ構造
```
Supabase Storage Bucket: fexa-images/
├── {year}{season_code}/
│   └── {time_code}_q{question_number}/
│       └── {uuid}.{extension}

例:
├── 2018a/
│   └── am_q77/
│       ├── 550e8400-e29b-41d4-a716-446655440000.png
│       └── 6ba7b810-9dad-11d1-80b4-00c04fd430c8.jpg
```

### 動的パス生成ルール
```typescript
// backend/src/routes/questions.js での実装
const generateImagePath = (year, season, questionNumber, timeCode = 'am') => {
  const seasonCode = season === '春期' ? 'a' : 'b';
  return `${year}${seasonCode}/${timeCode}_q${questionNumber}`;
};
```

## 📊 データ関連性

### エンティティ関係図
```
exams (1) ──── (*) questions (1) ──── (*) choices
  │                   │                    │
  │                   │                    └── (*) choice_images
  │                   │
  │                   ├── (*) question_images
  │                   └── (1) answers
  │
  └── categories (many-to-many via junction table)
```

### 重要な制約
1. **選択肢ソート順**: choice_label で「ア、イ、ウ、エ」順
2. **画像UUID統一**: database ID = storage filename
3. **動的パス**: 年度・季節・問題番号からパス自動生成
4. **署名付きURL**: 24時間有効期限

## 🛠️ マイグレーション実行手順

### 1. 開発環境での実行
```sql
-- Supabase SQL Editor で順次実行
\i sql/init.sql
\i sql/add_choice_table_columns.sql
\i sql/remove_obsolete_choice_columns.sql
```

### 2. APIを使用したマイグレーション
```bash
# バックエンドサーバー経由
curl -X POST http://localhost:43001/api/migrate/remove-choice-columns \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 本番環境への適用
```bash
# Supabase CLI使用
supabase db push --include-migrations
```

## 🔍 データ整合性チェック

### 基本データ確認
```sql
-- 問題数の確認
SELECT 
    year, season, COUNT(*) as question_count
FROM exams e
JOIN questions q ON e.id = q.exam_id
GROUP BY year, season
ORDER BY year DESC, season;

-- 画像付き問題の確認
SELECT 
    COUNT(*) as total_questions,
    SUM(CASE WHEN has_image THEN 1 ELSE 0 END) as questions_with_images,
    SUM(CASE WHEN has_choice_table THEN 1 ELSE 0 END) as questions_with_choice_tables
FROM questions;
```

### 選択肢テーブル機能確認
```sql
-- 新機能を使用している問題
SELECT 
    id, question_number, has_choice_table, choice_table_type
FROM questions 
WHERE has_choice_table = TRUE;

-- 古い形式のデータが残っていないか確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'choices' 
AND column_name IN ('is_table_format', 'table_headers', 'table_data');
-- → 結果が空なら削除完了
```

## 🚨 重要な注意事項

### データ移行時の注意点
1. **バックアップ必須**: マイグレーション前は必ずデータバックアップ
2. **順次実行**: add → remove の順序を守る
3. **整合性確認**: マイグレーション後のデータ確認を徹底

### パフォーマンス考慮事項
1. **インデックス**: 検索頻度の高いカラムには適切なインデックス
2. **画像容量**: 10MB制限、適切なファイル形式選択
3. **クエリ最適化**: JOINクエリの効率化

### セキュリティ
1. **UUID予測不可能性**: セキュアなUUID生成
2. **署名付きURL**: 適切な有効期限設定
3. **入力検証**: SQLインジェクション対策

---

このドキュメントは、Fexa プロジェクトのデータベース設計とマイグレーション手順の完全なガイドです。新しい機能追加やスキーマ変更時は、このドキュメントを更新してください。