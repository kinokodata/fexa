-- ========================================
-- categoriesテーブルの再設計
-- ========================================

-- 既存のテーブルとビュー、関数を削除
DROP VIEW IF EXISTS fe_categories_hierarchy_view CASCADE;
DROP VIEW IF EXISTS fe_knowledge_items_view CASCADE;
DROP VIEW IF EXISTS fe_minor_categories_view CASCADE;
DROP VIEW IF EXISTS fe_medium_categories_view CASCADE;
DROP VIEW IF EXISTS fe_major_categories_view CASCADE;
DROP VIEW IF EXISTS fe_fields_view CASCADE;

-- 関数の削除
DROP FUNCTION IF EXISTS import_fe_syllabus_to_categories(JSONB) CASCADE;
DROP FUNCTION IF EXISTS get_category_hierarchy(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_category_path() CASCADE;

-- テーブルの削除
DROP TABLE IF EXISTS categories CASCADE;

-- 新しいcategoriesテーブルの作成
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4), -- 1:分野, 2:大分類, 3:中分類, 4:小分類
    name TEXT NOT NULL,
    display_order INTEGER,
    path TEXT, -- 階層パス（例: "テクノロジ系/基礎理論/基礎理論/離散数学"）
    knowledges TEXT, -- 知識項目例をカンマ区切りで格納
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスの作成
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_categories_path ON categories(path);
CREATE INDEX idx_categories_knowledges ON categories USING GIN(to_tsvector('simple', COALESCE(knowledges, '')));

-- パスを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_category_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path TEXT;
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path := NEW.name;
    ELSE
        SELECT path INTO parent_path FROM categories WHERE id = NEW.parent_id;
        NEW.path := parent_path || '/' || NEW.name;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- パス更新トリガー
