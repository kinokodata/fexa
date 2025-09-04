-- タグとカテゴリの紐づけ管理用クエリ集

-- 1. タグとカテゴリの現在の紐づけ状況を確認
SELECT 
    t.id,
    t.name,
    t.display_name,
    t.category_type,
    t.category_id,
    c.name as category_name,
    c.path as category_path,
    t.usage_count
FROM tags t
LEFT JOIN categories c ON t.category_id = c.id
ORDER BY t.usage_count DESC, t.name;

-- 2. category_typeごとにグループ化して確認
SELECT 
    t.category_type,
    COUNT(*) as tag_count,
    SUM(CASE WHEN t.category_id IS NOT NULL THEN 1 ELSE 0 END) as categorized_count,
    SUM(t.usage_count) as total_usage
FROM tags t
GROUP BY t.category_type
ORDER BY total_usage DESC;

-- 3. カテゴリ未設定のタグを確認
SELECT 
    t.id,
    t.name,
    t.display_name,
    t.category_type,
    t.usage_count
FROM tags t
WHERE t.category_id IS NULL
AND t.usage_count > 0
ORDER BY t.usage_count DESC;

-- 4. 小分類カテゴリの一覧を確認（タグ紐づけの参考用）
SELECT 
    c.id,
    c.name,
    c.path,
    COUNT(DISTINCT t.id) as linked_tag_count
FROM categories c
LEFT JOIN tags t ON t.category_id = c.id
WHERE c.category_level = 'minor'
GROUP BY c.id, c.name, c.path
ORDER BY c.path;

-- 5. タグとカテゴリを紐づける例（手動実行用）

-- ネットワーク関連タグを紐づけ
/*
UPDATE tags 
SET category_id = (
    SELECT id FROM categories 
    WHERE category_level = 'minor' 
    AND name = 'ネットワーク'
    LIMIT 1
)
WHERE category_type = 'ネットワーク' 
  AND category_id IS NULL;
*/

-- セキュリティ関連タグを紐づけ
/*
UPDATE tags 
SET category_id = (
    SELECT id FROM categories 
    WHERE category_level = 'minor' 
    AND name = 'セキュリティ'
    LIMIT 1
)
WHERE category_type = 'セキュリティ'
  AND category_id IS NULL;
*/

-- データベース関連タグを紐づけ
/*
UPDATE tags 
SET category_id = (
    SELECT id FROM categories 
    WHERE category_level = 'minor' 
    AND name = 'データベース'
    LIMIT 1
)
WHERE category_type = 'データベース'
  AND category_id IS NULL;
*/

-- 6. 推奨される紐づけを提案するクエリ
WITH tag_category_suggestions AS (
    SELECT 
        t.id as tag_id,
        t.name as tag_name,
        t.display_name,
        t.category_type,
        c.id as suggested_category_id,
        c.name as suggested_category_name,
        c.path as suggested_category_path,
        -- カテゴリタイプとカテゴリ名の類似度を簡易的に判定
        CASE 
            WHEN t.category_type ILIKE '%' || c.name || '%' THEN 1
            WHEN c.name ILIKE '%' || t.category_type || '%' THEN 1
            ELSE 0
        END as match_score
    FROM tags t
    CROSS JOIN categories c
    WHERE t.category_id IS NULL
      AND c.category_level = 'minor'
      AND t.category_type IS NOT NULL
)
SELECT 
    tag_name,
    display_name,
    category_type,
    suggested_category_name,
    suggested_category_path
FROM tag_category_suggestions
WHERE match_score > 0
ORDER BY tag_name, suggested_category_path;

-- 7. バッチで紐づけを実行する関数
CREATE OR REPLACE FUNCTION link_tags_to_categories_by_type(
    p_category_type VARCHAR(50),
    p_category_name VARCHAR(255)
)
RETURNS TABLE(updated_count INT) AS $$
DECLARE
    v_category_id UUID;
    v_updated_count INT;
BEGIN
    -- カテゴリIDを取得
    SELECT id INTO v_category_id
    FROM categories
    WHERE category_level = 'minor'
      AND name = p_category_name
    LIMIT 1;
    
    IF v_category_id IS NULL THEN
        RAISE EXCEPTION 'Category not found: %', p_category_name;
    END IF;
    
    -- タグを更新
    UPDATE tags
    SET category_id = v_category_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE category_type = p_category_type
      AND category_id IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN QUERY SELECT v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- 使用例：
-- SELECT * FROM link_tags_to_categories_by_type('ネットワーク', 'ネットワーク');
-- SELECT * FROM link_tags_to_categories_by_type('セキュリティ', 'セキュリティ');
-- SELECT * FROM link_tags_to_categories_by_type('データベース', 'データベース');