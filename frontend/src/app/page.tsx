'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CategoryIcon from '@mui/icons-material/Category';

interface Exam {
  id: string;
  year: number;
  season: string;
  question_count?: number;
  total_questions?: number;
  checked_questions?: number;
  categorized_questions?: number;
}

export default function Home() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const { default: apiClient } = await import('../services/api');
      const data = await apiClient.getExams();
      
      if (data.success) {
        // 年度順（降順）、季節順でソート
        const sortedExams = (data.data || []).sort((a: Exam, b: Exam) => {
          if (b.year !== a.year) return b.year - a.year;
          // 秋期を先に表示
          return a.season === '秋期' ? -1 : 1;
        });
        setExams(sortedExams);
      } else {
        setError('試験データの取得に失敗しました');
      }
    } catch (err) {
      setError('データの取得中にエラーが発生しました');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExamClick = (exam: Exam) => {
    let seasonPath = 'autumn'; // デフォルト
    if (exam.season === '春期') {
      seasonPath = 'spring';
    } else if (exam.season === '秋期') {
      seasonPath = 'autumn';
    } else if (exam.season === '特別') {
      seasonPath = 'special';
    }
    router.push(`/exams/${exam.year}/${seasonPath}`);
  };

  const getSeasonColor = (season: string) => {
    if (season === '春期') return 'success';
    if (season === '特別') return 'info';
    return 'warning'; // 秋期
  };

  const getSeasonIcon = (season: string) => {
    if (season === '春期') return '🌸';
    if (season === '特別') return '⭐';
    return '🍁'; // 秋期
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

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  // 年度でグループ化
  const examsByYear = exams.reduce<Record<number, Exam[]>>((acc, exam) => {
    if (!acc[exam.year]) {
      acc[exam.year] = [];
    }
    acc[exam.year].push(exam);
    return acc;
  }, {});

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" component="h1" gutterBottom>
          <SchoolIcon sx={{ fontSize: 48, verticalAlign: 'middle', mr: 2 }} />
          基本情報技術者試験 過去問データベース
        </Typography>
        <Typography variant="h6" color="text.secondary">
          年度と季節を選択してください
        </Typography>
      </Box>

      <Box>
        {Object.entries(examsByYear).map(([year, yearExams]) => (
          <Box key={year} sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
              {year}年度
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {yearExams.map((exam) => (
                <Box 
                  key={`${exam.year}-${exam.season}`}
                  sx={{
                    width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' }
                  }}
                >
                  <Card 
                    sx={{ 
                      height: '100%',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      }
                    }}
                  >
                    <CardActionArea 
                      onClick={() => handleExamClick(exam)}
                      sx={{ height: '100%' }}
                    >
                      <CardContent>
                        <Box display="flex" flexDirection="column" alignItems="center" py={2}>
                          <Typography variant="h2" sx={{ mb: 1 }}>
                            {getSeasonIcon(exam.season)}
                          </Typography>
                          <Chip 
                            label={exam.season}
                            color={getSeasonColor(exam.season) as any}
                            size="medium"
                            sx={{ fontWeight: 'bold', fontSize: '1.1rem', py: 2, px: 3 }}
                          />
                          
                          {/* カテゴリ登録済みバッジ */}
                          {exam.categorized_questions !== undefined && exam.categorized_questions > 70 && (
                            <Box sx={{ mt: 1 }}>
                              <Chip 
                                icon={<CategoryIcon />}
                                label="カテゴリ登録済み"
                                color="info"
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                              />
                            </Box>
                          )}

                          {/* 進捗表示 */}
                          {exam.total_questions !== undefined && exam.total_questions > 0 && (
                            <Box sx={{ width: '100%', mt: 2 }}>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {exam.checked_questions || 0}/{exam.total_questions}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                  {Math.round(((exam.checked_questions || 0) / exam.total_questions) * 100)}%
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={((exam.checked_questions || 0) / exam.total_questions) * 100}
                                sx={{ 
                                  height: 6, 
                                  borderRadius: 3,
                                  backgroundColor: 'grey.200',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    backgroundColor: exam.checked_questions === exam.total_questions ? 'success.main' : 'primary.main'
                                  }
                                }}
                              />
                              
                              {/* カテゴリ登録状況 */}
                              {exam.categorized_questions !== undefined && (
                                <Box display="flex" alignItems="center" justifyContent="space-between" mt={1} mb={0.5}>
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                    <CategoryIcon sx={{ fontSize: 16, color: exam.categorized_questions > 70 ? 'info.main' : 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary">
                                      カテゴリ: {exam.categorized_questions}/{exam.total_questions}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {Math.round((exam.categorized_questions / exam.total_questions) * 100)}%
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          )}
                          
                          {/* 問題数表示（進捗表示がない場合） */}
                          {exam.question_count && exam.question_count > 0 && !exam.total_questions && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                              {exam.question_count}問
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      {exams.length === 0 && !loading && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            試験データがありません
          </Typography>
        </Box>
      )}
    </Container>
  );
}