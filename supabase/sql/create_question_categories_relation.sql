-- 問題とカテゴリの多対多関係を管理する中間テーブル

-- 中間テーブル：問題とカテゴリの関連
CREATE TABLE IF NOT EXISTS question_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3,2) DEFAULT 1.00, -- 関連度スコア (0.00-1.00)
    is_primary BOOLEAN DEFAULT false, -- 主要カテゴリかどうか
    notes TEXT, -- 関連付けに関するメモ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID, -- 関連付けを作成したユーザー
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_question_category UNIQUE(question_id, category_id),
    CONSTRAINT check_relevance_score CHECK (relevance_score >= 0 AND relevance_score <= 1)
);

-- インデックスの作成
CREATE INDEX idx_question_categories_question_id ON question_categories(question_id);
CREATE INDEX idx_question_categories_category_id ON question_categories(category_id);
CREATE INDEX idx_question_categories_is_primary ON question_categories(is_primary);
CREATE INDEX idx_question_categories_relevance ON question_categories(relevance_score DESC);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_question_categories_updated_at
BEFORE UPDATE ON question_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 問題ごとに主要カテゴリを1つだけにする制約を確認する関数
CREATE OR REPLACE FUNCTION check_single_primary_category()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        -- 同じ問題の他のカテゴリの主要フラグをfalseにする
        UPDATE question_categories
        SET is_primary = false
        WHERE question_id = NEW.question_id
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_category
AFTER INSERT OR UPDATE OF is_primary ON question_categories
FOR EACH ROW
WHEN (NEW.is_primary = true)
EXECUTE FUNCTION check_single_primary_category();

