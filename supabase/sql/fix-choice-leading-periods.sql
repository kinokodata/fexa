-- 選択肢の先頭に不要な「.」が付いている問題を修正するSQL

-- 1. 問題の確認
-- 先頭に「.」がある選択肢の件数を確認
SELECT COUNT(*) as count
FROM choices
WHERE choice_text LIKE '.　%' 
   OR choice_text LIKE '. %'
   OR choice_text LIKE '．　%'
   OR choice_text LIKE '． %';

-- サンプルを表示して確認
SELECT id::text, choice_label, LEFT(choice_text, 100) as choice_text_sample
FROM choices
WHERE choice_text LIKE '.　%' 
   OR choice_text LIKE '. %'
   OR choice_text LIKE '．　%'
   OR choice_text LIKE '． %'
LIMIT 10;

-- 2. 修正の実行
-- すべてのパターンを一度に処理
UPDATE choices
SET choice_text = 
    CASE 
        WHEN choice_text LIKE '.　%' THEN SUBSTRING(choice_text FROM 3)
        WHEN choice_text LIKE '. %' THEN SUBSTRING(choice_text FROM 3)
        WHEN choice_text LIKE '．　%' THEN SUBSTRING(choice_text FROM 3)
        WHEN choice_text LIKE '． %' THEN SUBSTRING(choice_text FROM 3)
        ELSE choice_text
    END
WHERE choice_text LIKE '.　%' 
   OR choice_text LIKE '. %'
   OR choice_text LIKE '．　%'
   OR choice_text LIKE '． %';

-- 3. 修正結果の確認
-- 修正後、まだ問題が残っていないか確認
SELECT COUNT(*) as count
FROM choices
WHERE choice_text LIKE '.　%' 
   OR choice_text LIKE '. %'
   OR choice_text LIKE '．　%'
   OR choice_text LIKE '． %';

-- 最終的な修正結果を確認
SELECT 'Fix completed' as status;