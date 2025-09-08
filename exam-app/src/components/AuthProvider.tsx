'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, logout, getUserEmail } from '../lib/auth';
import { AuthError } from '../services/api';

interface AuthContextType {
  user: { email: string } | null;
  loading: boolean;
  isLoggedIn: boolean;
  handleLogin: () => void;
  handleLogout: () => void;
  handleAuthError: (error: AuthError) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const authenticated = isAuthenticated();
    setIsLoggedIn(authenticated);
    
    if (authenticated) {
      // JWTトークンからメールアドレスを取得
      const email = getUserEmail();
      setUser(email ? { email } : null);
    } else {
      setUser(null);
    }
    
    setIsLoading(false);

    // 未ログインで/login以外にアクセスした場合はリダイレクト
    if (!authenticated && pathname !== '/login') {
      router.push('/login');
    }
    // ログイン済みで/loginにアクセスした場合はホームにリダイレクト
    else if (authenticated && pathname === '/login') {
      router.push('/');
    }
  }, [router, pathname]);

  useEffect(() => {
    // グローバルエラーハンドラーを設定
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof AuthError) {
        handleAuthError(event.reason);
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    // ログイン後にトークンからメールアドレスを取得
    const email = getUserEmail();
    setUser(email ? { email } : null);
    router.push('/');
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setUser(null);
    router.push('/login');
  };

  const handleAuthError = (error: AuthError) => {
    setIsLoggedIn(false);
    router.push('/login');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const contextValue: AuthContextType = {
    user,
    loading: isLoading,
    isLoggedIn,
    handleLogin,
    handleLogout,
    handleAuthError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}