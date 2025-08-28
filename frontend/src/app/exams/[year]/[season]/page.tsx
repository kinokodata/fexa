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
import Grid from '@mui/material/Grid';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';
import MenuIcon from '@mui/icons-material/Menu';
import QuestionFeatures from '../../../../components/QuestionFeatures';

interface Choice {
  id: string;
  choice_label: string;
  choice_text: string;
  has_image: boolean;
  is_table_format: boolean;
}

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  has_image?: boolean;
  choices: Choice[];
  category?: {
    name: string;
  };
}

export default function ExamQuestions() {
  const router = useRouter();
  const params = useParams();
  const { year, season } = params;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const seasonJapanese = season === 'spring' ? '春期' : season === 'autumn' ? '秋期' : '';
  const drawerWidth = 280;

  useEffect(() => {
    if (year && season) {
      fetchQuestions();
    }
  }, [year, season]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { default: apiClient } = await import('../../../../services/api');
      const result = await apiClient.getQuestions({
        year: parseInt(year),
        season: season,
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
    router.push(`/exams/${year}/${season}/q${questionNumber}`);
    setMobileOpen(false); // モバイルでドロワーを閉じる
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
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

  const drawer = (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        問題一覧
      </Typography>
      <List dense>
        {questions.map((question) => (
          <ListItem key={question.id} disablePadding>
            <ListItemButton 
              onClick={() => handleQuestionClick(question.id, question.question_number)}
              sx={{ 
                borderRadius: 1,
                mb: 0.5,
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
              <ListItemText
                primary={`問${question.question_number}`}
                secondary={<QuestionFeatures question={question} variant="list" />}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Left Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        {/* Mobile Menu Button */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { md: 'none' }, mb: 2 }}
        >
          <MenuIcon />
        </IconButton>

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
                        <Box display="flex" alignItems="center" mt={1}>
                          {question.category && (
                            <Chip 
                              label={question.category.name} 
                              size="small" 
                              variant="outlined"
                              sx={{ mr: 1 }}
                            />
                          )}
                          {question.choices?.length === 4 && (
                            <Typography variant="caption" color="success.main" display="flex" alignItems="center">
                              <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              選択肢完備
                            </Typography>
                          )}
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
      </Box>
    </Box>
  );
}