// API型定義
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

// 試験情報
export interface Exam {
  id: string;
  year: number;
  season: string;
  exam_date?: string;
  created_at: string;
  question_count?: number;
}

// 問題情報
export interface Question {
  id: string;
  question_number: number;
  question_type: string;
  question_text: string;
  pdf_page_number?: number;
  has_image: boolean;
  created_at: string;
  exam: {
    year: number;
    season: string;
    exam_date?: string;
  };
  category?: {
    name: string;
    description?: string;
  };
  choices: Choice[];
  images?: QuestionImage[];
  answer?: Answer;
}

// 選択肢
export interface Choice {
  id: string;
  choice_label: string;
  choice_text: string;
  is_correct?: boolean;
}

// 画像
export interface QuestionImage {
  id: string;
  image_url: string;
  image_type?: string;
  caption?: string;
}

// 解答・解説
export interface Answer {
  correct_choice: string;
  explanation?: string;
  reference_url?: string;
}

// ヘルスチェック
export interface HealthStatus {
  status: string;
  timestamp: string;
  environment: string;
  version: string;
  database?: {
    status: string;
    error?: string;
  };
  storage?: {
    status: string;
    error?: string;
  };
}