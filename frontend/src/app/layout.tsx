'use client';

import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AuthProvider from '../components/AuthProvider';
import Header from '../components/Header';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <Header />
            
            <Box component="main" sx={{ minHeight: 'calc(100vh - 64px - 60px)', paddingTop: '64px' }}>
              {children}
            </Box>

            <Box 
              component="footer" 
              sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                mt: 'auto',
                textAlign: 'center'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                © 2024 Fexa - 基本情報技術者試験過去問データベース
              </Typography>
            </Box>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}