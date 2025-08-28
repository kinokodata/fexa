-- 選択肢画像対応のためのマイグレーション

-- choicesテーブルの修正
ALTER TABLE choices 
ALTER COLUMN choice_text DROP NOT NULL;

-- has_imageカラムを追加
ALTER TABLE choices 
ADD COLUMN has_image BOOLEAN DEFAULT FALSE;

-- 既存データのhas_image値を更新（選択肢画像がある場合）
UPDATE choices 
SET has_image = TRUE 
WHERE id IN (
    SELECT DISTINCT choice_id 
    FROM choice_images 
    WHERE choice_id IS NOT NULL
);