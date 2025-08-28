'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import FormControl from '@mui/material/FormControl';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import MathRenderer from '../../../../../components/MathRenderer';
import ImageUpload from '../../../../../components/ImageUpload';

interface Choice {
  id: string;
  choice_label: string;
  choice_text: string;
  has_image: boolean;
  is_table_format: boolean;
  table_headers?: string[];
  table_data?: string[][];
}

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  has_image: boolean;
  choices: Choice[];
  category?: {
    name: string;
  };
}

export default function QuestionDetail() {
  const router = useRouter();
  const params = useParams();
  const { year, season, qnumber } = params;
  
  // qnumberから数値部分を抽出
  const number = qnumber ? qnumber.toString().replace('q', '') : '';
  
  // パラメータをログ出力
  console.log('URL params:', { year, season, qnumber, number, params });
  const [question, setQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const seasonJapanese = season === 'spring' ? '春期' : season === 'autumn' ? '秋期' : '';
  const questionNumber = parseInt(number as string);
  const drawerWidth = 280;

  useEffect(() => {
    if (year && season && number) {
      fetchQuestions();
    }
  }, [year, season, number]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { get } = await import('../../../../../lib/api');
      const response = await get(`http://localhost:43001/api/questions?year=${year}&season=${season}&limit=100`);
      const data = await response.json();
      
      if (data.success) {
        const allQuestions = data.data || [];
        setQuestions(allQuestions);
        
        const currentQuestion = allQuestions.find(q => q.question_number === questionNumber);
        if (currentQuestion) {
          setQuestion(currentQuestion);
        } else {
          setError('問題が見つかりませんでした');
        }
      } else {
        setError('問題の取得に失敗しました');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      if (err instanceof Error && err.name === 'AuthError') {
        // AuthErrorは既にAuthProviderで処理される
        return;
      }
      setError('データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleChoiceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedChoice(event.target.value);
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    const newNumber = direction === 'prev' ? questionNumber - 1 : questionNumber + 1;
    router.push(`/exams/${year}/${season}/q${newNumber}`);
  };

  const handleQuestionClick = (questionId: string, questionNumber: number) => {
    router.push(`/exams/${year}/${season}/q${questionNumber}`);
    setMobileOpen(false);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getChoiceInfo = (choices: Choice[]) => {
    if (!choices || choices.length === 0) {
      return null;
    }

    const hasTable = choices.some(c => c.is_table_format);
    const hasImage = choices.some(c => c.has_image);

    const chips = [];
    if (hasTable) {
      chips.push(
        <Chip 
          key="table"
          icon={<TableChartIcon />} 
          label="表" 
          size="small" 
          color="info"
          sx={{ ml: 1 }}
        />
      );
    }
    if (hasImage) {
      chips.push(
        <Chip 
          key="image"
          icon={<ImageIcon />} 
          label="画像" 
          size="small" 
          color="warning"
          sx={{ ml: 1 }}
        />
      );
    }
    
    return chips;
  };

  const renderChoice = (choice: Choice) => {
    if (choice.is_table_format && Array.isArray(choice.table_headers) && Array.isArray(choice.table_data)) {
      return (
        <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  {choice.table_headers.map((header, index) => (
                    <TableCell key={index} sx={{ fontWeight: 'bold', backgroundColor: 'grey.50' }}>
                      <MathRenderer text={header} />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {choice.table_data.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <MathRenderer text={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
      );
    }

    if (choice.has_image) {
      return (
        <Box>
          <Typography variant="body2" color="text.secondary">
            [画像: {choice.choice_text}]
          </Typography>
          <ImageUpload
            questionId={question?.id || ''}
            choiceId={choice.id}
            choiceLabel={choice.choice_label}
            onImageUploaded={() => {
              // 画像アップロード後の処理（必要に応じて問題を再取得）
              console.log('画像がアップロードされました');
            }}
          />
        </Box>
      );
    }

    return (
      <Typography variant="body1">
        <MathRenderer text={choice.choice_text} />
      </Typography>
    );
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

  if (error || !question) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || '問題が見つかりませんでした'}
        </Alert>
        <Button onClick={() => router.push(`/exams/${year}/${season}`)}>
          問題一覧に戻る
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
          {questions.map((q) => (
            <ListItem key={q.id} disablePadding>
              <ListItemButton 
                onClick={() => handleQuestionClick(q.id, q.question_number)}
                selected={q.question_number === questionNumber}
                sx={{ 
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                <ListItemText
                  primary={`問${q.question_number}`}
                  secondary={getChoiceInfo(q.choices)}
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
          <Link
            underline="hover"
            sx={{ cursor: 'pointer' }}
            color="inherit"
            onClick={() => router.push(`/exams/${year}/${season}`)}
          >
            {year}年 {seasonJapanese}
          </Link>
          <Typography color="text.primary">
            問{question.question_number}
          </Typography>
        </Breadcrumbs>

        {/* ナビゲーションボタン */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Button
            startIcon={<NavigateBeforeIcon />}
            onClick={() => handleNavigation('prev')}
            disabled={questionNumber <= 1}
            variant="outlined"
          >
            前の問題
          </Button>
          
          <Typography variant="h5" component="h1" textAlign="center">
            問{question.question_number}
          </Typography>
          
          <Button
            endIcon={<NavigateNextIcon />}
            onClick={() => handleNavigation('next')}
            variant="outlined"
          >
            次の問題
          </Button>
        </Box>

        {/* カテゴリ */}
        {question.category && (
          <Box mb={2}>
            <Chip 
              label={question.category.name} 
              size="medium" 
              variant="outlined"
              color="primary"
            />
          </Box>
        )}

        {/* 問題文 */}
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
            <MathRenderer text={question.question_text} />
          </Typography>
          {(question.has_image || question.question_text.includes('/images/') || question.question_text.includes('[画像:') || question.question_text.includes('![')) && (
            <Box sx={{ mt: 3 }}>
              <ImageUpload
                questionId={question.id}
                choiceId="question"
                choiceLabel="問題文"
                onImageUploaded={() => {
                  console.log('問題文の画像がアップロードされました');
                }}
              />
            </Box>
          )}
        </Paper>

        {/* 選択肢 */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            選択肢
          </Typography>
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <RadioGroup value={selectedChoice} onChange={handleChoiceChange}>
              {question.choices.map((choice) => (
                <Box key={choice.id} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                  <FormControlLabel
                    value={choice.id}
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 2 }}>
                        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', minWidth: '30px', flexShrink: 0 }}>
                          {choice.choice_label}.
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          {renderChoice(choice)}
                        </Box>
                      </Box>
                    }
                    sx={{ 
                      alignItems: 'flex-start',
                      width: '100%',
                      m: 0
                    }}
                  />
                </Box>
              ))}
            </RadioGroup>
          </FormControl>
        </Paper>

        {/* 問題一覧に戻るボタン */}
        <Box textAlign="center" mt={4}>
          <Button 
            variant="contained" 
            onClick={() => router.push(`/exams/${year}/${season}`)}
            size="large"
          >
            問題一覧に戻る
          </Button>
        </Box>
      </Box>
    </Box>
  );
}