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
  has_image?: boolean;
  is_table_format?: boolean;
  images?: any[];
  choice_images?: any[];
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

// カテゴリ情報
export interface Category {
  id: string;
  parent_id?: string;
  exam_code: string;
  level: number;
  category_type: 'field' | 'major' | 'medium' | 'minor' | 'knowledge';
  name: string;
  display_order?: number;
  path?: string;
  created_at: string;
  updated_at: string;
  children?: Category[];
  question_count?: number;
  knowledges?: string;
  // 階層情報
  field_name?: string;
  major_category?: string;
  medium_category?: string;
  minor_category?: string;
  knowledge_item?: string;
  // 関連付け情報
  relevance_score?: number;
  is_primary?: boolean;
  notes?: string;
  relation_id?: string;
  category?: Category;
}

// 問題カテゴリ関連情報
export interface QuestionCategory {
  id: string;
  question_id: string;
  category_id: string;
  relevance_score: number;
  is_primary: boolean;
  notes?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
  category?: Category;
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