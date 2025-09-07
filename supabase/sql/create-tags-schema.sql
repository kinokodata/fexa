-- ========================================
-- タグ（ナレッジキーワード）テーブルのスキーマ
-- ========================================

-- 既存のテーブルがある場合は削除（開発環境のみで実行）
-- DROP TABLE IF EXISTS question_tags CASCADE;
-- DROP TABLE IF EXISTS tags CASCADE;

-- タグテーブル（ナレッジキーワードのマスタ）
CREATE TABLE IF NOT EXISTS tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,  -- タグの識別子（例：tcp_ip, encryption）
    display_name VARCHAR(100) NOT NULL,  -- 表示名（例：TCP/IP, 暗号化）
    description TEXT,                    -- タグの説明（オプション）
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,  -- 小分類カテゴリとの関連（後で設定可能）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 問題-タグ関連テーブル（多対多関連）
CREATE TABLE IF NOT EXISTS question_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3, 2) DEFAULT 1.0 CHECK (relevance_score >= 0 AND relevance_score <= 1),  -- 関連度スコア
    is_primary BOOLEAN DEFAULT FALSE,   -- 主要タグかどうか
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),            -- 登録者（システムまたはユーザー）
    UNIQUE(question_id, tag_id)        -- 同じ問題に同じタグは1回のみ
);

-- インデックスの作成（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_display_name ON tags(display_name);
CREATE INDEX IF NOT EXISTS idx_tags_category_id ON tags(category_id);

CREATE INDEX IF NOT EXISTS idx_question_tags_question ON question_tags(question_id);
CREATE INDEX IF NOT EXISTS idx_question_tags_tag ON question_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_question_tags_primary ON question_tags(is_primary);
CREATE INDEX IF NOT EXISTS idx_question_tags_relevance ON question_tags(relevance_score DESC);

-- Row Level Security (RLS) の設定
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_tags ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー設定
-- タグは誰でも読み取り可能、書き込みは認証済みユーザーのみ
CREATE POLICY "Tags are viewable by everyone" 
    ON tags FOR SELECT 
    USING (true);

CREATE POLICY "Tags are insertable by authenticated users" 
    ON tags FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Tags are updatable by authenticated users" 
    ON tags FOR UPDATE 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Question tags are viewable by everyone" 
    ON question_tags FOR SELECT 
    USING (true);

CREATE POLICY "Question tags are insertable by authenticated users" 
    ON question_tags FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Question tags are updatable by authenticated users" 
    ON question_tags FOR UPDATE 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Question tags are deletable by authenticated users" 
    ON question_tags FOR DELETE 
    USING (auth.uid() IS NOT NULL);


-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tags_updated_at ON tags;
CREATE TRIGGER trigger_update_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
