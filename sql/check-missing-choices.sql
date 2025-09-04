-- 選択肢が登録されていない問題を確認・修正するSQL

-- 1. 選択肢が登録されていない問題を確認
SELECT 
    q.id,
    q.question_number,
    q.question_text,
    e.year,
    e.season,
    COUNT(c.id) as choice_count
FROM questions q
JOIN exams e ON q.exam_id = e.id
LEFT JOIN choices c ON c.question_id = q.id
GROUP BY q.id, q.question_number, q.question_text, e.year, e.season
HAVING COUNT(c.id) = 0
ORDER BY e.year DESC, e.season, q.question_number
LIMIT 20;

-- 2. 選択肢がない問題の総数を確認
SELECT 
    COUNT(*) as total_questions_without_choices
FROM questions q
WHERE NOT EXISTS (
    SELECT 1 FROM choices c WHERE c.question_id = q.id
);

-- 3. 年度・季節ごとの選択肢なし問題数を確認
SELECT 
    e.year,
    e.season,
    COUNT(*) as questions_without_choices
FROM questions q
JOIN exams e ON q.exam_id = e.id
WHERE NOT EXISTS (
    SELECT 1 FROM choices c WHERE c.question_id = q.id
)
GROUP BY e.year, e.season
ORDER BY e.year DESC, e.season;

-- 4. 選択肢が4つ未満の問題を確認（通常は4つあるはず）
SELECT 
    e.year,
    e.season,
    q.question_number,
    COUNT(c.id) as choice_count
FROM questions q
JOIN exams e ON q.exam_id = e.id
LEFT JOIN choices c ON c.question_id = q.id
GROUP BY e.year, e.season, q.question_number, q.id
HAVING COUNT(c.id) BETWEEN 1 AND 3
ORDER BY e.year DESC, e.season, q.question_number
LIMIT 20;