'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import { login, setAuthToken, setRefreshToken } from '../lib/auth';

interface LoginProps {
  onLoginSuccess: () => void;
  authError?: string | null;
}

export default function Login({ onLoginSuccess, authError }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await login(email, password);
      console.log('Debug - Login result:', result);
      
      if (result.success && result.token) {
        // console.log('Debug - Setting token:', result.token.substring(0, 20) + '...');
        setAuthToken(result.token);
        if (result.refreshToken) {
          setRefreshToken(result.refreshToken);
        }
        onLoginSuccess();
      } else {
        console.error('Debug - Login failed:', result);
        setError(result.error?.message || 'ログインに失敗しました');
      }
    } catch (err) {
      console.error('Debug - Login error:', err);
      setError('ログイン中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            ログイン
          </Typography>
          
          {(error || authError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || authError}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="メールアドレス"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="パスワード"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}