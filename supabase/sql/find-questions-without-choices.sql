-- 選択肢が登録されていない問題を抽出するクエリ
-- 年度、季節、問題番号とともに表示

SELECT 
    e.year,
    e.season,
    q.question_number,
    q.id as question_id,
    q.question_text,
    COUNT(c.id) as choice_count
FROM 
    questions q
    LEFT JOIN exams e ON q.exam_id = e.id
    LEFT JOIN choices c ON q.id = c.question_id
GROUP BY 
    e.year, e.season, q.question_number, q.id, q.question_text
HAVING 
    COUNT(c.id) = 0
ORDER BY 
    e.year DESC, 
    e.season,
    q.question_number;

-- より詳細な情報が必要な場合のクエリ
-- 問題の種類やチェック状態も含む
SELECT 
    e.year,
    e.season,
    q.question_type,
    q.question_number,
    q.id as question_id,
    SUBSTRING(q.question_text, 1, 100) || '...' as question_preview,
    q.is_checked,
    q.checked_by,
    q.checked_at,
    COUNT(c.id) as choice_count
FROM 
    questions q
    LEFT JOIN exams e ON q.exam_id = e.id
    LEFT JOIN choices c ON q.id = c.question_id
GROUP BY 
    e.year, e.season, q.question_type, q.question_number, q.id, q.question_text, q.is_checked, q.checked_by, q.checked_at
HAVING 
    COUNT(c.id) = 0
ORDER BY 
    e.year DESC, 
    e.season,
    q.question_number;

-- 年度別の統計を確認するクエリ
SELECT 
    e.year,
    e.season,
    COUNT(DISTINCT q.id) as total_questions,
    COUNT(DISTINCT CASE WHEN c.id IS NULL THEN q.id END) as questions_without_choices,
    ROUND(
        (COUNT(DISTINCT CASE WHEN c.id IS NULL THEN q.id END) * 100.0 / COUNT(DISTINCT q.id)), 
        2
    ) as percentage_without_choices
FROM 
    questions q
    LEFT JOIN exams e ON q.exam_id = e.id
    LEFT JOIN choices c ON q.id = c.question_id
GROUP BY 
    e.year, e.season
ORDER BY 
    e.year DESC, 
    e.season;