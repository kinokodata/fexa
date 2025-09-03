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
    const lines = tableText.trim().split('\n').filter(line => line.trim());
    if (lines.length < 2) return null;

    // ヘッダー行とデータ行を分ける
    const headerLine = lines[0];
    const separatorLine = lines[1];
    const dataLines = lines.slice(2);

    // セパレータ行がテーブル形式かチェック
    if (!separatorLine.includes('|') || !separatorLine.match(/[-|:\s]+/)) {
      return null;
    }

    // ヘッダーをパース（先頭と末尾の空文字列も除去）
    const headers = headerLine.split('|')
      .map(cell => cell.trim())
      .filter((cell, index, array) => {
        // 先頭と末尾の空セルを除去（Markdownテーブルの | で始まり | で終わる形式対応）
        return !(cell === '' && (index === 0 || index === array.length - 1));
      });
    
    // データ行をパース
    const rows = dataLines.map(line => {
      const cells = line.split('|')
        .map(cell => cell.trim())
        .filter((cell, index, array) => {
          // 先頭と末尾の空セルを除去
          return !(cell === '' && (index === 0 || index === array.length - 1));
        });
      return cells;
    }).filter(row => row.length > 0);

    if (headers.length === 0) return null;

    return { headers, rows };
  };

  // 強調表現のみを処理する軽量関数
  const parseEmphasis = (text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let key = 0;

    // 太字と斜体の検出
    const boldMatches = Array.from(text.matchAll(/\*\*([^*]+)\*\*/g));
    const italicMatches = Array.from(text.matchAll(/(?<!\*)\*([^*]+)\*(?!\*)/g));

    const allMatches = [...boldMatches, ...italicMatches]
      .map(match => ({
        match,
        index: match.index!,
        isBold: match[0].startsWith('**') && match[0].endsWith('**'),
        isItalic: match[0].startsWith('*') && match[0].endsWith('*') && !match[0].startsWith('**')
      }))
      .sort((a, b) => a.index - b.index);

    for (const { match, index, isBold, isItalic } of allMatches) {
      // マッチ前のテキストを追加
      if (index > lastIndex) {
        const beforeText = text.slice(lastIndex, index);
        if (beforeText) {
          parts.push(beforeText);
        }
      }

      if (isBold) {
        parts.push(<strong key={key++}>{match[1]}</strong>);
      } else if (isItalic) {
        parts.push(<em key={key++}>{match[1]}</em>);
      }

      lastIndex = index + match[0].length;
    }

    // 残りのテキストを追加
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText) {
        parts.push(remainingText);
      }
    }

    return parts.length > 0 ? parts : [text];
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
    // より柔軟なMarkdownテーブルの検出：| で区切られた行が連続するもの
    const tableMatches = Array.from(processedText.matchAll(/(?:^\s*\|.*?\|\s*\n){2,}/gm));
    const inlineMatches = Array.from(processedText.matchAll(/\$([^$]+)\$/g));
    const blockMatches = Array.from(processedText.matchAll(/\$\$([^$]+)\$\$/g));

    // リスト項目の検出
    const listMatches = Array.from(processedText.matchAll(/^[\s]*[-*]\s+(.+)$/gm));
    
    // 強調表現の検出
    const boldMatches = Array.from(processedText.matchAll(/\*\*([^*]+)\*\*/g));
    const italicMatches = Array.from(processedText.matchAll(/(?<!\*)\*([^*]+)\*(?!\*)/g));

    // 数式、テーブル、リスト、強調表現マッチをインデックス順にソート
    const allMatches = [...tableMatches, ...inlineMatches, ...blockMatches, ...listMatches, ...boldMatches, ...italicMatches]
      .map(match => ({
        match,
        index: match.index!,
        isBlock: match[0].startsWith('$$'),
        isTable: match[0].includes('|') && match[0].split('\n').filter(line => line.includes('|')).length >= 2,
        isList: match[0].match(/^[\s]*[-*]\s+/),
        isBold: match[0].startsWith('**') && match[0].endsWith('**'),
        isItalic: match[0].startsWith('*') && match[0].endsWith('*') && !match[0].startsWith('**'),
        isImage: false  // 画像は既に処理済み
      }))
      .sort((a, b) => a.index - b.index);

    for (const { match, index, isBlock, isTable, isList, isBold, isItalic } of allMatches) {
      // マッチ前のテキストを追加
      if (index > lastIndex) {
        const beforeText = processedText.slice(lastIndex, index);
        if (beforeText.trim()) {
          // 改行を<br>に変換し、強調表現もパース
          const lines = beforeText.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (i > 0) {
              parts.push(<br key={`br-${key++}`} />);
            }
            if (lines[i].trim()) {
              const emphasizedParts = parseEmphasis(lines[i]);
              parts.push(...emphasizedParts);
            }
          }
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
      } else if (isList) {
        // リスト項目をレンダリング（強調表現をパース）
        const listContent = match[1];
        const parsedListContent = parseEmphasis(listContent);
        parts.push(
          <Box key={key++} component="div" sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <Box component="span" sx={{ mr: 1 }}>•</Box>
            <Box component="span">
              {parsedListContent.map((part, i) => 
                typeof part === 'string' ? (
                  <span key={i}>{part}</span>
                ) : (
                  part
                )
              )}
            </Box>
          </Box>
        );
      } else if (isBold) {
        // 太字をレンダリング
        const boldContent = match[1];
        parts.push(<strong key={key++}>{boldContent}</strong>);
      } else if (isItalic) {
        // 斜体をレンダリング
        const italicContent = match[1];
        parts.push(<em key={key++}>{italicContent}</em>);
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
        // 改行を<br>に変換し、強調表現もパース
        const lines = remainingText.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) {
            parts.push(<br key={`br-${key++}`} />);
          }
          if (lines[i].trim()) {
            const emphasizedParts = parseEmphasis(lines[i]);
            parts.push(...emphasizedParts);
          }
        }
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

  // 単純な文字列の場合も改行と強調表現を処理
  if (typeof renderedContent === 'string') {
    const lines = renderedContent.split('\n');
    const processedParts: (string | JSX.Element)[] = [];
    let key = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) {
        processedParts.push(<br key={`br-${key++}`} />);
      }
      if (lines[i].trim()) {
        const emphasizedParts = parseEmphasis(lines[i]);
        processedParts.push(...emphasizedParts);
      }
    }
    
    return (
      <div>
        {processedParts.map((part, index) => 
          typeof part === 'string' ? (
            <span key={index}>{part}</span>
          ) : (
            part
          )
        )}
      </div>
    );
  }
  
  return <span style={{ whiteSpace: 'pre-wrap' }}>{renderedContent}</span>;
}