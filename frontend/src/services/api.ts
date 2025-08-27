import { ApiResponse, Question, Exam, HealthStatus } from '../types/api';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:43001';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: {
          message: 'API接続に失敗しました',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  // ヘルスチェック
  async getHealth(detailed: boolean = false): Promise<ApiResponse<HealthStatus>> {
    const query = detailed ? '?detailed=true' : '';
    return this.request<HealthStatus>(`/api/health${query}`);
  }

  // 試験一覧取得
  async getExams(): Promise<ApiResponse<Exam[]>> {
    return this.request<Exam[]>('/api/exams');
  }

  // 問題一覧取得
  async getQuestions(params?: {
    year?: number;
    season?: string;
    question_type?: string;
    category_id?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Question[]>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    return this.request<Question[]>(`/api/questions${query ? `?${query}` : ''}`);
  }

  // 問題詳細取得
  async getQuestion(id: string): Promise<ApiResponse<Question>> {
    return this.request<Question>(`/api/questions/${id}`);
  }

  // 問題検索（年度・季節指定）
  async searchQuestions(year: number, season: string, page: number = 1): Promise<ApiResponse<Question[]>> {
    return this.getQuestions({ year, season, page, limit: 20 });
  }
}

// デフォルトAPIクライアントインスタンス
export const apiClient = new ApiClient();

export default apiClient;