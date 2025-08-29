'use client';

import React from 'react';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface Choice {
  id: string;
  choice_label: string;
  choice_text: string;
  has_image?: boolean;
}

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  has_image?: boolean;
  has_choice_table?: boolean;
  choices: Choice[];
  question_images?: any[];
}

interface QuestionFeaturesProps {
  question: Question;
  variant?: 'list' | 'detailed';
  showWarning?: boolean;
}

export default function QuestionFeatures({ question, variant = 'list', showWarning = true }: QuestionFeaturesProps) {
  // 未登録の画像があるかチェック
  const hasUnregisteredImages = () => {
    // 問題画像のチェック
    if (question.has_image && (!question.question_images || question.question_images.length === 0)) {
      return true;
    }
    
    // 選択肢画像のチェック
    for (const choice of question.choices) {
      if (choice.has_image) {
        const images = (choice as any).images || (choice as any).choice_images || [];
        if (images.length === 0) {
          return true;
        }
      }
    }
    
    return false;
  };
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
  
  // 警告アイコンを適切な位置に挿入
  if (showWarning && hasUnregisteredImages()) {
    const warningIcon = (
      <WarningAmberIcon 
        key="warning"
        sx={{ 
          color: 'warning.main', 
          fontSize: 20, 
          ml: 1,
          verticalAlign: 'middle'
        }} 
      />
    );
    
    // 画像関連のチップの前に警告アイコンを挿入
    const result = [];
    let insertedWarning = false;
    
    for (const feature of allFeatures) {
      const label = feature.props?.label;
      if (!insertedWarning && label && (label.includes(':画像'))) {
        result.push(warningIcon);
        insertedWarning = true;
      }
      result.push(feature);
    }
    
    if (!insertedWarning && allFeatures.length > 0) {
      result.push(warningIcon);
    }
    
    return <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>{result}</Box>;
  }
  
  return <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>{allFeatures}</Box>;
}