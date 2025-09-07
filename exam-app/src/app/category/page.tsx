'use client';

import { useState } from 'react';
import { Container, Typography, Box, Card, CardContent, Grid, Button, CircularProgress } from '@mui/material';
import { Header } from '@/components/Header';
import { useAuth } from '@/components/AuthProvider';
import { Login } from '@/components/Login';
import CategorySelector from '@/components/CategorySelector';
import { useRouter } from 'next/navigation';
import apiClient from '@/services/api';

interface Question {
  id: string;
  question_text: string;
  explanation?: string;
  exam: {
    year: number;
    season: string;
  };
}

export default function CategoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<any>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleCategorySelect = async (categories: {
    field?: string;
    major?: string;
    medium?: string;
    minor?: string;
    knowledges?: string;
  }) => {
    setSelectedCategories(categories);
    
    // 問題を検索
    setLoadingQuestions(true);
    setSearchPerformed(true);
    
    try {
      const params = new URLSearchParams();
      if (categories.field) params.append('field_name', categories.field);
      if (categories.major) params.append('major_name', categories.major);
      if (categories.medium) params.append('medium_name', categories.medium);
      if (categories.minor) params.append('minor_name', categories.minor);
      if (categories.knowledges) params.append('knowledges', categories.knowledges);
      
      const result = await apiClient.get(`/categories/search/questions?${params.toString()}`);
      if (result.success) {
        setQuestions(result.data || []);
      }
    } catch (error) {
      console.error('問題検索エラー:', error);
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleQuestionClick = (questionId: string) => {
    router.push(`/questions/${questionId}`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <Box sx={{ pt: 8 }}>
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography>Loading...</Typography>
          </Container>
        </Box>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <Box sx={{ pt: 8 }}>
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Login />
          </Container>
        </Box>
      </>
    );
  }

  return (
    <>
      <Header />
      <Box sx={{ pt: 8 }}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            カテゴリ別問題練習
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            分野・カテゴリを選択して問題を絞り込んで練習できます
          </Typography>

          <Box sx={{ mb: 4 }}>
            <CategorySelector onCategorySelect={handleCategorySelect} />
          </Box>

          {/* 選択されたカテゴリの表示 */}
          {Object.keys(selectedCategories).length > 0 && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  選択されたカテゴリ
                </Typography>
                {selectedCategories.field && (
                  <Typography variant="body2">分野: {selectedCategories.field}</Typography>
                )}
                {selectedCategories.major && (
                  <Typography variant="body2">大分類: {selectedCategories.major}</Typography>
                )}
                {selectedCategories.medium && (
                  <Typography variant="body2">中分類: {selectedCategories.medium}</Typography>
                )}
                {selectedCategories.minor && (
                  <Typography variant="body2">小分類: {selectedCategories.minor}</Typography>
                )}
                {selectedCategories.knowledges && (
                  <Typography variant="body2">知識項目: {selectedCategories.knowledges}</Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* 問題一覧 */}
          {searchPerformed && (
            <Box>
              <Typography variant="h5" component="h2" gutterBottom>
                検索結果
              </Typography>
              
              {loadingQuestions ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : questions.length > 0 ? (
                <Grid container spacing={2}>
                  {questions.map((question) => (
                    <Grid item xs={12} key={question.id}>
                      <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                        <CardContent onClick={() => handleQuestionClick(question.id)}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {question.exam.year}年 {question.exam.season === 'a' ? '春期' : '秋期'}
                          </Typography>
                          <Typography variant="body1">
                            {question.question_text.length > 100 
                              ? `${question.question_text.substring(0, 100)}...` 
                              : question.question_text}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Card>
                  <CardContent>
                    <Typography variant="body1" align="center">
                      選択されたカテゴリに該当する問題が見つかりませんでした
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
}