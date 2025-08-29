'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import SchoolIcon from '@mui/icons-material/School';

interface Exam {
  id: string;
  year: number;
  season: string;
  question_count?: number;
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
    router.push(`/exams/${exam.year}/${exam.season === '春期' ? 'spring' : 'autumn'}`);
  };

  const getSeasonColor = (season: string) => {
    return season === '春期' ? 'success' : 'warning';
  };

  const getSeasonIcon = (season: string) => {
    return season === '春期' ? '🌸' : '🍁';
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

      <Grid container spacing={3}>
        {Object.entries(examsByYear).map(([year, yearExams]) => (
          <Grid size={12} key={year}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
              {year}年度
            </Typography>
            <Grid container spacing={2}>
              {yearExams.map((exam) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={`${exam.year}-${exam.season}`}>
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
                          {exam.question_count && exam.question_count > 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                              {exam.question_count}問
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        ))}
      </Grid>

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