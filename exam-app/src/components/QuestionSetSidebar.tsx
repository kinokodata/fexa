'use client';

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Typography, 
  Chip, 
  Divider, 
  useTheme, 
  useMediaQuery,
  IconButton
} from '@mui/material';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import CloseIcon from '@mui/icons-material/Close';

interface QuestionSet {
  selectedCategories?: {
    field?: string;
    major?: string;
    medium?: string;
    minor?: string;
  };
  examInfo?: {
    year: number;
    season: string;
  };
  questions: {
    id: string;
    question_number: number;
    exam: {
      year: number;
      season: string;
    };
  }[];
  currentIndex: number;
  createdAt: string;
  totalQuestions: number;
}


interface QuestionSetSidebarProps {
  open: boolean;
  onClose?: () => void;
  variant?: 'temporary' | 'persistent';
  currentQuestionId?: string;
}

const DRAWER_WIDTH = 280;

export function QuestionSetSidebar({ 
  open, 
  onClose, 
  variant = 'persistent', 
  currentQuestionId 
}: QuestionSetSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [categoryInfo, setCategoryInfo] = useState<any>(null);

  // APIから問題セットを読み込み
  useEffect(() => {
    const loadQuestionSet = async () => {
      try {
        const result = await (await import('../services/api')).default.getQuestionSet();
        
        if (result.success && result.data) {
          setQuestionSet(result.data.questionSet);
          console.log('QuestionSet API - Load successful:', result.data.questionSet);
        } else {
          console.error('QuestionSet API - Load failed:', result.error);
          setQuestionSet(null);
        }
      } catch (error) {
        console.error('QuestionSet API - Load error:', error);
        setQuestionSet(null);
      }
    };

    loadQuestionSet();
    
    // ページフォーカス時に再読み込み（ブラウザタブ切り替え時など）
    const handleFocus = () => {
      loadQuestionSet();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);


  // カテゴリパラメータがある場合のみ、カテゴリ情報を取得
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const examinfoParam = searchParams.get('examinfo');
    
    // カテゴリパラメータがある場合のみAPIから詳細情報を取得
    // 試験情報（examinfo）がある場合はCookieの情報のみ使用
    if (categoryParam && !examinfoParam) {
      fetchCategoryInfo(categoryParam);
    } else {
      // examinfo がある場合やパラメータがない場合はcategoryInfoをクリア
      setCategoryInfo(null);
    }
  }, [searchParams]);

  // カテゴリ情報を取得する関数
  const fetchCategoryInfo = async (categoryId: string) => {
    try {
      const apiClient = (await import('../services/api')).default;
      const result = await apiClient.get(`/categories/${categoryId}`);
      if (result.success && result.data) {
        setCategoryInfo(result.data);
        console.log('Category Info:', result.data);
      }
    } catch (error) {
      console.error('Failed to fetch category info:', error);
    }
  };

  // 問題詳細を取得する関数（Cookie内のquestionsを使用）
  const getQuestionInfo = (questionId: string) => {
    return questionSet?.questions?.find(q => q.id === questionId);
  };

  const getCurrentQuestionId = () => {
    if (currentQuestionId) return currentQuestionId;
    const match = pathname.match(/\/questions\/([^\/]+)/);
    return match ? match[1] : null;
  };

  const handleQuestionClick = async (index: number) => {
    if (!questionSet) return;
    
    const questionId = questionSet.questions[index].id;
    
    // URLパラメータを維持（category または examinfo）
    const categoryParam = searchParams.get('category');
    const examinfoParam = searchParams.get('examinfo');
    let queryString = '?hasQuestionSet=true';
    
    if (categoryParam) {
      queryString += `&category=${categoryParam}`;
    } else if (examinfoParam) {
      queryString += `&examinfo=${examinfoParam}`;
    }
    
    try {
      // API経由で現在位置を更新
      const apiClient = (await import('../services/api')).default;
      const result = await apiClient.updateQuestionSetPosition(index);
      
      if (result.success) {
        // ローカル状態も更新
        const updatedSet = {
          ...questionSet,
          currentIndex: index
        };
        setQuestionSet(updatedSet);
        console.log('QuestionSet API - Position update successful:', result.data);
        
        router.push(`/questions/${questionId}${queryString}`);
      } else {
        console.error('QuestionSet API - Position update failed:', result.error);
        // エラーでも遷移は実行
        router.push(`/questions/${questionId}${queryString}`);
      }
    } catch (error) {
      console.error('QuestionSet API - Position update error:', error);
      // エラーでも遷移は実行
      router.push(`/questions/${questionId}${queryString}`);
    }
  };

  const currentId = getCurrentQuestionId();
  const currentIndex = questionSet?.questions.findIndex(q => q.id === currentId) ?? -1;
  
  // タイトル名を取得（試験またはカテゴリ）
  const getTitle = () => {
    const categoryParam = searchParams.get('category');
    const examinfoParam = searchParams.get('examinfo');
    
    // URLパラメータを最優先で判定
    if (categoryParam && categoryInfo) {
      // カテゴリパラメータがある場合：APIから取得したカテゴリ情報を表示
      return categoryInfo.minor_name || 
             categoryInfo.medium_name || 
             categoryInfo.major_name || 
             categoryInfo.field_name || 
             'カテゴリ問題';
    } else if (examinfoParam && questionSet?.examInfo) {
      // 試験パラメータがある場合：試験情報を表示
      const seasonName = questionSet.examInfo.season === 'a' ? '春期' : '秋期';
      return `${questionSet.examInfo.year}年 ${seasonName}午前`;
    } else if (questionSet?.examInfo) {
      // Cookieに試験情報がある場合
      const seasonName = questionSet.examInfo.season === 'a' ? '春期' : '秋期';
      return `${questionSet.examInfo.year}年 ${seasonName}午前`;
    } else {
      // Cookieからのカテゴリベースの場合：最下層のカテゴリ名
      return questionSet?.selectedCategories?.minor || 
             questionSet?.selectedCategories?.medium || 
             questionSet?.selectedCategories?.major || 
             questionSet?.selectedCategories?.field || 
             'カテゴリ問題';
    }
  };

  const title = getTitle();

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="div" noWrap>
            {title}
          </Typography>
          {isMobile && (
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        
        {/* カテゴリ階層表示 */}
        {(questionSet && !questionSet.examInfo) || categoryInfo ? (
          <Box sx={{ mb: 2 }}>
            {/* Cookieからのカテゴリ情報 */}
            {questionSet && !questionSet.examInfo && questionSet.selectedCategories && (
              <>
                {questionSet.selectedCategories.field && (
                  <Chip label={questionSet.selectedCategories.field} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                )}
                {questionSet.selectedCategories.major && (
                  <Chip label={questionSet.selectedCategories.major} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                )}
                {questionSet.selectedCategories.medium && (
                  <Chip label={questionSet.selectedCategories.medium} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                )}
                {questionSet.selectedCategories.minor && (
                  <Chip label={questionSet.selectedCategories.minor} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                )}
              </>
            )}
            {/* URLパラメータからのカテゴリ情報 */}
            {categoryInfo && (
              <>
                {categoryInfo.field_name && (
                  <Chip label={categoryInfo.field_name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                )}
                {categoryInfo.major_name && (
                  <Chip label={categoryInfo.major_name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                )}
                {categoryInfo.medium_name && (
                  <Chip label={categoryInfo.medium_name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                )}
                {categoryInfo.minor_name && (
                  <Chip label={categoryInfo.minor_name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                )}
              </>
            )}
          </Box>
        ) : null}
        
        {questionSet && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {currentIndex + 1} / {questionSet.questions.length}問
          </Typography>
        )}
      </Box>

      <Divider />

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {questionSet ? (
          <List dense>
            {questionSet.questions.map((question: {
              id: string;
              question_number: number;
              exam: {
                year: number;
                season: string;
              };
            }, index) => {
              // Cookieから問題詳細を取得
              const questionInfo = question;
              
              return (
                <ListItem key={question.id} disablePadding>
                  <ListItemButton
                    selected={currentIndex === index}
                    onClick={() => handleQuestionClick(index)}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                        '& .MuiListItemText-secondary': {
                          color: 'primary.contrastText',
                          opacity: 0.8,
                        },
                      },
                    }}
                  >
                    <ListItemText
                      primary={`問題 ${index + 1}`}
                      secondary={`H${questionInfo.exam.year.toString().slice(-2)}-${questionInfo.exam.season === 'a' ? 'S' : 'H'}-${questionInfo.question_number}`}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: currentIndex === index ? 'bold' : 'normal'
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              問題セットが読み込まれていません
            </Typography>
          </Box>
        )}
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {questionSet?.examInfo ? '試験問題演習' : 'カテゴリ別問題演習'}
        </Typography>
        {questionSet && (
          <Typography variant="caption" color="text.secondary">
            作成日: {new Date(questionSet.createdAt).toLocaleDateString()}
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant === 'temporary' || isMobile ? "temporary" : "persistent"}
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={(variant === 'temporary' || isMobile) ? {
        keepMounted: true,
      } : undefined}
      sx={{
        width: open && !(variant === 'temporary' || isMobile) ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          top: `calc(${theme.mixins.toolbar.minHeight}px + 16px)`,
          height: `calc(100vh - ${theme.mixins.toolbar.minHeight}px - 16px)`,
          zIndex: theme.zIndex.drawer - 1,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}