CREATE TRIGGER update_path_trigger
BEFORE INSERT OR UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_category_path();

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at更新トリガー
CREATE TRIGGER trigger_update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 階層構造を取得する関数
CREATE OR REPLACE FUNCTION get_category_hierarchy(root_id UUID DEFAULT NULL)
RETURNS TABLE(
    id UUID,
    parent_id UUID,
    level INTEGER,
    name TEXT,
    display_order INTEGER,
    path TEXT,
    knowledges TEXT,
    depth INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE hierarchy AS (
        -- ベースケース：ルートノード
        SELECT 
            c.id,
            c.parent_id,
            c.level,
            c.name,
            c.display_order,
            c.path,
            c.knowledges,
            0 as depth
        FROM categories c
        WHERE 
            CASE 
                WHEN root_id IS NULL THEN c.parent_id IS NULL
                ELSE c.id = root_id
            END
        
        UNION ALL
        
        -- 再帰ケース：子ノード
        SELECT 
            c.id,
            c.parent_id,
            c.level,
            c.name,
            c.display_order,
            c.path,
            c.knowledges,
            h.depth + 1
        FROM categories c
        INNER JOIN hierarchy h ON c.parent_id = h.id
    )
    SELECT * FROM hierarchy
    ORDER BY path, display_order;
END;
$$ LANGUAGE plpgsql;

-- JSONデータをインポートする関数（新スキーマ対応）
CREATE OR REPLACE FUNCTION import_fe_syllabus_to_categories(syllabus_json JSONB)
RETURNS VOID AS $$
DECLARE
    field_record RECORD;
    major_record RECORD;
    medium_record RECORD;
    minor_record RECORD;
    field_id UUID;
    major_id UUID;
    medium_id UUID;
    minor_id UUID;
    field_order INTEGER := 0;
    major_order INTEGER;
    medium_order INTEGER;
    minor_order INTEGER;
    knowledge_items_text TEXT;
BEGIN
    -- 分野の処理
    FOR field_record IN SELECT * FROM jsonb_array_elements(syllabus_json->'fields')
    LOOP
        field_order := field_order + 1;
        
        -- 分野を挿入
        INSERT INTO categories (parent_id, level, name, display_order)
        VALUES (NULL, 1, field_record.value->>'field_name', field_order)
        RETURNING id INTO field_id;
        
        major_order := 0;
        -- 大分類の処理
        FOR major_record IN SELECT * FROM jsonb_array_elements(field_record.value->'major_categories')
        LOOP
            major_order := major_order + 1;
            
            -- 大分類を挿入
            INSERT INTO categories (parent_id, level, name, display_order)
            VALUES (field_id, 2, major_record.value->>'major_category', major_order)
            RETURNING id INTO major_id;
            
            medium_order := 0;
            -- 中分類の処理
            FOR medium_record IN SELECT * FROM jsonb_array_elements(major_record.value->'medium_categories')
            LOOP
                medium_order := medium_order + 1;
                
                -- 中分類を挿入
                INSERT INTO categories (parent_id, level, name, display_order)
                VALUES (major_id, 3, medium_record.value->>'medium_category', medium_order)
                RETURNING id INTO medium_id;
                
                minor_order := 0;
                -- 小分類の処理
                FOR minor_record IN SELECT * FROM jsonb_array_elements(medium_record.value->'minor_categories')
                LOOP
                    minor_order := minor_order + 1;
                    
                    -- 知識項目をカンマ区切り文字列に変換
                    SELECT string_agg(value, ', ')
                    INTO knowledge_items_text
                    FROM jsonb_array_elements_text(minor_record.value->'knowledge_items');
                    
                    -- 小分類を挿入（知識項目をknowledgesカラムに格納）
                    INSERT INTO categories (parent_id, level, name, display_order, knowledges)
                    VALUES (medium_id, 4, minor_record.value->>'minor_category', minor_order, knowledge_items_text);
                END LOOP;
            END LOOP;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- レベル別ビューの作成
CREATE OR REPLACE VIEW fe_fields_view AS
SELECT * FROM categories 
WHERE level = 1 
ORDER BY display_order;

CREATE OR REPLACE VIEW fe_major_categories_view AS
SELECT * FROM categories 
WHERE level = 2 
ORDER BY path, display_order;

CREATE OR REPLACE VIEW fe_medium_categories_view AS
SELECT * FROM categories 
WHERE level = 3 
ORDER BY path, display_order;

CREATE OR REPLACE VIEW fe_minor_categories_view AS
SELECT * FROM categories 
WHERE level = 4 
ORDER BY path, display_order;

-- 階層構造を展開したビュー（新スキーマ対応）
CREATE OR REPLACE VIEW fe_categories_hierarchy_view AS
WITH RECURSIVE tree AS (
    -- ルートノード（分野）
    SELECT 
        id,
        parent_id,
        level,
        name,
        display_order,
        path,
        knowledges,
        name as field_name,
        NULL::TEXT as major_category,
        NULL::TEXT as medium_category,
        NULL::TEXT as minor_category
    FROM categories
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- 子ノード
    SELECT 
        c.id,
        c.parent_id,
        c.level,
        c.name,
        c.display_order,
        c.path,
        c.knowledges,
        t.field_name,
        CASE WHEN c.level = 2 THEN c.name ELSE t.major_category END,
        CASE WHEN c.level = 3 THEN c.name ELSE t.medium_category END,
        CASE WHEN c.level = 4 THEN c.name ELSE t.minor_category END
    FROM categories c
    INNER JOIN tree t ON c.parent_id = t.id
)
SELECT * FROM tree
ORDER BY path, display_order;

-- Row Level Security (RLS) の設定
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 読み取り専用ポリシー（全員が閲覧可能）
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (true);

-- 認証済みユーザーのみ更新可能
CREATE POLICY "Categories are insertable by authenticated users" ON categories
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Categories are updatable by authenticated users" ON categories
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Categories are deletable by authenticated users" ON categories
    FOR DELETE USING (auth.uid() IS NOT NULL);