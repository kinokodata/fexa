'use client';

import React from 'react';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Alert, Box } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface MathRendererProps {
  text: string;
  hasImages?: boolean;  // 実際の画像が存在するかどうか
  shouldShowImages?: boolean;  // has_imageフラグの状態
}

export default function MathRenderer({ text, hasImages = false, shouldShowImages = false }: MathRendererProps) {
  if (!text) {
    return null;
  }

  // 画像Markdown記法の検出（標準形式と [画像:] 形式の両方）
  const standardImageMatches = Array.from(text.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g));
  const customImageMatches = Array.from(text.matchAll(/\[画像:\s*([^\]]*)\]\(([^)]+)\)/g));
  const imageMatches = [...standardImageMatches, ...customImageMatches];
  
  // 画像警告を表示
  let imageWarnings: JSX.Element[] = [];
  if (imageMatches.length > 0 && shouldShowImages && !hasImages) {
    imageMatches.forEach((match, index) => {
      const altText = match[1];
      const imagePath = match[2];
      const fileName = imagePath.split('/').pop() || '';
      
      imageWarnings.push(
        <Alert 
          key={index} 
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
            <strong>画像を読み込めませんでした</strong>
            <br />
            ファイル名: <code>{fileName}</code>
            {altText && (
              <>
                <br />
                画像内容: {altText}
              </>
            )}
          </Box>
        </Alert>
      );
    });
  }
  
  // 画像マークダウンをテキストから除去
  let processedText = text;
  imageMatches.forEach(match => {
    processedText = processedText.replace(match[0], '');
  });
  processedText = processedText.trim();

  return (
    <Box sx={{ lineHeight: 1.8 }}>
      {/* 画像警告を表示 */}
      {imageWarnings}
      
      {/* ReactMarkdownでコンテンツをレンダリング */}
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          table: ({ children, ...props }) => (
            <Box sx={{ margin: '16px 0', overflowX: 'auto' }}>
              <table
                style={{
                  border: '2px solid black',
                  borderCollapse: 'collapse',
                  minWidth: 'auto'
                }}
                {...props}
              >
                {children}
              </table>
            </Box>
          ),
          th: ({ children, ...props }) => (
            <th
              style={{
                border: '1px solid black',
                padding: '8px 12px',
                fontWeight: 'bold',
                backgroundColor: 'white'
              }}
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              style={{
                border: '1px solid black',
                padding: '8px 12px',
                backgroundColor: 'white'
              }}
              {...props}
            >
              {children}
            </td>
          ),
          code: ({ inline, children, ...props }) => (
            inline ? (
              <code
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}
                {...props}
              >
                {children}
              </code>
            ) : (
              <Box
                component="pre"
                sx={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  padding: 2,
                  marginY: 2,
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.9em'
                }}
              >
                <code {...props}>{children}</code>
              </Box>
            )
          )
        }}
      >
        {processedText}
      </ReactMarkdown>
    </Box>
  );
}