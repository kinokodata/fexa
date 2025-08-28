'use client';

import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathRendererProps {
  text: string;
}

export default function MathRenderer({ text }: MathRendererProps) {
  // LaTeX数式を検出してレンダリングする
  const renderMath = (inputText: string) => {
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let key = 0;

    // インライン数式 $...$ の検出
    const inlineMatches = Array.from(inputText.matchAll(/\$([^$]+)\$/g));
    
    // ブロック数式 $$...$$ の検出
    const blockMatches = Array.from(inputText.matchAll(/\$\$([^$]+)\$\$/g));

    // すべてのマッチをインデックス順にソート
    const allMatches = [...inlineMatches, ...blockMatches]
      .map(match => ({
        match,
        index: match.index!,
        isBlock: match[0].startsWith('$$')
      }))
      .sort((a, b) => a.index - b.index);

    for (const { match, index, isBlock } of allMatches) {
      // マッチ前のテキストを追加
      if (index > lastIndex) {
        parts.push(inputText.slice(lastIndex, index));
      }

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

      lastIndex = index + match[0].length;
    }

    // 残りのテキストを追加
    if (lastIndex < inputText.length) {
      parts.push(inputText.slice(lastIndex));
    }

    return parts.length > 1 ? parts : inputText;
  };

  const renderedContent = renderMath(text);

  if (Array.isArray(renderedContent)) {
    return (
      <span>
        {renderedContent.map((part, index) => 
          typeof part === 'string' ? (
            <span key={index}>{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  }

  return <span>{renderedContent}</span>;
}