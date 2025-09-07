-- 問題とカテゴリの多対多関係を管理する中間テーブル
CREATE TABLE IF NOT EXISTS question_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  relevance_score DECIMAL(3,2) DEFAULT 1.0 CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 同じ問題に同じカテゴリを重複して割り当てないための制約
  UNIQUE(question_id, category_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_question_categories_question_id ON question_categories(question_id);
CREATE INDEX IF NOT EXISTS idx_question_categories_category_id ON question_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_question_categories_primary ON question_categories(question_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_question_categories_relevance ON question_categories(relevance_score DESC);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_question_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_categories_updated_at
  BEFORE UPDATE ON question_categories
  FOR EACH ROW EXECUTE FUNCTION update_question_categories_updated_at();

-- RLS (Row Level Security) 設定
ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーの読み取り権限
CREATE POLICY "Allow read access for authenticated users" ON question_categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- サービスロールの全権限
CREATE POLICY "Allow all for service role" ON question_categories
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- コメント追加
COMMENT ON TABLE question_categories IS '問題とカテゴリの多対多関係を管理する中間テーブル';
COMMENT ON COLUMN question_categories.relevance_score IS 'カテゴリと問題の関連度スコア (0.0 - 1.0)';
COMMENT ON COLUMN question_categories.is_primary IS 'このカテゴリが問題の主要カテゴリかどうか';