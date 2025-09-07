-- ========================================
-- 完全なcategoriesテーブル再構築＆データ投入スクリプト
-- fe_exam_syllabus.jsonの階層構造データをすべて投入
-- ========================================

-- 1. 既存テーブルの再作成
\i recreate-categories-table.sql

-- 2. テクノロジ系データの投入
\i import-fe-syllabus-to-categories.sql

-- 3. マネジメント系・ストラテジ系データの投入
\i import-management-strategy-to-categories.sql

-- 4. 確認用クエリ
SELECT 
    level,
    COUNT(*) as count,
    string_agg(name, ', ' ORDER BY display_order) as examples
FROM categories 
GROUP BY level 
ORDER BY level;

-- 5. 階層表示サンプル
SELECT 
    REPEAT('  ', level - 1) || name as hierarchy,
    level,
    CASE 
        WHEN knowledges IS NOT NULL THEN '知識項目: ' || LEFT(knowledges, 50) || '...'
        ELSE ''
    END as knowledge_sample
FROM categories 
WHERE path LIKE 'テクノロジ系/基礎理論%'
ORDER BY path, display_order;

-- 6. 統計情報
SELECT 
    '総カテゴリ数' as metric, 
    COUNT(*)::text as value 
FROM categories
UNION ALL
SELECT 
    '分野数' as metric, 
    COUNT(*)::text as value 
FROM categories WHERE level = 1
UNION ALL
SELECT 
    '大分類数' as metric, 
    COUNT(*)::text as value 
FROM categories WHERE level = 2
UNION ALL
SELECT 
    '中分類数' as metric, 
    COUNT(*)::text as value 
FROM categories WHERE level = 3
UNION ALL
SELECT 
    '小分類数' as metric, 
    COUNT(*)::text as value 
FROM categories WHERE level = 4
UNION ALL
SELECT 
    '知識項目を持つ小分類数' as metric, 
    COUNT(*)::text as value 
FROM categories WHERE level = 4 AND knowledges IS NOT NULL;