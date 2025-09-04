'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MenuIcon from '@mui/icons-material/Menu';
import QuestionFeatures from '../../../../components/QuestionFeatures';

interface Choice {
  id: string;
  choice_label: string;
  choice_text: string;
  has_image?: boolean;
  is_table_format?: boolean;
}

interface Tag {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  relevance_score: number;
  is_primary: boolean;
}

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  has_image?: boolean;
  has_choice_table?: boolean;
  question_images?: {
    id: string;
    image_url: string;
    caption?: string;
  }[];
  choices: Choice[];
  category?: {
    name: string;
  };
  tags?: Tag[];  // タグ配列を追加
  is_checked?: boolean;
  checked_at?: string;
  checked_by?: string;
}

export default function ExamQuestions() {
  const router = useRouter();
  const params = useParams();
  const { year, season } = params;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const seasonJapanese = season === 'spring' ? '春期' : season === 'autumn' ? '秋期' : season === 'special' ? '特別' : '';

  useEffect(() => {
    if (year && season) {
      fetchQuestions();
    }
  }, [year, season]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { default: apiClient } = await import('../../../../services/api');
      
      // パラメータの型を安全に処理
      const yearStr = Array.isArray(year) ? year[0] : year;
      const seasonStr = Array.isArray(season) ? season[0] : season;
      
      // URL季節パラメータを日本語に変換
      let seasonJP = '';
      if (seasonStr === 'spring') seasonJP = '春期';
      else if (seasonStr === 'autumn') seasonJP = '秋期';  
      else if (seasonStr === 'special') seasonJP = '特別';
      
      const result = await apiClient.getQuestions({
        year: parseInt(yearStr),
        season: seasonJP,
        limit: 100
      });
      
      if (result.success) {
        setQuestions(result.data || []);
      } else {
        setError(result.error?.message || '問題の取得に失敗しました');
      }
    } catch (err) {
      setError('データの取得中にエラーが発生しました');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionClick = (questionId: string, questionNumber: number) => {
    console.log('一覧ページ - クリック:', { questionId, questionNumber, year, season });
    router.push(`/exams/${year}/${season}/q${questionNumber}?id=${questionId}`);
  };



  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => router.push('/')}>
          トップに戻る
        </Button>
      </Container>
    );
  }


  return (
    <>
      {/* コンテンツは共通レイアウト（layout.tsx）内に表示される */}

        {/* パンくずリスト */}
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 3 }}
        >
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            color="inherit"
            onClick={() => router.push('/')}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
            トップ
          </Link>
          <Typography color="text.primary">
            {year}年 {seasonJapanese}
          </Typography>
        </Breadcrumbs>

        {/* ヘッダー */}
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            {year}年 {seasonJapanese} 基本情報技術者試験
          </Typography>
          <Typography variant="body1" color="text.secondary">
            全{questions.length}問
          </Typography>
        </Box>

        {/* 問題リスト */}
        <Paper elevation={1}>
          <List>
            {questions.map((question, index) => (
              <React.Fragment key={question.id}>
                <ListItem disablePadding>
                  <ListItemButton 
                    onClick={() => handleQuestionClick(question.id, question.question_number)}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center">
                          {question.is_checked ? (
                            <CheckCircleIcon 
                              sx={{ 
                                color: 'success.main', 
                                fontSize: 24, 
                                mr: 2,
                                flexShrink: 0
                              }} 
                            />
                          ) : (
                            <CheckCircleOutlineIcon 
                              sx={{ 
                                color: 'action.disabled', 
                                fontSize: 24, 
                                mr: 2,
                                flexShrink: 0
                              }} 
                            />
                          )}
                          <Typography variant="h6" component="span" sx={{ mr: 2, minWidth: '80px' }}>
                            問{question.question_number}
                          </Typography>
                          <Typography 
                            variant="body1" 
                            component="span" 
                            sx={{ 
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {question.question_text?.substring(0, 100)}...
                          </Typography>
                          <QuestionFeatures question={question} variant="list" />
                        </Box>
                      }
                      secondary={
                        <Box display="flex" flexDirection="column" gap={1} mt={1}>
                          <Box display="flex" alignItems="center" flexWrap="wrap" gap={0.5}>
                            {question.category && (
                              <Chip 
                                label={question.category.name} 
                                size="small" 
                                variant="outlined"
                                sx={{ mr: 1 }}
                              />
                            )}
                            {question.tags && question.tags.length > 0 && (
                              question.tags
                                .sort((a, b) => {
                                  // 主要タグを先に、その後は関連度順
                                  if (a.is_primary && !b.is_primary) return -1;
                                  if (!a.is_primary && b.is_primary) return 1;
                                  return b.relevance_score - a.relevance_score;
                                })
                                .slice(0, 3) // 一覧では最大3つまで表示
                                .map((tag) => (
                                  <Chip 
                                    key={tag.id}
                                    label={tag.display_name}
                                    size="small"
                                    variant={tag.is_primary ? "filled" : "outlined"}
                                    sx={{
                                      backgroundColor: tag.is_primary ? '#4caf50' : 'transparent',
                                      color: tag.is_primary ? 'white' : '#4caf50',
                                      borderColor: '#4caf50',
                                      fontSize: '0.7rem',
                                      height: '20px'
                                    }}
                                  />
                                ))
                            )}
                            {question.choices?.length === 4 && (
                              <Typography variant="caption" color="success.main" display="flex" alignItems="center" sx={{ ml: 'auto' }}>
                                <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                選択肢完備
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {index < questions.length - 1 && <Box component="hr" sx={{ m: 0, border: 0, borderTop: 1, borderColor: 'divider' }} />}
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {questions.length === 0 && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary">
              この試験の問題データがありません
            </Typography>
          </Box>
        )}
    </>
  );
}