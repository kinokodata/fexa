'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import QuestionFeatures from './QuestionFeatures';

interface Choice {
  id: string;
  choice_label: string;
  choice_text: string;
  has_image: boolean;
  images?: any[];
  choice_images?: any[];
}

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  has_image?: boolean;
  has_choice_table?: boolean;
  choices: Choice[];
  category?: {
    name: string;
  };
  is_checked?: boolean;
  checked_at?: string;
  checked_by?: string;
  question_images?: any[];
}

interface FilterState {
  unchecked: boolean;
  unregisteredImage: boolean;
  questionTable: boolean;
  questionImage: boolean;
  choiceImage: boolean;
  choiceTable: boolean;
}

interface QuestionSidebarProps {
  questions: Question[];
  filters: FilterState;
  onFilterChange: (filterName: keyof FilterState) => void;
  onQuestionClick: (questionId: string, questionNumber: number) => void;
  currentQuestionNumber?: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
  drawerWidth?: number;
}

export default function QuestionSidebar({
  questions,
  filters,
  onFilterChange,
  onQuestionClick,
  currentQuestionNumber,
  mobileOpen,
  onMobileClose,
  drawerWidth = 350
}: QuestionSidebarProps) {
  
  // 未登録の画像があるかチェック
  const hasUnregisteredImages = (question: Question) => {
    // 問題画像のチェック
    if (question.has_image && (!question.question_images || question.question_images.length === 0)) {
      return true;
    }
    
    // 選択肢画像のチェック
    for (const choice of question.choices) {
      if (choice.has_image) {
        const images = choice.images || choice.choice_images || [];
        if (images.length === 0) {
          return true;
        }
      }
    }
    
    return false;
  };

  // フィルターされた問題リストを取得
  const getFilteredQuestions = () => {
    if (!questions || questions.length === 0) return [];
    
    // すべてのフィルターが無効な場合はすべての問題を表示
    const activeFilters = Object.values(filters).some(v => v);
    if (!activeFilters) {
      return questions;
    }
    
    return questions.filter(q => {
      const matches = [];
      
      // 未チェックフィルター（未チェックの問題を表示）
      if (filters.unchecked) {
        matches.push(!q.is_checked);
      }
      
      // 画像未登録フィルター（未登録画像がある問題を表示）
      if (filters.unregisteredImage) {
        matches.push(hasUnregisteredImages(q));
      }
      
      // 問題文に表があるフィルター（表がある問題を表示）
      if (filters.questionTable) {
        const hasQuestionTable = /\|[^\n]+\|\n\|[-:| ]+\|\n(?:\|[^\n]+\|\n?)+/m.test(q.question_text);
        matches.push(hasQuestionTable);
      }
      
      // 問題文に画像があるフィルター（画像がある問題を表示）
      if (filters.questionImage) {
        const hasQuestionImage = q.has_image || 
                                q.question_text.includes('/images/') || 
                                q.question_text.includes('[画像:') || 
                                q.question_text.includes('![');
        matches.push(hasQuestionImage);
      }
      
      // 選択肢に画像があるフィルター（選択肢に画像がある問題を表示）
      if (filters.choiceImage) {
        const hasChoiceImage = q.choices.some(c => c.has_image);
        matches.push(hasChoiceImage);
      }
      
      // 選択肢が表フィルター（表形式選択肢がある問題を表示）
      if (filters.choiceTable) {
        matches.push(q.has_choice_table || false);
      }
      
      // いずれかの条件にマッチすればtrue（OR演算）
      return matches.some(match => match);
    });
  };

  const filteredQuestions = getFilteredQuestions();

  const handleQuestionClick = (questionId: string, questionNumber: number) => {
    onQuestionClick(questionId, questionNumber);
    onMobileClose(); // モバイルでドロワーを閉じる
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="h6" gutterBottom>
          問題一覧
        </Typography>
      </Box>
      
      {/* フィルターエリア */}
      <Accordion 
        disableGutters 
        elevation={0}
        sx={{ 
          '&:before': { display: 'none' },
          backgroundColor: 'transparent'
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ 
            px: 2,
            minHeight: 48,
            '& .MuiAccordionSummary-content': { my: 1 }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon fontSize="small" />
            <Typography variant="body2">
              フィルター ({Object.values(filters).filter(v => v).length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2, py: 1 }}>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={filters.unchecked}
                  onChange={() => onFilterChange('unchecked')}
                />
              }
              label={<Typography variant="body2">未チェック問題</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={filters.unregisteredImage}
                  onChange={() => onFilterChange('unregisteredImage')}
                />
              }
              label={<Typography variant="body2">画像未登録</Typography>}
            />
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              問題文
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={filters.questionTable}
                  onChange={() => onFilterChange('questionTable')}
                />
              }
              label={<Typography variant="body2">表がある</Typography>}
              sx={{ ml: 1 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={filters.questionImage}
                  onChange={() => onFilterChange('questionImage')}
                />
              }
              label={<Typography variant="body2">画像がある</Typography>}
              sx={{ ml: 1 }}
            />
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              選択肢
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={filters.choiceImage}
                  onChange={() => onFilterChange('choiceImage')}
                />
              }
              label={<Typography variant="body2">画像がある</Typography>}
              sx={{ ml: 1 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={filters.choiceTable}
                  onChange={() => onFilterChange('choiceTable')}
                />
              }
              label={<Typography variant="body2">表形式</Typography>}
              sx={{ ml: 1 }}
            />
          </FormGroup>
        </AccordionDetails>
      </Accordion>
      
      <Divider />
      
      {/* 問題リスト */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, pt: 1 }}>
        {filteredQuestions.length > 0 ? (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {filteredQuestions.length} / {questions.length} 問
            </Typography>
            <List dense>
              {filteredQuestions.map((q) => (
                <ListItem key={q.id} disablePadding>
                  <ListItemButton 
                    onClick={() => handleQuestionClick(q.id, q.question_number)}
                    selected={q.question_number === currentQuestionNumber}
                    sx={{ 
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      {q.is_checked ? (
                        <CheckCircleIcon 
                          sx={{ 
                            color: 'success.main', 
                            fontSize: 18, 
                            mr: 1,
                            flexShrink: 0
                          }} 
                        />
                      ) : (
                        <CheckCircleOutlineIcon 
                          sx={{ 
                            color: 'action.disabled', 
                            fontSize: 18, 
                            mr: 1,
                            flexShrink: 0
                          }} 
                        />
                      )}
                      <ListItemText
                        primary={`問${q.question_number}`}
                        secondary={<QuestionFeatures question={q} variant="detailed" />}
                      />
                    </Box>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
            該当する問題がありません
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            marginTop: '64px',
            height: 'calc(100% - 64px)'
          },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            marginTop: '64px',
            height: 'calc(100% - 64px)'
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
}