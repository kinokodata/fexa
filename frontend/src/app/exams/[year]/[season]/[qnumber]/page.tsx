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
import Modal from '@mui/material/Modal';
import Fab from '@mui/material/Fab';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Collapse from '@mui/material/Collapse';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MenuIcon from '@mui/icons-material/Menu';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import Toolbar from '@mui/material/Toolbar';
import MarkdownRenderer from '../../../../../components/MarkdownRenderer';
import MathRenderer from '../../../../../components/MathRenderer';
import ImageUpload from '../../../../../components/ImageUpload';
import QuestionFeatures from '../../../../../components/QuestionFeatures';
import QuestionSidebar from '../../../../../components/QuestionSidebar';
import { useFilter } from '../../../../../contexts/FilterContext';

interface Choice {
  id: string;
  choice_label: string;
  choice_text: string;
  has_image?: boolean;
  is_correct?: boolean;
  choice_images?: {
    id: string;
    image_url: string;
    caption?: string;
  }[];
  images?: {
    id: string;
    image_url: string;
    caption?: string;
  }[];
}

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  has_image?: boolean;
  has_choice_table?: boolean;  // 選択肢が表形式かどうか
  choice_table_type?: 'markdown' | 'image';  // 表の種類
  choice_table_markdown?: string;  // 表のMarkdownテキスト
  question_images?: {
    id: string;
    image_url: string;
    caption?: string;
  }[];
  choices: Choice[];
  category?: {
    name: string;
  };
  explanation?: string;
  is_checked?: boolean;
  checked_at?: string;
  checked_by?: string;
}

