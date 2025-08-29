interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  error?: {
    message: string;
  };
}

interface RefreshTokenResponse {
  success: boolean;
  token?: string;
  error?: {
    message: string;
  };
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    // services/api.tsのloginメソッドを使用
    const { default: apiClient } = await import('../services/api');
    const result = await apiClient.login(email, password);
    
    if (result.success && result.data) {
      setAuthToken(result.data.token);
      if (result.data.refreshToken) {
        setRefreshToken(result.data.refreshToken);
      }
      return {
        success: true,
        token: result.data.token,
        refreshToken: result.data.refreshToken
      };
    }
    
    return {
      success: false,
      error: result.error || { message: 'ログインに失敗しました' }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'ログイン中にエラーが発生しました'
      }
    };
  }
};

export const refreshToken = async (): Promise<RefreshTokenResponse> => {
  try {
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) {
      return {
        success: false,
        error: {
          message: 'リフレッシュトークンがありません'
        }
      };
    }

    // services/api.tsのrefreshTokenメソッドを使用
    const { default: apiClient } = await import('../services/api');
    const result = await apiClient.refreshToken(currentRefreshToken);
    
    if (result.success && result.data) {
      setAuthToken(result.data.token);
      return {
        success: true,
        token: result.data.token
      };
    }
    
    return {
      success: false,
      error: result.error || { message: 'トークンリフレッシュに失敗しました' }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'トークンリフレッシュ中にエラーが発生しました'
      }
    };
  }
};

export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
};

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token');
  }
  return null;
};

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

export const setRefreshToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('refresh_token', token);
  }
};

export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

export const getUserEmail = (): string | null => {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    // JWTトークンの中央部分（payload）をデコード
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || null;
  } catch (error) {
    console.error('トークンの解析に失敗:', error);
    return null;
  }
};