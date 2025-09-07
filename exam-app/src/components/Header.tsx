'use client';

import React, { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import SchoolIcon from '@mui/icons-material/School';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

interface Exam {
  id: string;
  year: number;
  season: string;
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps = {}) {
  const { isLoggedIn, handleLogout } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');

  useEffect(() => {
    const fetchExams = async () => {
      try {
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
        }
      } catch (error) {
        console.error('Failed to fetch exams:', error);
      }
    };

    fetchExams();
  }, []);

  const handleTitleClick = () => {
    router.push('/');
  };

  const handleExamChange = (event: any) => {
    const examId = event.target.value;
    setSelectedExam(examId);
    
    if (examId) {
      const exam = exams.find(e => e.id === examId);
      if (exam) {
        let seasonPath = 'autumn'; // デフォルト
        if (exam.season === 'a' || exam.season === '春期') {
          seasonPath = 'spring';
        } else if (exam.season === 'h' || exam.season === '秋期') {
          seasonPath = 'autumn';
        } else if (exam.season === '特別') {
          seasonPath = 'special';
        }
        router.push(`/exams/${exam.year}/${seasonPath}`);
      }
    }
  };

  return (
    <AppBar position="fixed" color="primary" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {onMenuClick && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <SchoolIcon sx={{ mr: 2 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography 
            variant="h6" 
            component="span" 
            sx={{ 
              cursor: 'pointer',
              display: 'inline-block',
              '&:hover': {
                opacity: 0.8
              }
            }}
            onClick={handleTitleClick}
          >
            Fexa - 基本情報技術者試験過去問データベース
          </Typography>
        </Box>
        
        {exams.length > 0 && (
          <Box sx={{ mr: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel 
                id="exam-select-label" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: 'white'
                  }
                }}
              >
                試験を選択
              </InputLabel>
              <Select
                labelId="exam-select-label"
                value={selectedExam}
                onChange={handleExamChange}
                label="試験を選択"
                sx={{
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                  '.MuiSelect-icon': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
              >
                <MenuItem value="">
                  <em>選択してください</em>
                </MenuItem>
                {exams.map((exam) => (
                  <MenuItem key={exam.id} value={exam.id}>
                    {exam.year}年度 {exam.season}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
        
        {isLoggedIn && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<AdminPanelSettingsIcon />}
              label="管理者でログイン中"
              variant="outlined"
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.5)',
                '& .MuiChip-icon': {
                  color: 'white',
                },
              }}
            />
            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.5)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'white',
                },
              }}
              variant="outlined"
            >
              ログアウト
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}