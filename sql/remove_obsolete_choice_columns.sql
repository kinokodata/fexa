-- choicesテーブルから不要になったカラムを削除
-- 新しい設計では選択肢の表データはquestionsテーブルで管理

-- バックアップ用クエリ（必要に応じて実行前に確認）
-- SELECT id, choice_label, is_table_format, table_headers, table_data 
-- FROM choices 
-- WHERE is_table_format = TRUE;

-- 不要なカラムを削除
ALTER TABLE choices 
DROP COLUMN IF EXISTS is_table_format;

ALTER TABLE choices 
DROP COLUMN IF EXISTS table_headers;

ALTER TABLE choices 
DROP COLUMN IF EXISTS table_data;

-- 確認用クエリ
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'choices' 
-- ORDER BY ordinal_position;