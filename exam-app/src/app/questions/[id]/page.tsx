'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Container, Typography, Box, CircularProgress, Alert, Card, CardContent, FormControl, FormControlLabel, RadioGroup, Radio, Button, Divider, IconButton, useTheme, useMediaQuery } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { Header } from '@/components/Header'
import { ExamSidebar } from '@/components/ExamSidebar'
import MathRenderer from '@/components/MathRenderer'
import apiClient from '@/services/api'
import { Question } from '@/types/api'

export default function QuestionPage() {
  const params = useParams()
  const router = useRouter()
  const questionId = params.id as string
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [question, setQuestion] = useState<Question | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const result = await apiClient.getQuestion(questionId)
        
        if (result.success && result.data) {
          setQuestion(result.data)
          
          // 同じ試験の問題一覧を取得してサイドバー用に設定
          if (result.data.exam) {
            const questionsResult = await apiClient.getQuestions({
              year: result.data.exam.year,
              season: result.data.exam.season,
              limit: 100 // 全問題を取得
            })
            
            if (questionsResult.success && questionsResult.data) {
              setQuestions(questionsResult.data)
            }
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

    fetchQuestion()
  }, [questionId])

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAnswer(event.target.value)
  }

  const handleShowAnswer = () => {
    setShowAnswer(true)
  }

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  if (loading) {
    return (
      <>
        <Header onMenuClick={handleSidebarToggle} />
        <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header onMenuClick={handleSidebarToggle} />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </>
    )
  }

  if (!question) {
    return (
      <>
        <Header onMenuClick={handleSidebarToggle} />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="warning">問題が見つかりません</Alert>
        </Container>
      </>
    )
  }

  // choices配列から正解の選択肢を探す
  const correctChoice = question.choices?.find(choice => choice.is_correct)?.choice_label
  const isCorrect = selectedAnswer && selectedAnswer === correctChoice

  return (
    <>
      <Header onMenuClick={handleSidebarToggle} />
      <Box sx={{ display: 'flex' }}>
        <ExamSidebar 
          questions={questions}
          currentQuestionId={questionId}
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          variant={isMobile ? 'temporary' : 'persistent'}
        />
        <Container 
          maxWidth="lg" 
          sx={{ 
            py: 4,
            ml: !isMobile && sidebarOpen ? '240px' : 0,
            transition: theme.transitions.create(['margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            })
          }}
        >
          {/* パンくずリスト */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {question.exam?.year}年 {question.exam?.season} / 問{question.question_number}
            </Typography>
          </Box>

          {/* 問題カード */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                  問{question.question_number}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {question.question_type}
                </Typography>
              </Box>
              
              {/* 問題文 */}
              <Box sx={{ mb: 3 }}>
                <MathRenderer 
                  text={question.question_text}
                  hasImages={question.has_image && (question.question_images?.length || 0) > 0}
                  shouldShowImages={question.has_image}
                />
                {/* 問題画像の表示 */}
                {question.question_images && question.question_images.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    {question.question_images.map((image, index) => (
                      <Box key={image.id} sx={{ mb: 2 }}>
                        <img 
                          src={image.image_url} 
                          alt={image.caption || `問題画像 ${index + 1}`}
                          style={{ 
                            maxWidth: '100%', 
                            height: 'auto'
                          }}
                        />
                        {image.caption && (
                          <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                            {image.caption}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              {/* 選択肢テーブル（ある場合） */}
              {question.choice_table_markdown && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    選択肢テーブル
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <MathRenderer text={question.choice_table_markdown} />
                    </CardContent>
                  </Card>
                </Box>
              )}

              {/* 選択肢 */}
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup
                  value={selectedAnswer}
                  onChange={handleAnswerChange}
                >
                  {question.choices?.sort((a, b) => {
                    const order: { [key: string]: number } = { 'ア': 1, 'イ': 2, 'ウ': 3, 'エ': 4 };
                    return (order[a.choice_label] || 999) - (order[b.choice_label] || 999);
                  }).map((choice) => (
                    <FormControlLabel
                      key={choice.id}
                      value={choice.choice_label}
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <Box sx={{ minWidth: '30px', flexShrink: 0 }}>
                            <strong>{choice.choice_label}.</strong>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <MathRenderer 
                              text={choice.choice_text}
                              hasImages={choice.has_image && (choice.choice_images?.length || 0) > 0}
                              shouldShowImages={choice.has_image}
                            />
                            {/* 選択肢画像の表示 */}
                            {choice.choice_images && choice.choice_images.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                {choice.choice_images.map((image, index) => (
                                  <Box key={image.id} sx={{ mb: 1 }}>
                                    <img 
                                      src={image.image_url} 
                                      alt={`選択肢画像 ${index + 1}`}
                                      style={{ 
                                        maxWidth: '100%', 
                                        height: 'auto'
                                      }}
                                    />
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      }
                      sx={{ 
                        mb: 2,
                        p: 2,
                        border: '1px solid',
                        borderColor: showAnswer && choice.is_correct 
                          ? 'success.main' 
                          : showAnswer && selectedAnswer === choice.choice_label && !choice.is_correct
                          ? 'error.main'
                          : 'divider',
                        borderRadius: 1,
                        backgroundColor: showAnswer && choice.is_correct 
                          ? 'rgba(76, 175, 80, 0.08)'  // 薄い緑色
                          : showAnswer && selectedAnswer === choice.choice_label && !choice.is_correct
                          ? 'rgba(244, 67, 54, 0.08)'   // 薄い赤色
                          : 'transparent',
                        '&:hover': {
                          backgroundColor: !showAnswer ? 'action.hover' : undefined
                        }
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              {/* 解答ボタン */}
              {!showAnswer && selectedAnswer && (
                <Box sx={{ mt: 3 }}>
                  <Button 
                    variant="contained" 
                    onClick={handleShowAnswer}
                    size="large"
                  >
                    解答を表示
                  </Button>
                </Box>
              )}

              {/* 解答結果 */}
              {showAnswer && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  
                  {selectedAnswer && (
                    <Alert 
                      severity={isCorrect ? 'success' : 'error'}
                      sx={{ mb: 2 }}
                    >
                      {isCorrect ? '正解です！' : '不正解です。'}
                      正解: <strong>{correctChoice}</strong>
                    </Alert>
                  )}

                  {(question.answer?.explanation || question.explanation) && (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          解説
                        </Typography>
                        <Box>
                          <MathRenderer text={question.answer?.explanation || question.explanation || ''} />
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>
    </>
  )
}