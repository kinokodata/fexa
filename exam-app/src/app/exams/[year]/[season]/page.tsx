'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Container, Typography, Box, CircularProgress, Alert, Button, Card, CardContent, Grid, IconButton, useTheme, useMediaQuery } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { Header } from '@/components/Header'
import { ExamSidebar } from '@/components/ExamSidebar'
import apiClient from '@/services/api'
import { Question } from '@/types/api'
import { useRouter } from 'next/navigation'

export default function ExamPage() {
  const params = useParams()
  const router = useRouter()
  const year = params.year as string
  const season = params.season as string
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)

  // 季節の表示名を取得
  const getSeasonName = (season: string) => {
    switch (season) {
      case 'spring':
      case 'a':
        return '春期'
      case 'autumn':
      case 'h':
        return '秋期'
      case 'special':
        return '特別'
      default:
        return season
    }
  }

  // 季節コードを変換（APIで使用するため）
  const getSeasonCode = (season: string) => {
    switch (season) {
      case 'spring':
        return 'a'
      case 'autumn':
        return 'h'
      default:
        return season
    }
  }

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        console.log('🔍 APIリクエスト:', { year, season, seasonCode: getSeasonCode(season) })
        
        const result = await apiClient.getQuestions({
          year: parseInt(year),
          season: getSeasonCode(season)
        })
        
        console.log('📊 APIレスポンス:', result)
        console.log('❓ 問題数:', result.data?.length || 0)
        
        if (result.success && result.data) {
          setQuestions(result.data)
          console.log('✅ 問題データ取得成功:', result.data.length + '件')
          
          // 最初の問題をデバッグ出力
          if (result.data.length > 0) {
            console.log('🔍 最初の問題:', result.data[0])
          }
        } else {
          setError(`問題データの取得に失敗: ${result.error?.message || '不明なエラー'}`)
          console.error('❌ APIエラー:', result.error)
        }
      } catch (err) {
        console.error('💥 リクエストエラー:', err)
        setError(`リクエスト失敗: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [year, season])

  const handleStartExam = () => {
    if (questions.length > 0) {
      router.push(`/exams/${year}/${season}/1`)
    }
  }

  return (
    <>
      <Header />
      <Box sx={{ display: 'flex', pt: 8 }}>
        <ExamSidebar
          questions={questions}
          year={year}
          season={season}
          open={sidebarOpen && !loading && !error && questions.length > 0}
          onClose={() => setSidebarOpen(false)}
        />
        
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3,
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {!loading && !error && questions.length > 0 && (isMobile || !sidebarOpen) && (
                <IconButton 
                  onClick={() => setSidebarOpen(true)}
                  sx={{ mr: 2 }}
                  color="primary"
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h4" component="h1">
                {year}年度 {getSeasonName(season)} 基本情報技術者試験
              </Typography>
            </Box>
            
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4 }}>
                <CircularProgress size={20} />
                <Typography>問題データを読み込み中...</Typography>
              </Box>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mt: 4 }}>
                {error}
              </Alert>
            )}
            
            {!loading && !error && questions.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          試験概要
                        </Typography>
                        <Typography variant="body1" paragraph>
                          問題数: {questions.length}問
                        </Typography>
                        <Typography variant="body1" paragraph>
                          制限時間: 150分
                        </Typography>
                        <Typography variant="body1" paragraph>
                          解答形式: 多肢選択式
                        </Typography>
                        <Button 
                          variant="contained" 
                          size="large" 
                          onClick={handleStartExam}
                          sx={{ mt: 2 }}
                        >
                          試験開始
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          注意事項
                        </Typography>
                        <Typography variant="body2" paragraph>
                          • 左側のサイドバーから各問題に直接アクセスできます
                        </Typography>
                        <Typography variant="body2" paragraph>
                          • 解答状況は自動的に保存されます
                        </Typography>
                        <Typography variant="body2" paragraph>
                          • ブラウザを閉じても途中から再開できます
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ※ 実際の試験とは異なる場合があります
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Container>
        </Box>
      </Box>
    </>
  )
}