'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Container, Typography, Box, CircularProgress, Alert, Card, CardContent, FormControl, FormControlLabel, RadioGroup, Radio, Button, Divider, IconButton, useTheme, useMediaQuery } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { Header } from '@/components/Header'
import { ExamSidebar } from '@/components/ExamSidebar'
import apiClient from '@/services/api'
import { Question } from '@/types/api'

export default function QuestionPage() {
  const params = useParams()
  const router = useRouter()
  const year = params.year as string
  const season = params.season as string
  const qnumber = parseInt(params.qnumber as string)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
        const result = await apiClient.getQuestions({
          year: parseInt(year),
          season: getSeasonCode(season)
        })
        
        if (result.success && result.data) {
          setQuestions(result.data)
          const question = result.data.find(q => q.question_number === qnumber)
          if (question) {
            setCurrentQuestion(question)
          } else {
            setError(`問題 ${qnumber} が見つかりません`)
          }
        } else {
          setError(`問題データの取得に失敗: ${result.error?.message || '不明なエラー'}`)
        }
      } catch (err) {
        setError(`リクエスト失敗: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [year, season, qnumber])

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAnswer(event.target.value)
  }

  const handleShowAnswer = () => {
    setShowAnswer(true)
  }

  const handleNextQuestion = () => {
    const nextNumber = qnumber + 1
    const nextQuestion = questions.find(q => q.question_number === nextNumber)
    if (nextQuestion) {
      router.push(`/exams/${year}/${season}/${nextNumber}`)
    }
  }

  const handlePrevQuestion = () => {
    const prevNumber = qnumber - 1
    const prevQuestion = questions.find(q => q.question_number === prevNumber)
    if (prevQuestion) {
      router.push(`/exams/${year}/${season}/${prevNumber}`)
    }
  }

  const isCorrectAnswer = (choiceId: string) => {
    if (!currentQuestion) return false
    const choice = currentQuestion.choices?.find(c => c.id === choiceId)
    return choice?.is_correct || false
  }

  const getCorrectChoice = () => {
    if (!currentQuestion?.choices) return null
    return currentQuestion.choices.find(c => c.is_correct)
  }

  if (loading) {
    return (
      <>
        <Header />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', pt: 8 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>問題を読み込み中...</Typography>
        </Box>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 4, pt: 8 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </>
    )
  }

  if (!currentQuestion) {
    return (
      <>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 4, pt: 8 }}>
          <Alert severity="warning">問題が見つかりません</Alert>
        </Container>
      </>
    )
  }

  return (
    <>
      <Header />
      <Box sx={{ display: 'flex', pt: 8 }}>
        <ExamSidebar
          questions={questions}
          year={year}
          season={season}
          open={sidebarOpen}
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
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {(isMobile || !sidebarOpen) && (
                  <IconButton 
                    onClick={() => setSidebarOpen(true)}
                    sx={{ mr: 2 }}
                    color="primary"
                  >
                    <MenuIcon />
                  </IconButton>
                )}
                <Box>
                  <Typography variant="h4" component="h1">
                    {year}年度 {getSeasonName(season)} 基本情報技術者試験
                  </Typography>
                  <Typography variant="h5" color="primary">
                    問{currentQuestion.question_number}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  問題文
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.8,
                    mb: 3 
                  }}
                >
                  {currentQuestion.question_text}
                </Typography>

                {currentQuestion.question_images && currentQuestion.question_images.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    {currentQuestion.question_images.map((image, index) => (
                      <Box key={image.id} sx={{ mb: 2 }}>
                        <img 
                          src={image.image_url} 
                          alt={`問題図 ${index + 1}`}
                          style={{ maxWidth: '100%', height: 'auto' }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="h6" gutterBottom>
                  選択肢
                </Typography>
                
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <RadioGroup
                    value={selectedAnswer}
                    onChange={handleAnswerChange}
                  >
                    {currentQuestion.choices?.map((choice) => (
                      <FormControlLabel
                        key={choice.id}
                        value={choice.id}
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
                              {choice.choice_label}.
                            </Typography>
                            <Typography component="span">
                              {choice.choice_text}
                            </Typography>
                            {choice.choice_images && choice.choice_images.length > 0 && (
                              <Box sx={{ mt: 1, ml: 2 }}>
                                {choice.choice_images.map((image, index) => (
                                  <img 
                                    key={image.id}
                                    src={image.image_url} 
                                    alt={`選択肢${choice.choice_label}の図 ${index + 1}`}
                                    style={{ maxWidth: '200px', height: 'auto' }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                        }
                        sx={{
                          alignItems: 'flex-start',
                          mb: 2,
                          p: 2,
                          border: '1px solid',
                          borderColor: showAnswer && isCorrectAnswer(choice.id) 
                            ? 'success.main' 
                            : showAnswer && selectedAnswer === choice.id && !isCorrectAnswer(choice.id)
                            ? 'error.main'
                            : 'grey.300',
                          borderRadius: 1,
                          bgcolor: showAnswer && isCorrectAnswer(choice.id) 
                            ? 'success.light' 
                            : showAnswer && selectedAnswer === choice.id && !isCorrectAnswer(choice.id)
                            ? 'error.light'
                            : 'transparent',
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  {!showAnswer && (
                    <Button 
                      variant="contained" 
                      onClick={handleShowAnswer}
                      disabled={!selectedAnswer}
                    >
                      解答を確認
                    </Button>
                  )}
                  
                  {showAnswer && (
                    <Box sx={{ width: '100%' }}>
                      <Alert 
                        severity={selectedAnswer && isCorrectAnswer(selectedAnswer) ? 'success' : 'error'}
                        sx={{ mb: 2 }}
                      >
                        {selectedAnswer && isCorrectAnswer(selectedAnswer) 
                          ? '正解です！' 
                          : `不正解です。正解は ${getCorrectChoice()?.choice_label} です。`}
                      </Alert>
                      
                      {currentQuestion.explanation && (
                        <Card sx={{ mb: 2, bgcolor: 'info.light' }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              解説
                            </Typography>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                              {currentQuestion.explanation}
                            </Typography>
                          </CardContent>
                        </Card>
                      )}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button 
                variant="outlined" 
                onClick={handlePrevQuestion}
                disabled={qnumber <= 1}
              >
                前の問題
              </Button>
              
              <Typography variant="body2" color="text.secondary">
                {qnumber} / {questions.length}
              </Typography>
              
              <Button 
                variant="outlined" 
                onClick={handleNextQuestion}
                disabled={qnumber >= questions.length}
              >
                次の問題
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>
    </>
  )
}