'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Alert, 
  Box, 
  Typography 
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface MarkdownRendererProps {
  children: string;
  hasImages?: boolean;
  shouldShowImages?: boolean;
}

export default function MarkdownRenderer({ 
  children, 
  hasImages = false, 
  shouldShowImages = false 
}: MarkdownRendererProps) {
  if (!children) {
    return null;
  }

  const components = {
    // 見出し
    h1: ({ children }: any) => (
      <Typography variant="h4" component="h1" gutterBottom>
        {children}
      </Typography>
    ),
    h2: ({ children }: any) => (
      <Typography variant="h5" component="h2" gutterBottom>
        {children}
      </Typography>
    ),
    h3: ({ children }: any) => (
      <Typography variant="h6" component="h3" gutterBottom>
        {children}
      </Typography>
    ),
    
    // 段落
    p: ({ children }: any) => (
      <Typography variant="body1" paragraph>
        {children}
      </Typography>
    ),

    // 強調
    strong: ({ children }: any) => (
      <Typography component="strong" sx={{ fontWeight: 'bold' }}>
        {children}
      </Typography>
    ),
    em: ({ children }: any) => (
      <Typography component="em" sx={{ fontStyle: 'italic' }}>
        {children}
      </Typography>
    ),

    // リスト
    ul: ({ children }: any) => (
      <Box component="ul" sx={{ pl: 2, my: 1 }}>
        {children}
      </Box>
    ),
    ol: ({ children }: any) => (
      <Box component="ol" sx={{ pl: 2, my: 1 }}>
        {children}
      </Box>
    ),
    li: ({ children }: any) => (
      <Box component="li" sx={{ mb: 0.5 }}>
        <Typography variant="body1" component="span">
          {children}
        </Typography>
      </Box>
    ),

    // テーブル
    table: ({ children }: any) => (
      <TableContainer sx={{ margin: '16px 0', width: 'auto', display: 'inline-block' }}>
        <Table size="small" sx={{ 
          minWidth: 'auto',
          border: '2px solid black',
          '& .MuiTableCell-root': {
            border: '1px solid black',
            padding: '8px 12px'
          }
        }}>
          {children}
        </Table>
      </TableContainer>
    ),
    thead: ({ children }: any) => (
      <TableHead>
        {children}
      </TableHead>
    ),
    tbody: ({ children }: any) => (
      <TableBody>
        {children}
      </TableBody>
    ),
    tr: ({ children }: any) => (
      <TableRow>
        {children}
      </TableRow>
    ),
    th: ({ children }: any) => (
      <TableCell sx={{ 
        fontWeight: 'bold', 
        backgroundColor: 'white',
        border: '1px solid black'
      }}>
        {children}
      </TableCell>
    ),
    td: ({ children }: any) => (
      <TableCell sx={{ 
        border: '1px solid black',
        backgroundColor: 'white'
      }}>
        {children}
      </TableCell>
    ),

    // 画像（警告表示）
    img: ({ src, alt }: any) => {
      if (shouldShowImages && !hasImages) {
        const fileName = src?.split('/').pop() || '';
        return (
          <Alert 
            severity="warning"
            iconMapping={{
              warning: <WarningAmberIcon sx={{ fontSize: 40 }} />
            }}
            sx={{ 
              margin: '16px 0',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              '& .MuiAlert-icon': {
                fontSize: '40px',
                marginRight: '28px'
              }
            }}
          >
            <Box>
              <strong>画像をアップロードしてください</strong>
              <br />
              推奨ファイル名: <code>{fileName}</code>
              {alt && (
                <>
                  <br />
                  画像内容: {alt}
                </>
              )}
            </Box>
          </Alert>
        );
      }
      
      if (hasImages && src) {
        return (
          <Box sx={{ my: 2, textAlign: 'left' }}>
            <img 
              src={src} 
              alt={alt} 
              style={{ 
                maxWidth: '100%', 
                height: 'auto',
                border: '1px solid #e0e0e0',
                borderRadius: '4px'
              }} 
            />
          </Box>
        );
      }
      
      return null;
    },

    // コードブロック
    code: ({ inline, className, children, ...props }: any) => {
      if (inline) {
        return (
          <Typography 
            component="code" 
            sx={{ 
              backgroundColor: '#f5f5f5',
              padding: '2px 4px',
              borderRadius: '3px',
              fontFamily: 'monospace',
              fontSize: '0.9em'
            }}
          >
            {children}
          </Typography>
        );
      }
      return (
        <Box 
          component="pre" 
          sx={{ 
            backgroundColor: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.9em',
            margin: '16px 0'
          }}
        >
          <code {...props}>{children}</code>
        </Box>
      );
    },

    // 改行
    br: () => <br />
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
      rehypePlugins={[rehypeKatex]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
}