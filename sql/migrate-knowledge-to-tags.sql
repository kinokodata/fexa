-- ========================================
-- 既存のknowledgeカテゴリをtagsテーブルに移動
-- ========================================

-- 1. まず現在のknowledgeカテゴリを確認
SELECT 
    c.id,
    c.name,
    c.path,
    c.parent_id,
    parent_name.name as parent_category_name
FROM categories c
LEFT JOIN categories parent_name ON c.parent_id = parent_name.id
WHERE c.category_type = 'knowledge'
ORDER BY c.path;

-- 2. knowledgeカテゴリをtagsテーブルに移行（IDをそのまま使用）
INSERT INTO tags (id, name, display_name, description, category_id, created_at)
SELECT 
    c.id,  -- 既存のcategoriesのIDをそのまま使用
    -- nameは小文字＋アンダースコアで正規化
    LOWER(REGEXP_REPLACE(REGEXP_REPLACE(c.name, '[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]', '_', 'g'), '_+', '_', 'g')) as name,
    c.name as display_name,
    CASE 
        WHEN c.path IS NOT NULL THEN '元カテゴリパス: ' || c.path
        ELSE '既存のナレッジキーワード'
    END as description,
    c.parent_id as category_id,  -- parent_idを小分類カテゴリのIDとして設定
    c.created_at
FROM categories c
WHERE c.category_type = 'knowledge'
  AND c.name IS NOT NULL 
  AND c.name != ''
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    category_id = EXCLUDED.category_id,
    updated_at = CURRENT_TIMESTAMP;

-- 3. 移行結果を確認
SELECT 
    'Migration Summary' as info,
    COUNT(*) as migrated_tags
FROM tags t
WHERE t.description LIKE '%元カテゴリパス:%';

-- 4. 移行されたタグの詳細を確認
SELECT 
    t.name,
    t.display_name,
    t.category_id,
    c.name as category_name,
    c.path as category_path,
    t.description,
    t.created_at
FROM tags t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.description LIKE '%元カテゴリパス:%'
ORDER BY c.path, t.display_name;

-- 5. カテゴリ別の移行されたタグ数を確認
SELECT 
    c.id as category_id,
    c.name as category_name,
    c.path as category_path,
    COUNT(t.id) as migrated_tag_count
FROM categories c
LEFT JOIN tags t ON c.id = t.category_id
WHERE c.category_level = 'minor'
  AND EXISTS (
      SELECT 1 FROM tags t2 
      WHERE t2.category_id = c.id 
        AND t2.description LIKE '%元カテゴリパス:%'
  )
GROUP BY c.id, c.name, c.path
ORDER BY migrated_tag_count DESC, c.path;

-- 6. 問題とknowledgeカテゴリの既存関連も移行（question_category_relationsから）
-- まず既存の問題-knowledgeカテゴリ関連を確認
SELECT 
    COUNT(DISTINCT qcr.question_id) as questions_with_knowledge,
    COUNT(*) as total_knowledge_relations
FROM question_category_relations qcr
JOIN categories c ON qcr.category_id = c.id
WHERE c.category_type = 'knowledge';

-- 7. 問題-knowledgeカテゴリ関連をquestion_tagsに移行（IDをそのまま使用）
INSERT INTO question_tags (question_id, tag_id, relevance_score, is_primary, created_at, created_by)
SELECT 
    qcr.question_id,
    qcr.category_id as tag_id,  -- category_idがそのままtag_idになる
    COALESCE(qcr.relevance_score, 1.0) as relevance_score,
    COALESCE(qcr.is_primary, false) as is_primary,
    qcr.created_at,
    'migration_from_categories' as created_by
FROM question_category_relations qcr
JOIN categories c ON qcr.category_id = c.id
WHERE c.category_type = 'knowledge'
ON CONFLICT (question_id, tag_id) DO UPDATE SET
    relevance_score = EXCLUDED.relevance_score,
    is_primary = EXCLUDED.is_primary,
    created_by = EXCLUDED.created_by;

-- 8. 移行結果の最終確認
SELECT 
    '=== Migration Summary ===' as summary,
    (SELECT COUNT(*) FROM tags WHERE description LIKE '%元カテゴリパス:%') as migrated_tags,
    (SELECT COUNT(*) FROM question_tags WHERE created_by = 'migration_from_categories') as migrated_relations,
    (SELECT COUNT(DISTINCT question_id) FROM question_tags WHERE created_by = 'migration_from_categories') as questions_with_tags;

-- 9. サンプルデータの確認（移行されたタグとその関連問題）
SELECT 
    t.display_name as tag_name,
    c.name as category_name,
    COUNT(DISTINCT qt.question_id) as question_count,
    STRING_AGG(DISTINCT CONCAT(e.year, '年', e.season, '問', q.question_number), ', ' ORDER BY e.year DESC, e.season, q.question_number) as sample_questions
FROM tags t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN question_tags qt ON t.id = qt.tag_id
LEFT JOIN questions q ON qt.question_id = q.id
LEFT JOIN exams e ON q.exam_id = e.id
WHERE t.description LIKE '%元カテゴリパス:%'
GROUP BY t.id, t.display_name, c.name
HAVING COUNT(DISTINCT qt.question_id) > 0
ORDER BY question_count DESC
LIMIT 20;

-- 10. 移行後のクリーンアップ
-- 注意：データの削除は行わない
-- categoriesテーブルとquestion_category_relationsのknowledgeデータは保持
-- これにより既存システムとの互換性を維持

-- クリーンアップは将来的に以下の手順で行う（現在は実行しない）：
/*
-- Step 1: 既存システムがtagsテーブルを使用することを確認
-- Step 2: 十分なテスト期間を経る
-- Step 3: 以下を実行してknowledgeデータを削除

-- まず関連データを削除
DELETE FROM question_category_relations 
WHERE category_id IN (
    SELECT id FROM categories WHERE category_type = 'knowledge'
);

-- knowledgeカテゴリを削除
DELETE FROM categories 
WHERE category_type = 'knowledge';
*/