-- 問題に関連するカテゴリ階層を取得する関数
CREATE OR REPLACE FUNCTION get_question_categories_hierarchy(p_question_id UUID)
RETURNS TABLE(
    question_id UUID,
    category_id UUID,
    category_name TEXT,
    category_level INTEGER,
    category_type VARCHAR(50),
    category_path TEXT,
    is_primary BOOLEAN,
    relevance_score DECIMAL(3,2),
    field_name TEXT,
    major_category TEXT,
    medium_category TEXT,
    minor_category TEXT,
    knowledge_item TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH category_tree AS (
        SELECT 
            c.id,
            c.name,
            c.level,
            c.category_type,
            c.path,
            c.parent_id,
            c.name as current_name,
            c.level as current_level
        FROM categories c
        WHERE c.id IN (
            SELECT qc.category_id 
            FROM question_categories qc 
            WHERE qc.question_id = p_question_id
        )
    ),
    expanded_tree AS (
        WITH RECURSIVE ancestors AS (
            -- 選択されたカテゴリ
            SELECT 
                id,
                name,
                level,
                category_type,
                path,
                parent_id,
                id as leaf_id
            FROM category_tree
            
            UNION ALL
            
            -- 親カテゴリを再帰的に取得
            SELECT 
                c.id,
                c.name,
                c.level,
                c.category_type,
                c.path,
                c.parent_id,
                a.leaf_id
            FROM categories c
            INNER JOIN ancestors a ON c.id = a.parent_id
        )
        SELECT * FROM ancestors
    )
    SELECT 
        qc.question_id,
        qc.category_id,
        ct.name as category_name,
        ct.current_level as category_level,
        ct.category_type,
        ct.path as category_path,
        qc.is_primary,
        qc.relevance_score,
        MAX(CASE WHEN et.level = 1 THEN et.name END) as field_name,
        MAX(CASE WHEN et.level = 2 THEN et.name END) as major_category,
        MAX(CASE WHEN et.level = 3 THEN et.name END) as medium_category,
        MAX(CASE WHEN et.level = 4 THEN et.name END) as minor_category,
        MAX(CASE WHEN et.level = 5 THEN et.name END) as knowledge_item
    FROM question_categories qc
    JOIN category_tree ct ON qc.category_id = ct.id
    LEFT JOIN expanded_tree et ON et.leaf_id = ct.id
    WHERE qc.question_id = p_question_id
    GROUP BY 
        qc.question_id,
        qc.category_id,
        ct.name,
        ct.current_level,
        ct.category_type,
        ct.path,
        qc.is_primary,
        qc.relevance_score
    ORDER BY qc.is_primary DESC, qc.relevance_score DESC;
END;
$$ LANGUAGE plpgsql;

-- カテゴリに関連する問題を取得する関数
CREATE OR REPLACE FUNCTION get_category_questions(p_category_id UUID, include_descendants BOOLEAN DEFAULT false)
RETURNS TABLE(
    question_id UUID,
    question_text TEXT,
    exam_year INTEGER,
    exam_season VARCHAR(10),
    question_number INTEGER,
    is_primary BOOLEAN,
    relevance_score DECIMAL(3,2)
) AS $$
BEGIN
    IF include_descendants THEN
        -- 子孫カテゴリも含める場合
        RETURN QUERY
        WITH RECURSIVE descendants AS (
            SELECT id FROM categories WHERE id = p_category_id
            UNION ALL
            SELECT c.id 
            FROM categories c
            INNER JOIN descendants d ON c.parent_id = d.id
        )
        SELECT 
            qc.question_id,
            q.question_text,
            e.year as exam_year,
            e.season as exam_season,
            q.question_number,
            qc.is_primary,
            qc.relevance_score
        FROM question_categories qc
        JOIN questions q ON qc.question_id = q.id
        JOIN exams e ON q.exam_id = e.id
        WHERE qc.category_id IN (SELECT id FROM descendants)
        ORDER BY e.year DESC, e.season DESC, q.question_number;
    ELSE
        -- 指定カテゴリのみ
        RETURN QUERY
        SELECT 
            qc.question_id,
            q.question_text,
            e.year as exam_year,
            e.season as exam_season,
            q.question_number,
            qc.is_primary,
            qc.relevance_score
        FROM question_categories qc
        JOIN questions q ON qc.question_id = q.id
        JOIN exams e ON q.exam_id = e.id
        WHERE qc.category_id = p_category_id
        ORDER BY e.year DESC, e.season DESC, q.question_number;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 問題にカテゴリを一括で関連付ける関数
CREATE OR REPLACE FUNCTION assign_categories_to_question(
    p_question_id UUID,
    p_category_ids UUID[],
    p_primary_category_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    cat_id UUID;
BEGIN
    -- 既存の関連を削除（オプション：必要に応じてコメントアウト）
    -- DELETE FROM question_categories WHERE question_id = p_question_id;
    
    -- 新しい関連を追加
    FOREACH cat_id IN ARRAY p_category_ids
    LOOP
        INSERT INTO question_categories (question_id, category_id, is_primary)
        VALUES (
            p_question_id, 
            cat_id, 
            (p_primary_category_id IS NOT NULL AND cat_id = p_primary_category_id)
        )
        ON CONFLICT (question_id, category_id) 
        DO UPDATE SET 
            is_primary = (p_primary_category_id IS NOT NULL AND EXCLUDED.category_id = p_primary_category_id),
            updated_at = CURRENT_TIMESTAMP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- カテゴリ別の問題数を集計するビュー
CREATE OR REPLACE VIEW category_question_stats AS
WITH RECURSIVE category_tree AS (
    -- 全カテゴリとその階層を取得
    SELECT 
        c.id,
        c.name,
        c.level,
        c.category_type,
        c.path,
        c.parent_id
    FROM categories c
),
question_counts AS (
    -- 各カテゴリの直接の問題数
    SELECT 
        category_id,
        COUNT(DISTINCT question_id) as direct_question_count,
        COUNT(DISTINCT CASE WHEN is_primary THEN question_id END) as primary_question_count,
        AVG(relevance_score) as avg_relevance_score
    FROM question_categories
    GROUP BY category_id
),
descendant_counts AS (
    -- 子孫カテゴリを含めた問題数
    WITH RECURSIVE descendants AS (
        SELECT id, id as root_id FROM categories
        UNION ALL
        SELECT c.id, d.root_id
        FROM categories c
        INNER JOIN descendants d ON c.parent_id = d.id
    )
    SELECT 
        d.root_id as category_id,
        COUNT(DISTINCT qc.question_id) as total_question_count
    FROM descendants d
    JOIN question_categories qc ON qc.category_id = d.id
    GROUP BY d.root_id
)
SELECT 
    ct.id,
    ct.name,
    ct.level,
    ct.category_type,
    ct.path,
    COALESCE(qc.direct_question_count, 0) as direct_question_count,
    COALESCE(qc.primary_question_count, 0) as primary_question_count,
    COALESCE(dc.total_question_count, 0) as total_question_count,
    qc.avg_relevance_score
FROM category_tree ct
LEFT JOIN question_counts qc ON ct.id = qc.category_id
LEFT JOIN descendant_counts dc ON ct.id = dc.category_id
ORDER BY ct.path;

-- Row Level Security (RLS) の設定
ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;

-- 読み取り専用ポリシー（認証済みユーザーは閲覧可能）
CREATE POLICY "Allow authenticated users to read question_categories" ON question_categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- 管理者のみ更新可能
CREATE POLICY "Allow admins to manage question_categories" ON question_categories
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');