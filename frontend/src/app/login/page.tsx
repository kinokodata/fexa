'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Login from '../../components/Login';
import { isAuthenticated } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const handleLoginSuccess = () => {
    router.push('/');
  };

  return <Login onLoginSuccess={handleLoginSuccess} />;
}