export default function QuestionDetail() {
  const router = useRouter();
  const params = useParams();
  const { year, season, qnumber } = params;
  
  // qnumberから数値部分を抽出
  const number = qnumber ? qnumber.toString().replace('q', '') : '';
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [uploadModal, setUploadModal] = useState<{open: boolean, questionId: string, choiceId: string, choiceLabel: string}>({open: false, questionId: '', choiceId: '', choiceLabel: ''});
  const [checkingQuestion, setCheckingQuestion] = useState(false);
  const [editingCorrectAnswer, setEditingCorrectAnswer] = useState(false);
  const [selectedCorrectAnswerId, setSelectedCorrectAnswerId] = useState<string | null>(null);
  const [updatingCorrectAnswer, setUpdatingCorrectAnswer] = useState(false);
  const [questionTextModal, setQuestionTextModal] = useState<{open: boolean, text: string}>({open: false, text: ''});
  const [updatingQuestionText, setUpdatingQuestionText] = useState(false);
  const [explanationModal, setExplanationModal] = useState<{open: boolean, text: string}>({open: false, text: ''});
  const [updatingExplanation, setUpdatingExplanation] = useState(false);
  
  // フィルター状態をコンテキストから取得
  const { filters, toggleFilter } = useFilter();
  
  // チェックエリア関連の状態
  const [checkAreaOpen, setCheckAreaOpen] = useState(true);  // デフォルトで表示
  const [checkAreaExpanded, setCheckAreaExpanded] = useState(false);
  const [checkList, setCheckList] = useState({
    questionNumber: false,
    questionContent: false,
    choiceA: false,
    choiceI: false,
    choiceU: false,
    choiceE: false,
    correctAnswer: false,
    appropriateExplanation: false,
    other: false
  });

  const seasonJapanese = season === 'spring' ? '春期' : season === 'autumn' ? '秋期' : '';
  const questionNumber = parseInt(number as string);
  const drawerWidth = 450;  // チェックリストの幅をさらに拡張

  useEffect(() => {
    if (year && season && number) {
      fetchQuestions();
    }
  }, [year, season, number]);

  // 問題が変わったときにチェックリストをリセット
  useEffect(() => {
    setCheckList({
      questionNumber: false,
      questionContent: false,
      choiceA: false,
      choiceI: false,
      choiceU: false,
      choiceE: false,
      correctAnswer: false,
      appropriateExplanation: false,
      other: false
    });
    // 問題が変わってもチェックエリアは表示したまま
    setCheckAreaExpanded(false);
  }, [questionNumber]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { default: apiClient } = await import('../../../../../services/api');
      
      // パラメータの型を安全に処理
      const yearStr = Array.isArray(year) ? year[0] : year;
      const seasonStr = Array.isArray(season) ? season[0] : season;
      
      const data = await apiClient.getQuestions({
        year: parseInt(yearStr),
        season: seasonStr,
        limit: 100
      });
      
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

  const openUploadModal = (questionId: string, choiceId: string, choiceLabel: string) => {
    setUploadModal({open: true, questionId, choiceId, choiceLabel});
  };

  const closeUploadModal = () => {
    setUploadModal({open: false, questionId: '', choiceId: '', choiceLabel: ''});
  };

  const handleUpdateCorrectAnswer = async () => {
    if (!question?.id || !selectedCorrectAnswerId || updatingCorrectAnswer) return;
    
    try {
      setUpdatingCorrectAnswer(true);
      const { default: apiClient } = await import('../../../../../services/api');
      const result = await apiClient.updateCorrectAnswer(question.id, selectedCorrectAnswerId);
      
      if (result.success) {
        // 問題データを更新
        setQuestion(prev => {
          if (!prev) return null;
          return {
            ...prev,
            choices: prev.choices.map(c => ({
              ...c,
              is_correct: c.id === selectedCorrectAnswerId
            }))
          };
        });
        
        // 問題一覧も更新
        setQuestions(prev => prev.map(q => {
          if (q.id === question.id) {
            return {
              ...q,
              choices: q.choices.map(c => ({
                ...c,
                is_correct: c.id === selectedCorrectAnswerId
              }))
            };
          }
          return q;
        }));
        
        setEditingCorrectAnswer(false);
        setSelectedCorrectAnswerId(null);
        setError(null);
      } else {
        setError('正答の更新に失敗しました');
      }
    } catch (error) {
      console.error('正答更新エラー:', error);
      setError('正答の更新中にエラーが発生しました');
    } finally {
      setUpdatingCorrectAnswer(false);
    }
  };

  const handleStartEditingCorrectAnswer = () => {
    setEditingCorrectAnswer(true);
    // 現在の正答を初期選択状態にする
    const currentCorrectChoice = question?.choices.find(c => c.is_correct === true);
    if (currentCorrectChoice) {
      setSelectedCorrectAnswerId(currentCorrectChoice.id);
    }
  };

  const handleCancelEditingCorrectAnswer = () => {
    setEditingCorrectAnswer(false);
    setSelectedCorrectAnswerId(null);
  };

  const handleOpenQuestionTextModal = () => {
    if (question?.question_text) {
      setQuestionTextModal({
        open: true,
        text: question.question_text
      });
    }
  };

  const handleCloseQuestionTextModal = () => {
    setQuestionTextModal({open: false, text: ''});
  };

  const handleUpdateQuestionText = async () => {
    if (!question?.id || !questionTextModal.text.trim() || updatingQuestionText) return;
    
    try {
      setUpdatingQuestionText(true);
      const { default: apiClient } = await import('../../../../../services/api');
      const result = await apiClient.updateQuestionText(question.id, questionTextModal.text.trim());
      
      if (result.success) {
        // 問題データを更新
        setQuestion(prev => prev ? {
          ...prev,
          question_text: questionTextModal.text.trim()
        } : null);
        
        // 問題一覧も更新
        setQuestions(prev => prev.map(q => 
          q.id === question.id 
            ? { ...q, question_text: questionTextModal.text.trim() }
            : q
        ));
        
        handleCloseQuestionTextModal();
        setError(null);
      } else {
        setError('問題文の更新に失敗しました');
      }
    } catch (error) {
      console.error('問題文更新エラー:', error);
      setError('問題文の更新中にエラーが発生しました');
    } finally {
      setUpdatingQuestionText(false);
    }
  };

  const handleOpenExplanationModal = () => {
    setExplanationModal({
      open: true,
      text: question?.explanation || ''
    });
  };

  const handleCloseExplanationModal = () => {
    setExplanationModal({open: false, text: ''});
  };

  const handleUpdateExplanation = async () => {
    if (!question?.id || updatingExplanation) return;
    
    try {
      setUpdatingExplanation(true);
      const { default: apiClient } = await import('../../../../../services/api');
      const result = await apiClient.updateExplanation(question.id, explanationModal.text);
      
      if (result.success) {
        // 問題データを更新
        setQuestion(prev => prev ? {
          ...prev,
          explanation: explanationModal.text
        } : null);
        
        // 問題一覧も更新
        setQuestions(prev => prev.map(q => 
          q.id === question.id 
            ? { ...q, explanation: explanationModal.text }
            : q
        ));
        
        handleCloseExplanationModal();
        setError(null);
      } else {
        setError('解説の更新に失敗しました');
      }
    } catch (error) {
      console.error('解説更新エラー:', error);
      setError('解説の更新中にエラーが発生しました');
    } finally {
      setUpdatingExplanation(false);
    }
  };

  // チェックエリア関連の関数
  const handleCheckChange = (key: keyof typeof checkList) => {
    setCheckList(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 未登録の画像があるかチェック（任意の問題）
  const hasUnregisteredImagesForQuestion = (q?: Question) => {
    const targetQuestion = q || question;
    if (!targetQuestion) return false;
    
    // 問題画像のチェック
    if (targetQuestion.has_image && (!targetQuestion.question_images || targetQuestion.question_images.length === 0)) {
      return true;
    }
    
    // 選択肢画像のチェック
    for (const choice of targetQuestion.choices) {
      if (choice.has_image) {
        const images = choice.images || (choice as any).choice_images || [];
        if (images.length === 0) {
          return true;
        }
      }
    }
    
    return false;
  };

  // 現在の問題の未登録画像チェック
  const hasUnregisteredImages = () => hasUnregisteredImagesForQuestion();

  const isAllChecked = () => {
    const allItemsChecked = Object.values(checkList).every(checked => checked);
    const noUnregisteredImages = !hasUnregisteredImages();
    return allItemsChecked && noUnregisteredImages;
  };

  const handleCheckComplete = async () => {
    if (!isAllChecked() || !question?.id) return;
    
    try {
      setCheckingQuestion(true);
      const { getUserEmail } = await import('../../../../../lib/auth');
      const userEmail = getUserEmail() || 'unknown@example.com';
      
      const { default: apiClient } = await import('../../../../../services/api');
      const result = await apiClient.markQuestionAsChecked(question.id, userEmail);
      
      if (result.success) {
        // 問題データを更新
        setQuestion(prev => prev ? {
          ...prev,
          is_checked: true,
          checked_at: result.data?.checked_at || new Date().toISOString(),
          checked_by: result.data?.checked_by || userEmail
        } : null);
        
        // 問題一覧も更新
        setQuestions(prev => prev.map(q => 
          q.id === question.id 
            ? { ...q, is_checked: true, checked_at: result.data?.checked_at, checked_by: result.data?.checked_by }
            : q
        ));
        
        // 成功時の処理
        setCheckAreaExpanded(false);
        console.log('チェック完了:', question.id);
      } else {
        setError('チェック完了の更新に失敗しました');
      }
    } catch (error) {
      console.error('チェック完了の送信に失敗:', error);
      setError('チェック完了の更新中にエラーが発生しました');
    } finally {
      setCheckingQuestion(false);
    }
  };

  // 再チェック用の関数
  const handleReCheck = () => {
    // チェックリストをリセット
    setCheckList({
      questionNumber: false,
      questionContent: false,
      choiceA: false,
      choiceI: false,
      choiceU: false,
      choiceE: false,
      correctAnswer: false,
      appropriateExplanation: false,
      other: false,
    });
    // チェック完了状態をリセット（ローカルのみ）
    if (question) {
      setQuestion(prev => prev ? {
        ...prev,
        is_checked: false,
        checked_at: undefined,
        checked_by: undefined
      } : null);
    }
    // チェックエリアを展開状態で表示
    setCheckAreaExpanded(true);
    setCheckAreaOpen(true);
  };


  const renderChoice = (choice: Choice) => {
    // choice_imagesをimagesとしても使えるようにする
    const images = choice.images || (choice as any).choice_images || [];
    
    // choice_textから画像マークダウンを除去
    const cleanChoiceText = choice.choice_text 
      ? choice.choice_text
          .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '')  // 標準形式 ![alt](url)
          .replace(/\[画像:\s*([^\]]*)\]\(([^)]+)\)/g, '')  // カスタム形式 [画像: alt](url)
          .trim()
      : '';

    if (choice.has_image) {
      return (
        <Box>
          {images && images.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* アップロード済みの画像を表示 */}
              {images.map((image: any) => (
                <Box key={image.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    backgroundColor: 'grey.50',
                    borderRadius: 1,
                    p: 2
                  }}>
                    <img 
                      src={image.image_url} 
                      alt={image.caption || `${choice.choice_label}の画像`}
                      style={{
                        maxWidth: '400px',
                        maxHeight: '300px',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                  </Box>
                  <IconButton
                    onClick={() => openUploadModal(question?.id || '', choice.id, choice.choice_label)}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      boxShadow: 2,
                      '&:hover': {
                        backgroundColor: 'primary.dark'
                      }
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
              ))}
              {/* 画像の説明テキスト */}
              {cleanChoiceText && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <MathRenderer 
                    text={cleanChoiceText}
                    hasImages={images && images.length > 0}
                    shouldShowImages={false}  // 画像はすでに表示済みなので警告ボックスは不要
                  />
                </Typography>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Alert 
                severity="warning"
                iconMapping={{
                  warning: <WarningAmberIcon sx={{ fontSize: 40 }} />
                }}
                sx={{ 
                  margin: '16px 0',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  flex: 1,
                  '& .MuiAlert-icon': {
                    fontSize: '40px',
                    marginRight: '28px'
                  }
                }}
              >
                <Box>
                  <strong>画像をアップロードしてください</strong>
                  <br />
                  選択肢: {choice.choice_label}
                  {choice.choice_text && (
                    <>
                      <br />
                      内容: {choice.choice_text}
                    </>
                  )}
                </Box>
              </Alert>
              <IconButton
                onClick={() => openUploadModal(question?.id || '', choice.id, choice.choice_label)}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  }
                }}
              >
                <EditIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      );
    }

    return (
      <Typography variant="body1">
        <MathRenderer 
          text={cleanChoiceText || choice.choice_text}
          hasImages={choice.has_image && images && images.length > 0}
          shouldShowImages={choice.has_image} 
        />
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


  return (
    <Box sx={{ display: 'flex' }}>
      {/* 共通サイドバーコンポーネント */}
      <QuestionSidebar
        questions={questions}
        filters={filters}
        onFilterChange={toggleFilter}
        onQuestionClick={handleQuestionClick}
        currentQuestionNumber={questionNumber}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        drawerWidth={drawerWidth}
      />

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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              問題文
            </Typography>
            <Button
              startIcon={<EditIcon />}
              onClick={handleOpenQuestionTextModal}
              variant="outlined"
              size="small"
            >
              問題文を修正
            </Button>
          </Box>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
            <>
              <MathRenderer 
                text={question.question_text}
                hasImages={question.has_image && question.question_images && question.question_images.length > 0}
                shouldShowImages={false}  // 問題文では警告ボックスを表示しない
              />
              {/* 画像が実際に存在する場合のみimgタグを表示 */}
              {question.has_image && question.question_images && question.question_images.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {question.question_images.map((image: any, index: number) => (
                    <img 
                      key={index}
                      src={image.image_url} 
                      alt="問題画像" 
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  ))}
                </Box>
              )}
              
              {/* 問題画像がない場合の警告ボックス */}
              {question.has_image && (!question.question_images || question.question_images.length === 0) && (
                <Alert 
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
                    推奨ファイル名: 問題画像
                  </Box>
                </Alert>
              )}
            </>
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {question.has_image && question.question_images && question.question_images.length > 0 
                ? '画像を変更' 
                : '画像をアップロード'}
            </Typography>
            <IconButton
              onClick={() => openUploadModal(question.id, 'question', '問題文')}
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark'
                }
              }}
            >
              <EditIcon />
            </IconButton>
          </Box>
        </Paper>

        {/* 選択肢 */}
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              選択肢
            </Typography>
            {!editingCorrectAnswer ? (
              <Button
                startIcon={<EditIcon />}
                onClick={handleStartEditingCorrectAnswer}
                variant="outlined"
                size="small"
              >
                正答を修正
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={handleUpdateCorrectAnswer}
                  variant="contained"
                  size="small"
                  color="primary"
                  disabled={
                    !selectedCorrectAnswerId || 
                    updatingCorrectAnswer ||
                    selectedCorrectAnswerId === question?.choices.find(c => c.is_correct === true)?.id
                  }
                >
                  {updatingCorrectAnswer ? '更新中...' : '更新'}
                </Button>
                <Button
                  onClick={handleCancelEditingCorrectAnswer}
                  variant="outlined"
                  size="small"
                  color="secondary"
                >
                  キャンセル
                </Button>
              </Box>
            )}
          </Box>
          
          {editingCorrectAnswer && (
            <Alert severity="info" sx={{ mb: 2 }}>
              ラジオボタンをクリックして正答を選択し、更新ボタンを押してください
            </Alert>
          )}
          
          {/* 選択肢の表 */}
          {question.has_choice_table && (
            <Box sx={{ mb: 3 }}>
              {question.choice_table_type === 'markdown' && question.choice_table_markdown ? (
                <MathRenderer text={question.choice_table_markdown} />
              ) : question.choice_table_type === 'image' ? (
                <Typography color="text.secondary">
                  選択肢の表画像が表示されます（未実装）
                </Typography>
              ) : (
                // 古い形式の表データがある場合の表示（後方互換性）
                question.choices.some(choice => 
                  (choice as any).is_table_format || 
                  (choice as any).table_headers || 
                  (choice as any).table_data
                ) && (
                  <Box>
                    {question.choices.map((choice) => {
                      const legacyChoice = choice as any;
                      if (legacyChoice.is_table_format && (legacyChoice.table_headers || legacyChoice.table_data)) {
                        let tableMarkdown = '';
                        if (legacyChoice.table_headers && legacyChoice.table_data) {
                          const headers = Array.isArray(legacyChoice.table_headers) 
                            ? legacyChoice.table_headers 
                            : JSON.parse(legacyChoice.table_headers || '[]');
                          const data = Array.isArray(legacyChoice.table_data) 
                            ? legacyChoice.table_data 
                            : JSON.parse(legacyChoice.table_data || '[]');
                          
                          if (headers.length > 0) {
                            tableMarkdown = `| ${headers.join(' | ')} |\n`;
                            tableMarkdown += `| ${headers.map(() => '---').join(' | ')} |\n`;
                            data.forEach((row: string[]) => {
                              tableMarkdown += `| ${row.join(' | ')} |\n`;
                            });
                          }
                        }
                        
                        return tableMarkdown ? (
                          <Box key={choice.id} sx={{ mb: 2 }}>
                            <MathRenderer text={tableMarkdown} />
                          </Box>
                        ) : null;
                      }
                      return null;
                    })}
                  </Box>
                )
              )}
            </Box>
          )}
          
          <Box sx={{ width: '100%' }}>
            {question.choices.map((choice) => (
              <Box 
                key={choice.id} 
                sx={{ 
                  mb: 3, 
                  border: '1px solid', 
                  borderColor: choice.is_correct === true ? 'success.main' : 'divider', 
                  borderRadius: 1, 
                  p: 2,
                  backgroundColor: choice.is_correct === true ? '#e8f5e8' : 'transparent',
                  position: 'relative'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 2 }}>
                  <Typography variant="body1" component="span" sx={{ fontWeight: 'bold', minWidth: '30px', flexShrink: 0 }}>
                    {choice.choice_label}.
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    {renderChoice(choice)}
                  </Box>
                  {editingCorrectAnswer ? (
                    <IconButton
                      onClick={() => setSelectedCorrectAnswerId(choice.id)}
                      disabled={updatingCorrectAnswer}
                      sx={{ 
                        color: selectedCorrectAnswerId === choice.id ? 'success.main' : 'action.disabled',
                      }}
                    >
                      {selectedCorrectAnswerId === choice.id ? (
                        <RadioButtonCheckedIcon />
                      ) : (
                        <RadioButtonUncheckedIcon />
                      )}
                    </IconButton>
                  ) : (
                    choice.is_correct === true && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        minWidth: '32px',
                        height: '32px',
                        backgroundColor: 'success.main',
                        color: 'white',
                        borderRadius: '50%',
                        fontWeight: 'bold',
                        fontSize: '18px'
                      }}>
                        ✓
                      </Box>
                    )
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* 解説 */}
        <Paper elevation={1} sx={{ p: 3, mb: 4, backgroundColor: '#f8f9fa' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              解説
            </Typography>
            <Button
              startIcon={<EditIcon />}
              onClick={handleOpenExplanationModal}
              variant="outlined"
              size="small"
            >
              {question.explanation ? '解説を修正' : '解説を追加'}
            </Button>
          </Box>
          {question.explanation ? (
            <Box sx={{ mt: 2 }}>
              <MarkdownRenderer 
                hasImages={false}
                shouldShowImages={false}
              >
                {question.explanation}
              </MarkdownRenderer>
            </Box>
          ) : (
            <Box sx={{ mt: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1, textAlign: 'center', color: 'text.secondary' }}>
              解説が登録されていません
            </Box>
          )}
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

        {/* チェックエリア */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: 1200
          }}
        >
          {!checkAreaOpen ? (
            <Fab
              color="primary"
              onClick={() => setCheckAreaOpen(true)}
              sx={{
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}
            >
              <PlaylistAddCheckIcon />
            </Fab>
          ) : (
            <Paper
              elevation={8}
              sx={{
                width: 400,
                maxHeight: checkAreaExpanded ? '80vh' : '200px',
                overflow: 'hidden',
                borderRadius: 2
              }}
            >
              {/* ヘッダー */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PlaylistAddCheckIcon />
                  <Typography variant="h6">チェックリスト</Typography>
                </Box>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => setCheckAreaExpanded(!checkAreaExpanded)}
                    sx={{ color: 'white', mr: 1 }}
                  >
                    {checkAreaExpanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setCheckAreaOpen(false)}
                    sx={{ color: 'white' }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>

              <Collapse in={checkAreaExpanded} timeout={200}>
                {/* チェックリスト内容 */}
                <Box sx={{ p: 2, maxHeight: 'calc(80vh - 100px)', overflow: 'auto' }}>
                  {/* チェック完了状態の表示 */}
                  {question?.is_checked && (
                    <Alert 
                      severity="success"
                      sx={{ 
                        mb: 2,
                        '& .MuiAlert-message': {
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        ✅ チェック完了
                      </Typography>
                      <Typography variant="caption" display="block">
                        完了日時: {question.checked_at ? new Date(question.checked_at).toLocaleString('ja-JP') : '不明'}
                      </Typography>
                      <Typography variant="caption" display="block">
                        チェック者: {question.checked_by || '不明'}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleReCheck}
                        sx={{ 
                          mt: 1, 
                          alignSelf: 'flex-start',
                          borderColor: 'success.main',
                          color: 'success.main',
                          '&:hover': {
                            borderColor: 'success.dark',
                            backgroundColor: 'success.light',
                            color: 'success.dark'
                          }
                        }}
                      >
                        再チェックする
                      </Button>
                    </Alert>
                  )}
                  
                  {/* 未登録画像の警告 */}
                  {hasUnregisteredImages() && (
                    <Alert 
                      severity="warning"
                      sx={{ 
                        mb: 2,
                        '& .MuiAlert-message': {
                          width: '100%'
                        }
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        未登録の画像があります
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                        すべての画像を登録してからチェックを完了してください
                      </Typography>
                    </Alert>
                  )}
                  
                  {/* チェックリスト（チェック完了していない場合のみ表示） */}
                  {!question?.is_checked && (
                    <>
                      <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.questionNumber || false}
                          onChange={() => handleCheckChange('questionNumber')}
                        />
                      }
                      label={`問題番号: 問${question?.question_number || ''}`}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.questionContent || false}
                          onChange={() => handleCheckChange('questionContent')}
                        />
                      }
                      label="問題文の内容（画像や表を含む）"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.choiceA || false}
                          onChange={() => handleCheckChange('choiceA')}
                        />
                      }
                      label="選択肢アの内容（画像や表を含む）"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.choiceI || false}
                          onChange={() => handleCheckChange('choiceI')}
                        />
                      }
                      label="選択肢イの内容（画像や表を含む）"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.choiceU || false}
                          onChange={() => handleCheckChange('choiceU')}
                        />
                      }
                      label="選択肢ウの内容（画像や表を含む）"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.choiceE || false}
                          onChange={() => handleCheckChange('choiceE')}
                        />
                      }
                      label="選択肢エの内容（画像や表を含む）"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.correctAnswer || false}
                          onChange={() => handleCheckChange('correctAnswer')}
                        />
                      }
                      label="正答が正しい"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.appropriateExplanation || false}
                          onChange={() => handleCheckChange('appropriateExplanation')}
                        />
                      }
                      label="解説が適切である"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.other || false}
                          onChange={() => handleCheckChange('other')}
                        />
                      }
                      label="その他違和感がないか"
                    />
                  </FormGroup>

                  {/* チェック完了ボタン */}
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    disabled={!isAllChecked() || checkingQuestion}
                    onClick={handleCheckComplete}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      fontWeight: 'bold'
                    }}
                  >
                    {checkingQuestion ? 'チェック中...' : 'チェック完了'}
                  </Button>
                    </>
                  )}
                </Box>
              </Collapse>

              {!checkAreaExpanded && (
                <Box sx={{ p: 2 }}>
                  {question?.is_checked ? (
                    <>
                      <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ mb: 1 }}>
                        ✅ 問{question?.question_number || ''}チェック完了
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {question.checked_at ? new Date(question.checked_at).toLocaleString('ja-JP') : '完了日時不明'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                        チェック者: {question.checked_by || '不明'}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={handleReCheck}
                        sx={{ 
                          borderColor: 'success.main',
                          color: 'success.main',
                          '&:hover': {
                            borderColor: 'success.dark',
                            backgroundColor: 'success.light'
                          }
                        }}
                      >
                        再チェックする
                      </Button>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        問{question?.question_number || ''}のチェック
                      </Typography>
                  
                  {/* 未登録画像の警告（コンパクト表示） */}
                  {hasUnregisteredImages() && (
                    <Alert 
                      severity="warning"
                      sx={{ 
                        mb: 2,
                        py: 0.5,
                        '& .MuiAlert-message': {
                          fontSize: '0.75rem'
                        }
                      }}
                    >
                      未登録の画像があります
                    </Alert>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="body2">
                      {Object.values(checkList).filter(checked => checked).length} / {Object.keys(checkList).length} 完了
                    </Typography>
                    <Box sx={{ flexGrow: 1 }}>
                      {/* プログレスバー風の表示 */}
                      <Box
                        sx={{
                          height: 4,
                          bgcolor: 'grey.300',
                          borderRadius: 2,
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            bgcolor: isAllChecked() ? 'success.main' : 'primary.main',
                            width: `${(Object.values(checkList).filter(checked => checked).length / Object.keys(checkList).length) * 100}%`,
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    disabled={!isAllChecked() || checkingQuestion}
                    onClick={handleCheckComplete}
                    size="small"
                  >
                    {checkingQuestion ? 'チェック中...' : 'チェック完了'}
                  </Button>
                    </>
                  )}
                </Box>
              )}
            </Paper>
          )}
        </Box>

        {/* 画像アップロードモーダル */}
        <Modal
          open={uploadModal.open}
          onClose={closeUploadModal}
          aria-labelledby="upload-modal-title"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 600 },
              bgcolor: 'background.paper',
              boxShadow: 24,
              borderRadius: 2,
              p: 4,
            }}
          >
            <Typography id="upload-modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
              {uploadModal.choiceLabel}の画像をアップロード
            </Typography>
            <ImageUpload
              questionId={uploadModal.questionId}
              choiceId={uploadModal.choiceId}
              choiceLabel={uploadModal.choiceLabel}
              onImageUploaded={() => {
                // 画像アップロード後はデータを再取得
                fetchQuestions();
                closeUploadModal();
              }}
            />
          </Box>
        </Modal>

        {/* 問題文修正モーダル */}
        <Modal
          open={questionTextModal.open}
          onClose={handleCloseQuestionTextModal}
          aria-labelledby="question-text-modal-title"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '80%', md: '70%' },
              bgcolor: 'background.paper',
              boxShadow: 24,
              borderRadius: 2,
              p: 4,
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <Typography id="question-text-modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
              問題文を修正
            </Typography>
            <TextField
              multiline
              rows={10}
              fullWidth
              variant="outlined"
              label="問題文"
              value={questionTextModal.text}
              onChange={(e) => setQuestionTextModal(prev => ({...prev, text: e.target.value}))}
              sx={{ mb: 3 }}
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCloseQuestionTextModal}
                variant="outlined"
                disabled={updatingQuestionText}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleUpdateQuestionText}
                variant="contained"
                disabled={
                  updatingQuestionText || 
                  !questionTextModal.text.trim() ||
                  questionTextModal.text.trim() === question?.question_text
                }
              >
                {updatingQuestionText ? '更新中...' : '更新'}
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* 解説修正モーダル */}
        <Modal
          open={explanationModal.open}
          onClose={handleCloseExplanationModal}
          aria-labelledby="explanation-modal-title"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '80%', md: '70%' },
              bgcolor: 'background.paper',
              boxShadow: 24,
              borderRadius: 2,
              p: 4,
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <Typography id="explanation-modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
              解説を{question?.explanation ? '修正' : '追加'}
            </Typography>
            <TextField
              multiline
              rows={12}
              fullWidth
              variant="outlined"
              label="解説"
              value={explanationModal.text}
              onChange={(e) => setExplanationModal(prev => ({...prev, text: e.target.value}))}
              placeholder="Markdownで解説を記述してください..."
              sx={{ mb: 3 }}
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCloseExplanationModal}
                variant="outlined"
                disabled={updatingExplanation}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleUpdateExplanation}
                variant="contained"
                disabled={
                  updatingExplanation ||
                  explanationModal.text === (question?.explanation || '')
                }
              >
                {updatingExplanation ? '更新中...' : '更新'}
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
}