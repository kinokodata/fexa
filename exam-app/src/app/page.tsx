'use client'

import { useEffect, useState } from 'react'
import { Container, Typography, Box, Card, CardContent, Button } from '@mui/material'
import { Header } from '@/components/Header'
import { useAuth } from '@/components/AuthProvider'
import { Login } from '@/components/Login'
import { useRouter } from 'next/navigation'
import apiClient from '@/services/api'
import { Exam } from '@/types/api'

export default function HomePage() {
  const { user, loading } = useAuth()
  const [exams, setExams] = useState<Exam[]>([])
  const [loadingExams, setLoadingExams] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchExams = async () => {
      setLoadingExams(true)
      try {
        const result = await apiClient.getExams()
        if (result.success) {
          setExams(result.data || [])
        }
      } catch (error) {
        console.error('試験一覧の取得に失敗:', error)
      } finally {
        setLoadingExams(false)
      }
    }

    if (user) {
      fetchExams()
    }
  }, [user])

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
    )
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
    )
  }

  const handleExamStart = async (exam: Exam) => {
    try {
      // 試験の全問題を取得
      const result = await apiClient.getQuestions({
        year: exam.year,
        season: exam.season === 'a' ? '春期' : '秋期',
        limit: 100
      });
      
      if (result.success && result.data && result.data.length > 0) {
        const questions = result.data;
        
        console.log('ExamStart Debug - First question structure:', questions[0]);
        
        // 問題セットを作成
        const questionSet = {
          examInfo: {
            year: exam.year,
            season: exam.season
          },
          questions: questions.map(q => {
            // 問題データにexamプロパティがない場合は、APIに渡されたexam情報を使用
            const questionExam = q.exam || {
              year: exam.year,
              season: exam.season === 'a' ? '春期' : '秋期'
            };
            return {
              id: q.id,
              question_number: q.question_number,
              exam: questionExam
            };
          }),
          currentIndex: 0,
          createdAt: new Date().toISOString(),
          totalQuestions: questions.length
        };
        
        // APIに問題セットを保存
        const saveResult = await apiClient.saveQuestionSet(questionSet);
        
        if (saveResult.success) {
          console.log('ExamStart API - Save successful:', saveResult.data);
          
          // examinfo付きで最初の問題に遷移
          const examId = `${exam.year}-${exam.season}`;
          router.push(`/questions/${questions[0].id}?examinfo=${examId}&hasQuestionSet=true`);
        } else {
          console.error('ExamStart API - Save failed:', saveResult.error);
          alert('問題セットの作成に失敗しました');
        }
      } else {
        alert('問題データの取得に失敗しました');
      }
    } catch (error) {
      console.error('試験開始エラー:', error);
      alert('試験開始中にエラーが発生しました');
    }
  }

  return (
    <>
      <Header />
      <Box sx={{ pt: 8 }}> {/* Toolbarの高さ分のpadding */}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          基本情報技術者試験 問題演習
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          過去問を使って試験対策を行いましょう
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            年度・季節別試験
          </Typography>
          
          {loadingExams ? (
            <Typography>試験一覧を読み込み中...</Typography>
          ) : (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 3 
            }}>
              {exams.map((exam) => (
                <Card key={exam.id}>
                  <CardContent>
                    <Typography variant="h6" component="h3">
                      {exam.year}年 {exam.season === 'a' ? '春期' : '秋期'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      全80問・150分
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      sx={{ mt: 2 }}
                      onClick={() => handleExamStart(exam)}
                    >
                      演習開始
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            カテゴリ別練習
          </Typography>
          <Card>
            <CardContent>
              <Typography variant="body1" gutterBottom>
                分野・カテゴリごとに問題を絞り込んで練習できます
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => router.push('/categories')}
              >
                カテゴリ別練習へ
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
      </Box>
    </>
  )
}