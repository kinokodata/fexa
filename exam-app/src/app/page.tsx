'use client'

import { useEffect, useState } from 'react'
import { Container, Typography, Box, Card, CardContent, Grid, Button } from '@mui/material'
import { Header } from '@/components/Header'
import { useAuth } from '@/components/AuthProvider'
import { Login } from '@/components/Login'
import { useRouter } from 'next/navigation'
import apiClient from '@/services/api'
import { Exam } from '@/types/api'

export default function HomePage() {
  const { user, loading } = useAuth()
  const [exams, setExams] = useState<Exam[]>([])
  const [loadingExams, setLoadingExams] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchExams = async () => {
      if (!user) return
      
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

    fetchExams()
  }, [user])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Login />
  }

  const handleExamStart = (exam: Exam) => {
    const seasonPath = exam.season === 'a' ? 'spring' : 'autumn'
    router.push(`/exams/${exam.year}/${seasonPath}`)
  }

  return (
    <>
      <Header />
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
            <Grid container spacing={3}>
              {exams.map((exam) => (
                <Grid item xs={12} sm={6} md={4} key={exam.id}>
                  <Card>
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
                        試験開始
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
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
                onClick={() => router.push('/category')}
              >
                カテゴリ別練習へ
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  )
}