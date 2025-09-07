import { ApiResponse, Question, Exam, HealthStatus } from '../types/api';
import { getAuthToken } from '../lib/auth';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:43001';

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
      // 既存の認証システムからトークンを取得
      const token = getAuthToken();
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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

  // 汎用GET メソッド
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    // APIエンドポイントの正規化
    const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    return this.request<T>(normalizedEndpoint);
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
    const endpoint = `/api/questions${query ? `?${query}` : ''}`;
    const result = await this.request<Question[]>(endpoint);
    console.log('API Response - Questions:', result);
    return result;
  }

  // 問題詳細取得
  async getQuestion(id: string): Promise<ApiResponse<Question>> {
    const result = await this.request<Question>(`/api/questions/${id}`);
    console.log('API Response - Question Detail:', result);
    return result;
  }

  // 問題検索（年度・季節指定）
  async searchQuestions(year: number, season: string, page: number = 1): Promise<ApiResponse<Question[]>> {
    return this.getQuestions({ year, season, page, limit: 20 });
  }

  // 認証API
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    return this.request<{ token: string; refreshToken: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string }>> {
    return this.request<{ token: string }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // 問題チェック完了
  async markQuestionAsChecked(id: string, checkedBy: string): Promise<ApiResponse<{ id: string; is_checked: boolean; checked_at: string; checked_by: string }>> {
    return this.request<{ id: string; is_checked: boolean; checked_at: string; checked_by: string }>(`/api/questions/${id}/check`, {
      method: 'PATCH',
      body: JSON.stringify({ checked_by: checkedBy }),
    });
  }

  // 正答を更新
  async updateCorrectAnswer(questionId: string, correctChoiceId: string): Promise<ApiResponse<{ message: string; data: any }>> {
    return this.request<{ message: string; data: any }>(`/api/questions/${questionId}/correct-answer`, {
      method: 'PATCH',
      body: JSON.stringify({ correctChoiceId }),
    });
  }

  // 問題文を更新
  async updateQuestionText(questionId: string, questionText: string): Promise<ApiResponse<{ message: string; data: any }>> {
    return this.request<{ message: string; data: any }>(`/api/questions/${questionId}/question-text`, {
      method: 'PATCH',
      body: JSON.stringify({ questionText }),
    });
  }

  // 解説を更新
  async updateExplanation(questionId: string, explanation: string): Promise<ApiResponse<{ message: string; data: any }>> {
    return this.request<{ message: string; data: any }>(`/api/questions/${questionId}/explanation`, {
      method: 'PATCH',
      body: JSON.stringify({ explanation }),
    });
  }

  // カテゴリ関連のメソッド

  // レベル別カテゴリ取得
  async getCategoriesByLevel(level: number, parentId?: string): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (parentId) params.append('parent_id', parentId);
    const query = params.toString();
    return this.request<any[]>(`/api/categories/level/${level}${query ? `?${query}` : ''}`);
  }

  // 全カテゴリを階層構造で取得
  async getCategories(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/categories');
  }

  // 特定問題のカテゴリを取得
  async getQuestionCategories(questionId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/categories/by-question/${questionId}`);
  }

  // 問題にカテゴリを関連付け
  async assignCategoryToQuestion(
    questionId: string,
    categoryId: string,
    options?: {
      relevance_score?: number;
      is_primary?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    return this.request<any>('/api/categories/assign', {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        category_id: categoryId,
        ...options
      }),
    });
  }

  // 問題とカテゴリの関連付けを削除
  async removeQuestionCategoryRelation(
    questionId: string,
    assignmentId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/api/categories/assign/${assignmentId}`, {
      method: 'DELETE',
    });
  }

  // カテゴリに関連付けられた問題を取得
  async getCategoryQuestions(
    categoryId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const query = searchParams.toString();
    return this.request<any[]>(`/api/categories/${categoryId}/questions${query ? `?${query}` : ''}`);
  }
}

const apiClient = new ApiClient();

export default apiClient;