-- 利用可能な試験の確認
SELECT 
    id,
    year,
    season,
    created_at,
    -- 問題数もカウント
    (SELECT COUNT(*) FROM questions WHERE exam_id = e.id) as question_count
FROM exams e
ORDER BY year DESC, season;