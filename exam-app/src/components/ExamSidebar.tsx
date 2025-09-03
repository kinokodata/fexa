'use client'

import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, Typography, Chip, Divider, useTheme, useMediaQuery } from '@mui/material'
import { useRouter, usePathname } from 'next/navigation'
import { Question } from '@/types/api'

interface ExamSidebarProps {
  questions: Question[]
  year: string
  season: string
  open: boolean
  onClose?: () => void
}

const DRAWER_WIDTH = 280

export function ExamSidebar({ questions, year, season, open, onClose }: ExamSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

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

  const handleQuestionClick = (questionNumber: number) => {
    router.push(`/exams/${year}/${season}/${questionNumber}`)
  }

  const getCurrentQuestionNumber = () => {
    const match = pathname.match(/\/exams\/[^\/]+\/[^\/]+\/(\d+)$/)
    return match ? parseInt(match[1]) : null
  }

  const currentQuestionNumber = getCurrentQuestionNumber()

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="div" gutterBottom>
          {year}年 {getSeasonName(season)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          基本情報技術者試験
        </Typography>
        <Chip 
          label={`全${questions.length}問`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ mt: 1 }}
        />
      </Box>

      <Divider />

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List dense>
          {questions.map((question) => (
            <ListItem key={question.id} disablePadding>
              <ListItemButton
                selected={currentQuestionNumber === question.question_number}
                onClick={() => handleQuestionClick(question.question_number)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemText-secondary': {
                      color: 'primary.contrastText',
                      opacity: 0.8,
                    },
                  },
                }}
              >
                <ListItemText
                  primary={`問${question.question_number}`}
                  secondary={question.question_type || '午前'}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: currentQuestionNumber === question.question_number ? 'bold' : 'normal'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          制限時間: 150分
        </Typography>
        <Typography variant="body2" color="text.secondary">
          全問必答
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Drawer
      variant={isMobile ? "temporary" : "persistent"}
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={isMobile ? {
        keepMounted: true, // Better open performance on mobile.
      } : undefined}
      sx={{
        width: open && !isMobile ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          top: 64, // Header height
          height: 'calc(100vh - 64px)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  )
}