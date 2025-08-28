'use client';

import React from 'react';
import Chip from '@mui/material/Chip';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';

interface Choice {
  id: string;
  choice_label: string;
  choice_text: string;
  has_image: boolean;
}

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  has_image?: boolean;
  has_choice_table?: boolean;
  choices: Choice[];
}

interface QuestionFeaturesProps {
  question: Question;
  variant?: 'list' | 'detailed';
}

export default function QuestionFeatures({ question, variant = 'list' }: QuestionFeaturesProps) {
  const getChoiceFeatures = (choices: Choice[]) => {
    if (!choices || choices.length === 0) {
      return [];
    }

    const hasImage = choices.some(c => c.has_image);

    const chips = [];
    if (hasImage) {
      chips.push(
        <Chip 
          key="choice-image"
          icon={<ImageIcon />} 
          label="選択肢:画像" 
          size="small" 
          color="warning"
          variant="filled"
          sx={{ ml: 1 }}
        />
      );
    }
    
    return chips;
  };

  const getQuestionFeatures = () => {
    const chips = [];
    
    // Markdown表形式の文字列があるかチェック（|で始まり|で終わる行が複数行）
    const hasMarkdownTable = /\|[^\n]+\|\n\|[-:| ]+\|\n(?:\|[^\n]+\|\n?)+/m.test(question.question_text);
    
    // 問題文に画像が含まれているかチェック
    const hasQuestionImage = question.has_image || 
                            question.question_text.includes('/images/') || 
                            question.question_text.includes('[画像:') || 
                            question.question_text.includes('![');

    // 選択肢表があるかチェック
    if (question.has_choice_table) {
      chips.push(
        <Chip 
          key="choice-table"
          icon={<TableChartIcon />} 
          label="選択肢:表" 
          size="small" 
          color="info"
          variant="outlined"
          sx={{ ml: 1 }}
        />
      );
    }

    if (hasMarkdownTable) {
      chips.push(
        <Chip 
          key="question-table"
          icon={<TableChartIcon />} 
          label="問題文:表" 
          size="small" 
          color="info"
          variant="outlined"
          sx={{ ml: 1 }}
        />
      );
    }

    if (hasQuestionImage) {
      chips.push(
        <Chip 
          key="question-image"
          icon={<ImageIcon />} 
          label="問題文:画像" 
          size="small" 
          color="warning"
          variant="outlined"
          sx={{ ml: 1 }}
        />
      );
    }
    
    return chips;
  };

  const allFeatures = [...getQuestionFeatures(), ...getChoiceFeatures(question.choices)];
  
  return <>{allFeatures}</>;
}