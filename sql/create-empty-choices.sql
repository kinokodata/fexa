-- 選択肢が登録されていない問題に空の選択肢を作成するSQL

-- 1. 選択肢がない問題の確認（実行前）
SELECT 
    COUNT(*) as total_questions_without_choices
FROM questions q
WHERE NOT EXISTS (
    SELECT 1 FROM choices c WHERE c.question_id = q.id
);

-- 2. 選択肢がない問題のサンプル確認
SELECT 
    q.id,
    q.question_number,
    LEFT(q.question_text, 50) as question_text_sample,
    e.year,
    e.season
FROM questions q
JOIN exams e ON q.exam_id = e.id
WHERE NOT EXISTS (
    SELECT 1 FROM choices c WHERE c.question_id = q.id
)
ORDER BY e.year DESC, e.season, q.question_number
LIMIT 10;

-- 3. 空の選択肢を作成（4つの選択肢を作成）
INSERT INTO choices (question_id, choice_label, choice_text, is_correct, has_image)
SELECT 
    q.id as question_id,
    choice_label,
    '' as choice_text,
    false as is_correct,
    false as has_image
FROM questions q
CROSS JOIN (
    SELECT 'ア' as choice_label UNION ALL
    SELECT 'イ' as choice_label UNION ALL
    SELECT 'ウ' as choice_label UNION ALL
    SELECT 'エ' as choice_label
) AS labels
WHERE NOT EXISTS (
    SELECT 1 FROM choices c WHERE c.question_id = q.id
)
ORDER BY q.id, 
    CASE choice_label
        WHEN 'ア' THEN 1
        WHEN 'イ' THEN 2
        WHEN 'ウ' THEN 3
        WHEN 'エ' THEN 4
    END;

-- 4. 結果の確認
SELECT 
    COUNT(*) as remaining_questions_without_choices
FROM questions q
WHERE NOT EXISTS (
    SELECT 1 FROM choices c WHERE c.question_id = q.id
);

-- 5. 作成された空の選択肢の統計
SELECT 
    e.year,
    e.season,
    COUNT(DISTINCT q.id) as questions_with_empty_choices
FROM questions q
JOIN exams e ON q.exam_id = e.id
JOIN choices c ON c.question_id = q.id
WHERE c.choice_text = ''
GROUP BY e.year, e.season
ORDER BY e.year DESC, e.season;