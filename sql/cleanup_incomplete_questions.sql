-- 選択肢が登録されていない問題を特定して削除するクエリ

-- 1. 選択肢が存在しない問題を確認
SELECT q.id, q.question_number, e.year, e.season, COUNT(c.id) as choice_count
FROM questions q
JOIN exams e ON q.exam_id = e.id
LEFT JOIN choices c ON q.id = c.question_id
WHERE e.year = 2018 AND e.season = '秋期'
GROUP BY q.id, q.question_number, e.year, e.season
HAVING COUNT(c.id) = 0
ORDER BY q.question_number;

-- 2. 選択肢が不完全な問題（4つ未満）を確認
SELECT q.id, q.question_number, e.year, e.season, COUNT(c.id) as choice_count
FROM questions q
JOIN exams e ON q.exam_id = e.id
LEFT JOIN choices c ON q.id = c.question_id
WHERE e.year = 2018 AND e.season = '秋期'
GROUP BY q.id, q.question_number, e.year, e.season
HAVING COUNT(c.id) > 0 AND COUNT(c.id) < 4
ORDER BY q.question_number;

-- 3. 問26, 39, 44, 45 の選択肢を確認
SELECT q.question_number, c.*
FROM questions q
LEFT JOIN choices c ON q.id = c.question_id
JOIN exams e ON q.exam_id = e.id
WHERE e.year = 2018 AND e.season = '秋期'
  AND q.question_number IN (26, 39, 44, 45)
ORDER BY q.question_number, c.choice_label;

-- 4. 選択肢がない問題を削除（必要に応じて実行）
-- 関連する画像データも一緒に削除される（CASCADE）
/*
DELETE FROM questions
WHERE id IN (
  SELECT q.id
  FROM questions q
  JOIN exams e ON q.exam_id = e.id
  LEFT JOIN choices c ON q.id = c.question_id
  WHERE e.year = 2018 AND e.season = '秋期'
  GROUP BY q.id
  HAVING COUNT(c.id) = 0
);
*/