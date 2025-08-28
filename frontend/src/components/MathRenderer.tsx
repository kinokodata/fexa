'use client';

import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

interface MathRendererProps {
  text: string;
}

export default function MathRenderer({ text }: MathRendererProps) {
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

    // Markdownテーブルの検出（複数行にまたがる）
    const tableMatches = Array.from(inputText.matchAll(/(\|[^\n]+\|\n\|[-:| ]+\|\n(?:\|[^\n]+\|\n?)+)/gm));
    
    // インライン数式 $...$ の検出
    const inlineMatches = Array.from(inputText.matchAll(/\$([^$]+)\$/g));
    
    // ブロック数式 $$...$$ の検出
    const blockMatches = Array.from(inputText.matchAll(/\$\$([^$]+)\$\$/g));

    // すべてのマッチをインデックス順にソート
    const allMatches = [...tableMatches, ...inlineMatches, ...blockMatches]
      .map(match => ({
        match,
        index: match.index!,
        isBlock: match[0].startsWith('$$'),
        isTable: match[0].includes('|') && match[0].includes('\n')
      }))
      .sort((a, b) => a.index - b.index);

    for (const { match, index, isBlock, isTable } of allMatches) {
      // マッチ前のテキストを追加
      if (index > lastIndex) {
        const beforeText = inputText.slice(lastIndex, index);
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
    if (lastIndex < inputText.length) {
      parts.push(inputText.slice(lastIndex));
    }

    return parts.length > 1 ? parts : inputText;
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