'use client';

import { useState } from 'react';
import { Container, Typography, Box, Card, CardContent, Button, CircularProgress, Alert } from '@mui/material';
import { Header } from '../../components/Header';
import { useAuth } from '../../components/AuthProvider';
import { Login } from '../../components/Login';
import CategorySelector from '../../components/CategorySelector';
import { useRouter } from 'next/navigation';
import apiClient from '../../services/api';

interface Question {
  id: string;
  question_number: number;
  exam: {
    id: string;
    year: number;
    season: string;
  };
}

export default function CategoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<any>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<{
    field?: string;
    major?: string;
    medium?: string;
    minor?: string;
  }>({});

  const handleCategorySelect = async (categories: {
    field?: string;
    major?: string;
    medium?: string;
    minor?: string;
  }, categoryIds?: {
    field?: string;
    major?: string;
    medium?: string;
    minor?: string;
  }) => {
    setSelectedCategories(categories);
    if (categoryIds) {
      setSelectedCategoryIds(categoryIds);
    }
    
    // 古い問題セットをクリア
    document.cookie = 'questionSet=; path=/; max-age=0';
    
    // 問題を検索
    setLoadingQuestions(true);
    setSearchPerformed(true);
    
    try {
      const params = new URLSearchParams();
      if (categories.field) params.append('field_name', categories.field);
      if (categories.major) params.append('major_name', categories.major);
      if (categories.medium) params.append('medium_name', categories.medium);
      if (categories.minor) params.append('minor_name', categories.minor);
      
      // ランダムに50問取得
      params.append('limit', '50');
      
      const result = await apiClient.get<any>(`/categories/search/direct?${params.toString()}`);
      console.log('Category API Debug - result:', result);
      console.log('Category API Debug - result.data:', result.data);
      if (result.success) {
        const questionsData = result.data || [];
        console.log('Category API Debug - questionsData:', questionsData);
        console.log('Category API Debug - first question:', questionsData[0]);
        setQuestions(questionsData);
        // totalは直接プロパティまたはpagination内から取得
        setTotalQuestions((result as any).total || (result as any).pagination?.total || result.data?.length || 0);
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

  // 表示されている問題を問題セットとして作成
  const createQuestionSet = async () => {
    console.log('CreateQuestionSet Debug - Function called');
    console.log('CreateQuestionSet Debug - questions.length:', questions.length);
    
    if (questions.length === 0) {
      console.log('CreateQuestionSet Debug - No questions, returning');
      return;
    }

    console.log('CreateQuestionSet Debug - questions count:', questions.length);
    console.log('CreateQuestionSet Debug - first question exam info:', questions[0]?.exam);

    // APIに問題セットを保存
    const questionSet = {
      selectedCategories,
      questions: questions.map(q => ({
        id: q.id,
        question_number: q.question_number,
        exam: q.exam || { year: 0, season: 'unknown' } // examプロパティが存在しない場合のフォールバック
      })),
      currentIndex: 0,
      createdAt: new Date().toISOString(),
      totalQuestions: questions.length
    };

    console.log('CreateQuestionSet Debug - questionSet:', questionSet);
    console.log('CreateQuestionSet Debug - questions length:', questionSet.questions.length);

    try {
      const result = await apiClient.saveQuestionSet(questionSet);
      
      if (result.success) {
        console.log('QuestionSet API - Save successful:', result.data);
        
        // 最下層のカテゴリIDを取得
        const categoryId = selectedCategoryIds.minor || 
                          selectedCategoryIds.medium || 
                          selectedCategoryIds.major || 
                          selectedCategoryIds.field || 
                          'unknown';

        // 最初の問題に遷移（hasQuestionSet=trueパラメータ付き）
        router.push(`/questions/${questions[0].id}?category=${categoryId}&hasQuestionSet=true`);
      } else {
        console.error('QuestionSet API - Save failed:', result.error);
        alert('問題セットの保存に失敗しました');
      }
    } catch (error) {
      console.error('QuestionSet API - Save error:', error);
      alert('問題セットの保存中にエラーが発生しました');
    }
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
              </CardContent>
            </Card>
          )}

          {/* 問題一覧 */}
          {searchPerformed && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h2">
                  検索結果 ({totalQuestions || questions.length}問)
                </Typography>
                {questions.length > 0 && (
                  <Button 
                    variant="contained" 
                    color="primary"
                    size="large"
                    onClick={createQuestionSet}
                  >
                    問題セットを作成 ({totalQuestions > 50 ? '50問' : `${questions.length}問`})
                  </Button>
                )}
              </Box>

              {totalQuestions > 50 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  ランダムに50問を表示しています。「問題セットを作成」でこれらの問題で演習を開始できます。
                </Alert>
              )}
              
              {loadingQuestions ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : questions.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {questions.map((question) => (
                    <Card key={question.id} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                      <CardContent onClick={() => handleQuestionClick(question.id)}>
                        <Typography variant="h6" gutterBottom>
                          H{question.exam.year.toString().slice(-2)}-{question.exam.season === 'a' ? 'S' : 'H'}-{question.question_number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {question.exam.year}年 {question.exam.season === 'a' ? '春期' : '秋期'} 問{question.question_number}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
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