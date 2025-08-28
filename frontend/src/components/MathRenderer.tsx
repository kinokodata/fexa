'use client';

import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert, Box } from '@mui/material';
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

  // Markdownテーブルをパースして表示する
  const parseMarkdownTable = (tableText: string) => {
    const lines = tableText.trim().split('\n');
    if (lines.length < 2) return null;

    // ヘッダー行とデータ行を分ける
    const headerLine = lines[0];
    const separatorLine = lines[1];
    const dataLines = lines.slice(2);

    // ヘッダーをパース
    const headers = headerLine.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
    
    // データ行をパース
    const rows = dataLines.map(line => 
      line.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
    ).filter(row => row.length > 0);

    if (headers.length === 0 || rows.length === 0) return null;

    return { headers, rows };
  };

  // LaTeX数式とMarkdownテーブルを検出してレンダリングする
  const renderContent = (inputText: string) => {
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let key = 0;
    let processedText = inputText;

    // 画像Markdown記法の検出（標準形式と [画像:] 形式の両方）
    const standardImageMatches = Array.from(inputText.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g));
    const customImageMatches = Array.from(inputText.matchAll(/\[画像:\s*([^\]]*)\]\(([^)]+)\)/g));
    const imageMatches = [...standardImageMatches, ...customImageMatches];
    // 画像マークダウンを処理（警告ボックス表示または除去）
    let imageWarnings: JSX.Element[] = [];
    if (imageMatches.length > 0) {
      imageMatches.forEach(match => {
        if (shouldShowImages && !hasImages) {
          // 警告ボックスを作成
          const altText = match[1];
          const imagePath = match[2];
          const fileName = imagePath.split('/').pop() || '';
          
          imageWarnings.push(
            <Alert 
              key={key++} 
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
                {altText && (
                  <>
                    <br />
                    画像内容: {altText}
                  </>
                )}
              </Box>
            </Alert>
          );
        }
        // 画像マークダウンをテキストから除去
        processedText = processedText.replace(match[0], '').trim();
      });
    }
    
    // 処理されたテキストから他の要素を検出
    const tableMatches = Array.from(processedText.matchAll(/(\|[^\n]+\|\n\|[-:| ]+\|\n(?:\|[^\n]+\|\n?)+)/gm));
    const inlineMatches = Array.from(processedText.matchAll(/\$([^$]+)\$/g));
    const blockMatches = Array.from(processedText.matchAll(/\$\$([^$]+)\$\$/g));

    // 数式とテーブルマッチをインデックス順にソート
    const allMatches = [...tableMatches, ...inlineMatches, ...blockMatches]
      .map(match => ({
        match,
        index: match.index!,
        isBlock: match[0].startsWith('$$'),
        isTable: match[0].includes('|') && match[0].includes('\n'),
        isImage: false  // 画像は既に処理済み
      }))
      .sort((a, b) => a.index - b.index);

    for (const { match, index, isBlock, isTable } of allMatches) {
      // マッチ前のテキストを追加
      if (index > lastIndex) {
        const beforeText = processedText.slice(lastIndex, index);
        if (beforeText.trim()) {
          parts.push(beforeText);
        }
      }

      if (isTable) {
        // Markdownテーブルをレンダリング
        const tableData = parseMarkdownTable(match[0]);
        if (tableData) {
          parts.push(
            <TableContainer key={key++} sx={{ margin: '16px 0', width: 'auto', display: 'inline-block' }}>
              <Table size="small" sx={{ 
                minWidth: 'auto',
                border: '2px solid black',
                '& .MuiTableCell-root': {
                  border: '1px solid black',
                  padding: '8px 12px'
                }
              }}>
                <TableHead>
                  <TableRow>
                    {tableData.headers.map((header, idx) => (
                      <TableCell key={idx} sx={{ 
                        fontWeight: 'bold', 
                        backgroundColor: 'white',
                        border: '1px solid black'
                      }}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableData.rows.map((row, rowIdx) => (
                    <TableRow key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <TableCell key={cellIdx} sx={{ 
                          border: '1px solid black',
                          backgroundColor: 'white'
                        }}>
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          );
        } else {
          parts.push(match[0]);
        }
      } else {
        // 数式をレンダリング
        const mathContent = match[1];
        try {
          if (isBlock) {
            parts.push(<BlockMath key={key++} math={mathContent} />);
          } else {
            parts.push(<InlineMath key={key++} math={mathContent} />);
          }
        } catch (error) {
          // KaTeXエラーの場合は元のテキストを表示
          parts.push(match[0]);
        }
      }

      lastIndex = index + match[0].length;
    }

    // 残りのテキストを追加
    if (lastIndex < processedText.length) {
      const remainingText = processedText.slice(lastIndex);
      if (remainingText.trim()) {
        parts.push(remainingText);
      }
    }

    // 画像警告を最初に追加
    const finalParts = [...imageWarnings, ...parts];
    
    return finalParts.length > 0 ? finalParts : (processedText.trim() || inputText);
  };

  const renderedContent = renderContent(text);

  if (Array.isArray(renderedContent)) {
    return (
      <div>
        {renderedContent.map((part, index) => 
          typeof part === 'string' ? (
            <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>
          ) : (
            part
          )
        )}
      </div>
    );
  }

  return <span style={{ whiteSpace: 'pre-wrap' }}>{renderedContent}</span>;
}