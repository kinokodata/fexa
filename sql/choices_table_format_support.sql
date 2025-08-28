-- choices テーブルに表形式選択肢対応の列を追加

-- 表形式かどうかのフラグ
ALTER TABLE choices ADD COLUMN is_table_format BOOLEAN DEFAULT FALSE;

-- 表のヘッダー情報を格納（JSON配列）
-- 例: ["", "真正性", "信頼性"]
ALTER TABLE choices ADD COLUMN table_headers JSONB;

-- 表の行データを格納（JSON配列）
-- 例: ["ア", "a", "c"]
ALTER TABLE choices ADD COLUMN table_data JSONB;

-- インデックスを追加（表形式の問題を効率的に検索するため）
CREATE INDEX idx_choices_table_format ON choices(is_table_format) WHERE is_table_format = true;

-- コメントを追加
COMMENT ON COLUMN choices.is_table_format IS '選択肢が表形式かどうかのフラグ';
COMMENT ON COLUMN choices.table_headers IS '表のヘッダー情報（JSON配列）';
COMMENT ON COLUMN choices.table_data IS '表の行データ（JSON配列）';