-- ========================================
-- question_categoriesテーブルの削除
-- カテゴリの整理のため中間テーブルを削除
-- タグ経由でのカテゴリ検索に統一するため
-- ========================================

-- トリガーの削除（存在する場合）
DROP TRIGGER IF EXISTS trigger_update_question_categories_updated_at ON question_categories;

-- インデックスの削除
DROP INDEX IF EXISTS idx_question_categories_question;
DROP INDEX IF EXISTS idx_question_categories_category;

-- RLSポリシーの削除
DROP POLICY IF EXISTS "Question categories are viewable by everyone" ON question_categories;
DROP POLICY IF EXISTS "Question categories are insertable by authenticated users" ON question_categories;
DROP POLICY IF EXISTS "Question categories are updatable by authenticated users" ON question_categories;
DROP POLICY IF EXISTS "Question categories are deletable by authenticated users" ON question_categories;

-- question_categoriesテーブルの削除
DROP TABLE IF EXISTS question_categories CASCADE;

-- 確認用クエリ
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%question%';