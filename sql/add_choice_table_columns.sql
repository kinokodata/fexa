-- questionsテーブルに表形式選択肢用のカラムを追加

-- 選択肢が表形式かどうかのフラグ
ALTER TABLE questions 
ADD COLUMN has_choice_table BOOLEAN DEFAULT FALSE;

-- 表の種類（markdown or image）
ALTER TABLE questions 
ADD COLUMN choice_table_type VARCHAR(20) CHECK (choice_table_type IN ('markdown', 'image'));

-- 表のMarkdownテキスト（choice_table_type が 'markdown' の場合）
ALTER TABLE questions 
ADD COLUMN choice_table_markdown TEXT;

-- コメント追加
COMMENT ON COLUMN questions.has_choice_table IS '選択肢が表形式かどうかのフラグ';
COMMENT ON COLUMN questions.choice_table_type IS '表の種類（markdown または image）';
COMMENT ON COLUMN questions.choice_table_markdown IS '表のMarkdownテキスト（choice_table_type が markdown の場合に使用）';

-- 既存データの確認用クエリ（実行しないでください、参考用）
-- SELECT 
--   id, 
--   question_number, 
--   has_choice_table, 
--   choice_table_type, 
--   choice_table_markdown
-- FROM questions 
-- WHERE has_choice_table = TRUE;