-- tagsテーブルにprimary_category_idとsecondary_keywordsカラムを追加

-- primary_category_idカラムを追加（既存のcategory_idをprimary_category_idとして使用）
ALTER TABLE tags 
ADD COLUMN IF NOT EXISTS primary_category_id UUID REFERENCES categories(id);

-- secondary_keywordsカラムを追加（副次的なキーワードを配列で保持）
ALTER TABLE tags 
ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[];

-- 既存のcategory_idをprimary_category_idにコピー
UPDATE tags 
SET primary_category_id = category_id 
WHERE category_id IS NOT NULL;

-- インデックス追加で高速化
CREATE INDEX IF NOT EXISTS idx_tags_primary_category ON tags(primary_category_id);
CREATE INDEX IF NOT EXISTS idx_tags_secondary_keywords ON tags USING GIN(secondary_keywords);

-- category_idカラムは互換性のため残しておく（後で削除予定）
COMMENT ON COLUMN tags.category_id IS '旧カラム：primary_category_idに移行予定';
COMMENT ON COLUMN tags.primary_category_id IS 'メインカテゴリID';
COMMENT ON COLUMN tags.secondary_keywords IS '副次的な関連キーワード配列';