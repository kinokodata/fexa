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
    const response = await fetch('http://localhost:43001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    return data;
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
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return {
        success: false,
        error: {
          message: 'リフレッシュトークンがありません'
        }
      };
    }

    const response = await fetch('http://localhost:43001/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();
    return data;
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