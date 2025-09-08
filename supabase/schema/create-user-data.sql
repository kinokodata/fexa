-- ========================================
-- user_data テーブル作成
-- ========================================
-- 用途: ユーザーごとの問題セット情報を保存
-- 作成日: 2025-09-07
-- ========================================

-- user_dataテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  question_set JSONB, -- 問題セット情報（試験/カテゴリベースの問題一覧）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 既にuser_dataテーブルが存在する場合は、question_setカラムのみ追加
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_data' AND column_name = 'question_set'
  ) THEN
    ALTER TABLE user_data ADD COLUMN question_set JSONB;
  END IF;
END $$;

-- ========================================
-- インデックス作成（パフォーマンス向上）
-- ========================================

-- ユーザーIDで検索するためのインデックス
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);

-- 更新日時でソートするためのインデックス
CREATE INDEX IF NOT EXISTS idx_user_data_updated_at ON user_data(user_id, updated_at DESC);

-- question_set JSONB全体に対するGINインデックス（JSON検索用）
CREATE INDEX IF NOT EXISTS idx_user_data_question_set 
ON user_data USING GIN (question_set);

-- question_set内の特定フィールドに対するBTREEインデックス（ソート用）
CREATE INDEX IF NOT EXISTS idx_user_data_question_set_created_at 
ON user_data ((question_set->>'createdAt'));

-- ========================================
-- Row Level Security (RLS) 設定
-- ========================================

-- RLSを有効化
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
DROP POLICY IF EXISTS "Users can access their own data" ON user_data;
CREATE POLICY "Users can access their own data" 
ON user_data 
FOR ALL 
USING (auth.uid() = user_id);

-- ========================================
-- 自動更新トリガー
-- ========================================

-- 更新時刻を自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新時刻自動更新トリガー
DROP TRIGGER IF EXISTS update_user_data_updated_at ON user_data;
CREATE TRIGGER update_user_data_updated_at 
BEFORE UPDATE ON user_data 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- コメント追加（ドキュメント化）
-- ========================================

COMMENT ON TABLE user_data IS 'ユーザーごとのデータを保存するテーブル';
COMMENT ON COLUMN user_data.id IS 'レコードの一意識別子';
COMMENT ON COLUMN user_data.user_id IS 'auth.usersテーブルへの外部キー（ユーザーID）';
COMMENT ON COLUMN user_data.question_set IS '問題セット情報（JSON形式）- 試験やカテゴリベースの問題一覧、現在位置等を保存';
COMMENT ON COLUMN user_data.created_at IS 'レコード作成日時';
COMMENT ON COLUMN user_data.updated_at IS 'レコード最終更新日時（自動更新）';

-- ========================================
-- question_set JSONBカラムの構造例
-- ========================================
/*
{
  "examInfo": {
    "year": 2023,
    "season": "a"
  },
  "selectedCategories": {
    "field": "テクノロジ系",
    "major": "基礎理論",
    "medium": "アルゴリズム",
    "minor": "データ構造"
  },
  "questions": [
    {
      "id": "uuid",
      "question_number": 1,
      "exam": {
        "year": 2023,
        "season": "春期"
      }
    }
  ],
  "currentIndex": 0,
  "createdAt": "2025-09-07T12:00:00Z",
  "totalQuestions": 50
}
*/

-- ========================================
-- テストデータ（開発環境用 - 必要に応じてコメントアウト）
-- ========================================
/*
-- テストユーザーのデータ挿入
INSERT INTO user_data (user_id, question_set) VALUES 
('cec212cd-b9b2-4daa-88bc-3279bceb4a42', '{
  "examInfo": {"year": 2023, "season": "a"},
  "questions": [],
  "currentIndex": 0,
  "createdAt": "2025-09-07T12:00:00Z",
  "totalQuestions": 0
}')
ON CONFLICT (user_id) 
DO UPDATE SET 
  question_set = EXCLUDED.question_set,
  updated_at = NOW();
*/