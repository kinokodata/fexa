-- Fexa データベース初期化スクリプト
-- 基本情報技術者試験の過去問題を管理するテーブル構造

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 試験情報テーブル
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    season VARCHAR(10) NOT NULL, -- 春期/秋期
    exam_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, season)
);

-- 問題カテゴリテーブル
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 問題テーブル
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_type VARCHAR(20) NOT NULL, -- 午前/午後
    question_text TEXT NOT NULL,
    category_id UUID REFERENCES categories(id),
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    pdf_page_number INTEGER,
    has_image BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, question_number, question_type)
);

-- 選択肢テーブル
CREATE TABLE IF NOT EXISTS choices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    choice_label VARCHAR(10) NOT NULL, -- ア、イ、ウ、エ
    choice_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, choice_label)
);

-- 問題画像テーブル
CREATE TABLE IF NOT EXISTS question_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(50), -- diagram/table/code など
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 解答・解説テーブル
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE UNIQUE,
    correct_choice VARCHAR(10) NOT NULL, -- 正解の選択肢（ア、イ、ウ、エ）
    explanation TEXT, -- Markdown形式の解説
    reference_url TEXT, -- 参考URLなど
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PDFインポート履歴テーブル
CREATE TABLE IF NOT EXISTS import_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id),
    pdf_filename VARCHAR(255) NOT NULL,
    pdf_url TEXT,
    import_status VARCHAR(50) NOT NULL, -- success/partial/failed
    total_questions INTEGER,
    imported_questions INTEGER,
    error_log TEXT,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスの作成
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
CREATE INDEX idx_questions_category_id ON questions(category_id);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_choices_question_id ON choices(question_id);
CREATE INDEX idx_question_images_question_id ON question_images(question_id);
CREATE INDEX idx_exams_year_season ON exams(year, season);

-- 更新時刻を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの設定
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 初期カテゴリデータの挿入
INSERT INTO categories (name, description) VALUES
    ('テクノロジ', '技術要素、コンピュータシステム'),
    ('マネジメント', 'プロジェクトマネジメント、サービスマネジメント'),
    ('ストラテジ', '企業と法務、経営戦略、システム戦略')
ON CONFLICT (name) DO NOTHING;

-- サンプルデータ（開発時のテスト用）
INSERT INTO exams (year, season, exam_date) VALUES
    (2023, '春期', '2023-04-16'),
    (2023, '秋期', '2023-10-08'),
    (2024, '春期', '2024-04-21')
ON CONFLICT (year, season) DO NOTHING;