import { getAuthToken, refreshToken, setAuthToken, logout } from './auth';

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
  isRetry?: boolean;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const apiRequest = async (url: string, options: ApiOptions = {}): Promise<Response> => {
  const { requireAuth = true, isRetry = false, ...fetchOptions } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  if (requireAuth) {
    const token = getAuthToken();
    console.log('Debug - Token exists:', !!token);
    console.log('Debug - Token preview:', token ? token.substring(0, 20) + '...' : 'null');
    if (!token) {
      throw new AuthError('認証トークンがありません。ログインしてください。');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // 認証エラー (401) の場合の処理
  if (response.status === 401 && requireAuth && !isRetry) {
    try {
      // トークンリフレッシュを試行
      const refreshResult = await refreshToken();
      
      if (refreshResult.success && refreshResult.token) {
        setAuthToken(refreshResult.token);
        
        // リフレッシュ成功後、元のリクエストを再実行
        return apiRequest(url, { ...options, isRetry: true });
      } else {
        // リフレッシュ失敗の場合はログアウト
        logout();
        throw new AuthError('認証の有効期限が切れました。再度ログインしてください。');
      }
    } catch (error) {
      logout();
      throw new AuthError('認証の有効期限が切れました。再度ログインしてください。');
    }
  }

  // その他の401エラー（リトライ後など）
  if (response.status === 401) {
    logout();
    throw new AuthError('認証に失敗しました。再度ログインしてください。');
  }

  return response;
};

export const get = (url: string, options: ApiOptions = {}) => 
  apiRequest(url, { ...options, method: 'GET' });

export const post = (url: string, body: any, options: ApiOptions = {}) =>
  apiRequest(url, { 
    ...options, 
    method: 'POST', 
    body: JSON.stringify(body) 
  });

export const put = (url: string, body: any, options: ApiOptions = {}) =>
  apiRequest(url, { 
    ...options, 
    method: 'PUT', 
    body: JSON.stringify(body) 
  });

export const del = (url: string, options: ApiOptions = {}) =>
  apiRequest(url, { ...options, method: 'DELETE' });