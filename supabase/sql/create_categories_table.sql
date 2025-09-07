-- 基本情報技術者試験カテゴリテーブル（parent_idによる階層構造）
-- JSONファイルの階層構造を単一テーブルで表現

-- カテゴリテーブル
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    exam_code VARCHAR(50) NOT NULL DEFAULT 'FE',
    level INTEGER NOT NULL, -- 1:分野, 2:大分類, 3:中分類, 4:小分類, 5:知識項目
    category_type VARCHAR(50) NOT NULL, -- 'field', 'major', 'medium', 'minor', 'knowledge'
    name TEXT NOT NULL,
    display_order INTEGER,
    path TEXT, -- 階層パス（例: "テクノロジ系/基礎理論/基礎理論/離散数学"）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_category_type CHECK (category_type IN ('field', 'major', 'medium', 'minor', 'knowledge')),
    CONSTRAINT check_level CHECK (level BETWEEN 1 AND 5)
);

-- インデックスの作成
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_categories_category_type ON categories(category_type);
CREATE INDEX idx_categories_exam_code ON categories(exam_code);
CREATE INDEX idx_categories_path ON categories(path);

-- 再帰CTEを使って階層構造を取得する関数
CREATE OR REPLACE FUNCTION get_category_hierarchy(root_id UUID DEFAULT NULL)
RETURNS TABLE(
    id UUID,
    parent_id UUID,
    level INTEGER,
    category_type VARCHAR(50),
    name TEXT,
    display_order INTEGER,
    path TEXT,
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
            c.category_type,
            c.name,
            c.display_order,
            c.path,
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
            c.category_type,
            c.name,
            c.display_order,
            c.path,
            h.depth + 1
        FROM categories c
        INNER JOIN hierarchy h ON c.parent_id = h.id
    )
    SELECT * FROM hierarchy
    ORDER BY path, display_order;
END;
$$ LANGUAGE plpgsql;

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

-- JSONデータをインポートする関数
CREATE OR REPLACE FUNCTION import_fe_syllabus_to_categories(syllabus_json JSONB)
RETURNS VOID AS $$
DECLARE
    field_record RECORD;
    major_record RECORD;
    medium_record RECORD;
    minor_record RECORD;
    knowledge_item TEXT;
    field_id UUID;
    major_id UUID;
    medium_id UUID;
    minor_id UUID;
    field_order INTEGER := 0;
    major_order INTEGER;
    medium_order INTEGER;
    minor_order INTEGER;
    knowledge_order INTEGER;
BEGIN
    -- 分野の処理
    FOR field_record IN SELECT * FROM jsonb_array_elements(syllabus_json->'fields')
    LOOP
        field_order := field_order + 1;
        
        -- 分野を挿入
        INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order)
        VALUES (NULL, syllabus_json->>'exam_code', 1, 'field', field_record.value->>'field_name', field_order)
        RETURNING id INTO field_id;
        
        major_order := 0;
        -- 大分類の処理
        FOR major_record IN SELECT * FROM jsonb_array_elements(field_record.value->'major_categories')
        LOOP
            major_order := major_order + 1;
            
            -- 大分類を挿入
            INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order)
            VALUES (field_id, syllabus_json->>'exam_code', 2, 'major', major_record.value->>'major_category', major_order)
            RETURNING id INTO major_id;
            
            medium_order := 0;
            -- 中分類の処理
            FOR medium_record IN SELECT * FROM jsonb_array_elements(major_record.value->'medium_categories')
            LOOP
                medium_order := medium_order + 1;
                
                -- 中分類を挿入
                INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order)
                VALUES (major_id, syllabus_json->>'exam_code', 3, 'medium', medium_record.value->>'medium_category', medium_order)
                RETURNING id INTO medium_id;
                
                minor_order := 0;
                -- 小分類の処理
                FOR minor_record IN SELECT * FROM jsonb_array_elements(medium_record.value->'minor_categories')
                LOOP
                    minor_order := minor_order + 1;
                    
                    -- 小分類を挿入
                    INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order)
                    VALUES (medium_id, syllabus_json->>'exam_code', 4, 'minor', minor_record.value->>'minor_category', minor_order)
                    RETURNING id INTO minor_id;
                    
                    knowledge_order := 0;
                    -- 知識項目の処理
                    FOR knowledge_item IN SELECT * FROM jsonb_array_elements_text(minor_record.value->'knowledge_items')
                    LOOP
                        knowledge_order := knowledge_order + 1;
                        
                        -- 知識項目を挿入
                        INSERT INTO categories (parent_id, exam_code, level, category_type, name, display_order)
                        VALUES (minor_id, syllabus_json->>'exam_code', 5, 'knowledge', knowledge_item, knowledge_order);
                    END LOOP;
                END LOOP;
            END LOOP;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 特定レベルのカテゴリを取得するビュー
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

CREATE OR REPLACE VIEW fe_knowledge_items_view AS
SELECT * FROM categories 
WHERE level = 5 
ORDER BY path, display_order;

-- 階層構造を展開したビュー
CREATE OR REPLACE VIEW fe_categories_hierarchy_view AS
WITH RECURSIVE tree AS (
    -- ルートノード（分野）
    SELECT 
        id,
        parent_id,
        exam_code,
        level,
        category_type,
        name,
        display_order,
        path,
        name as field_name,
        NULL::TEXT as major_category,
        NULL::TEXT as medium_category,
        NULL::TEXT as minor_category,
        NULL::TEXT as knowledge_item
    FROM categories
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- 子ノード
    SELECT 
        c.id,
        c.parent_id,
        c.exam_code,
        c.level,
        c.category_type,
        c.name,
        c.display_order,
        c.path,
        t.field_name,
        CASE WHEN c.level = 2 THEN c.name ELSE t.major_category END,
        CASE WHEN c.level = 3 THEN c.name ELSE t.medium_category END,
        CASE WHEN c.level = 4 THEN c.name ELSE t.minor_category END,
        CASE WHEN c.level = 5 THEN c.name ELSE NULL END
    FROM categories c
    INNER JOIN tree t ON c.parent_id = t.id
)
SELECT * FROM tree
ORDER BY path, display_order;

-- Row Level Security (RLS) の設定
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 読み取り専用ポリシー（認証済みユーザーは閲覧可能）
CREATE POLICY "Allow authenticated users to read categories" ON categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- 管理者のみ更新可能
CREATE POLICY "Allow admins to insert categories" ON categories
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admins to update categories" ON categories
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admins to delete categories" ON categories
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');