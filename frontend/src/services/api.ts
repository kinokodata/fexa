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

  // 軽量な問題リスト取得（ナビゲーション用）
  async getQuestionsList(params?: {
    year?: number;
    season?: string;
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
    const endpoint = `/api/questions/list${query ? `?${query}` : ''}`;
    return this.request<Question[]>(endpoint);
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

  // 選択肢テキストを更新
  async updateChoiceText(questionId: string, choiceId: string, choiceText: string): Promise<ApiResponse<{ message: string; data: any }>> {
    return this.request<{ message: string; data: any }>(`/api/questions/${questionId}/choices/${choiceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ choiceText }),
    });
  }

  // 表形式選択肢を更新
  async updateChoiceTable(questionId: string, choiceTableMarkdown: string): Promise<ApiResponse<{ message: string; data: any }>> {
    return this.request<{ message: string; data: any }>(`/api/questions/${questionId}/choice-table`, {
      method: 'PATCH',
      body: JSON.stringify({ choiceTableMarkdown }),
    });
  }

  // 表形式選択肢を削除
  async deleteChoiceTable(questionId: string): Promise<ApiResponse<{ message: string; data: any }>> {
    return this.request<{ message: string; data: any }>(`/api/questions/${questionId}/choice-table`, {
      method: 'DELETE',
    });
  }

  // カテゴリ関連のメソッド

  // 全カテゴリを階層構造で取得
  async getCategories(examCode = 'FE'): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/categories?exam_code=${examCode}`);
  }

  // 全カテゴリをフラット構造で取得（問題数付き）
  async getCategoriesFlat(examCode = 'FE'): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/categories/flat?exam_code=${examCode}`);
  }

  // 階層カテゴリを取得（ドロップダウン用）
  async getCategoriesHierarchy(params?: {
    examCode?: string;
    level?: number;
    parentField?: string;
    parentMajor?: string;
    parentMedium?: string;
    parentMinor?: string;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      if (params.examCode) searchParams.append('exam_code', params.examCode);
      if (params.level !== undefined) searchParams.append('level', params.level.toString());
      if (params.parentField) searchParams.append('parent_field', params.parentField);
      if (params.parentMajor) searchParams.append('parent_major', params.parentMajor);
      if (params.parentMedium) searchParams.append('parent_medium', params.parentMedium);
      if (params.parentMinor) searchParams.append('parent_minor', params.parentMinor);
    } else {
      searchParams.append('exam_code', 'FE');
    }

    const query = searchParams.toString();
    const endpoint = `/api/categories/hierarchy${query ? `?${query}` : ''}`;
    return this.request<any[]>(endpoint);
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
  ): Promise<ApiResponse<{ message: string; data: any }>> {
    return this.request<{ message: string; data: any }>(`/api/categories/assign`, {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        category_id: categoryId,
        ...options
      }),
    });
  }

  // 問題とカテゴリの関連付けを更新
  async updateQuestionCategoryRelation(
    questionId: string,
    relationId: string,
    options: {
      relevance_score?: number;
      is_primary?: boolean;
      notes?: string;
    }
  ): Promise<ApiResponse<{ message: string; data: any }>> {
    return this.request<{ message: string; data: any }>(`/api/categories/question/${questionId}/${relationId}`, {
      method: 'PATCH',
      body: JSON.stringify(options),
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

  // 画像を削除
  async deleteImage(
    imageId: string,
    type: 'question' | 'choice'
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/api/images/${imageId}?type=${type}`, {
      method: 'DELETE',
    });
  }
}

const apiClient = new ApiClient();

export default apiClient;