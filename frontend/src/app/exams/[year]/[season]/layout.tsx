'use client';

import React, { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import QuestionSidebar from '../../../../components/QuestionSidebar';
import { useFilter } from '../../../../contexts/FilterContext';

interface Choice {
  id: string;
  choice_label: string;
  choice_text: string;
  has_image?: boolean;
  is_table_format?: boolean;
}

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  has_image?: boolean;
  has_choice_table?: boolean;
  question_images?: {
    id: string;
    image_url: string;
    caption?: string;
  }[];
  choices: Choice[];
  category?: {
    name: string;
  };
  is_checked?: boolean;
  checked_at?: string;
  checked_by?: string;
}

interface ExamLayoutProps {
  children: React.ReactNode;
}

export default function ExamLayout({ children }: ExamLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const { year, season } = params;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // フィルター状態をコンテキストから取得
  const { filters, toggleFilter } = useFilter();

  const drawerWidth = 450;

  // 現在の問題番号を URL から取得
  const getCurrentQuestionNumber = (): number | undefined => {
    const match = pathname.match(/\/q(\d+)/);
    return match ? parseInt(match[1]) : undefined;
  };

  useEffect(() => {
    if (year && season) {
      fetchQuestions();
    }
  }, [year, season]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { default: apiClient } = await import('../../../../services/api');
      
      // パラメータの型を安全に処理
      const yearStr = Array.isArray(year) ? year[0] : year;
      const seasonStr = Array.isArray(season) ? season[0] : season;
      
      // URL季節パラメータを日本語に変換
      let seasonJP = '';
      if (seasonStr === 'spring') seasonJP = '春期';
      else if (seasonStr === 'autumn') seasonJP = '秋期';  
      else if (seasonStr === 'special') seasonJP = '特別';
      
      const result = await apiClient.getQuestions({
        year: parseInt(yearStr),
        season: seasonJP,
        limit: 100
      });
      
      if (result.success) {
        setQuestions(result.data || []);
      } else {
        setError(result.error?.message || '問題の取得に失敗しました');
      }
    } catch (err) {
      setError('データの取得中にエラーが発生しました');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionClick = (questionId: string, questionNumber: number) => {
    // 詳細ページへ遷移（question IDをクエリパラメータで渡す）
    const basePath = `/exams/${year}/${season}`;
    const newPath = `${basePath}/q${questionNumber}?id=${questionId}`;
    window.location.href = newPath; // router.push の代わりに直接遷移
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {/* 共通サイドバーコンポーネント */}
      <QuestionSidebar
        questions={questions}
        filters={filters}
        onFilterChange={toggleFilter}
        onQuestionClick={handleQuestionClick}
        currentQuestionNumber={getCurrentQuestionNumber()}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        drawerWidth={drawerWidth}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        {/* Mobile Menu Button */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { md: 'none' }, mb: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {children}
      </Box>
    </Box>
  );
}