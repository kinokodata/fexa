-- Fexa データベース全削除スクリプト
-- 全てのテーブルとデータを削除して初期化

-- 外部キー制約により削除順序に注意

-- 子テーブルから順に削除
DROP TABLE IF EXISTS choice_images CASCADE;
DROP TABLE IF EXISTS question_images CASCADE;
DROP TABLE IF EXISTS import_history CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS choices CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS exams CASCADE;

-- トリガー関数も削除
DROP FUNCTION IF EXISTS update_updated_at_column();

-- インデックスは CASCADE で自動削除されるが、明示的に削除
DROP INDEX IF EXISTS idx_questions_exam_id;
DROP INDEX IF EXISTS idx_questions_category_id;
DROP INDEX IF EXISTS idx_questions_type;
DROP INDEX IF EXISTS idx_choices_question_id;
DROP INDEX IF EXISTS idx_question_images_question_id;
DROP INDEX IF EXISTS idx_choice_images_choice_id;
DROP INDEX IF EXISTS idx_exams_year_season;

-- 拡張機能は残す（他で使用されている可能性があるため）
-- DROP EXTENSION IF EXISTS "uuid-ossp";