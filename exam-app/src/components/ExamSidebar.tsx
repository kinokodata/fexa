'use client'

import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, Typography, Chip, Divider, useTheme, useMediaQuery } from '@mui/material'
import { useRouter, usePathname } from 'next/navigation'
import { Question } from '../types/api'

interface ExamSidebarProps {
  questions?: Question[]
  open: boolean
  onClose?: () => void
  variant?: 'temporary' | 'persistent'
  currentQuestionId?: string
}

const DRAWER_WIDTH = 280

export function ExamSidebar({ questions = [], open, onClose, variant = 'persistent', currentQuestionId }: ExamSidebarProps) {
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

  const handleQuestionClick = (questionId: string) => {
    router.push(`/questions/${questionId}`)
  }

  // 現在の問題IDを取得（URLパスまたはpropsから）
  const getCurrentQuestionId = () => {
    if (currentQuestionId) return currentQuestionId
    const match = pathname.match(/\/questions\/([^\/]+)$/)
    return match ? match[1] : null
  }

  const currentId = getCurrentQuestionId()
  
  // 試験情報を問題データから取得
  const examInfo = questions.length > 0 ? questions[0].exam : null

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        {examInfo ? (
          <>
            <Typography variant="h6" component="div" gutterBottom>
              {examInfo.year}年 {getSeasonName(examInfo.season)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              基本情報技術者試験
            </Typography>
          </>
        ) : (
          <Typography variant="h6" component="div" gutterBottom>
            問題演習
          </Typography>
        )}
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
                selected={currentId === question.id}
                onClick={() => handleQuestionClick(question.id)}
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
                    fontWeight: currentId === question.id ? 'bold' : 'normal'
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
      variant={variant === 'temporary' || isMobile ? "temporary" : "persistent"}
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={(variant === 'temporary' || isMobile) ? {
        keepMounted: true, // Better open performance on mobile.
      } : undefined}
      sx={{
        width: open && !(variant === 'temporary' || isMobile) ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          top: `calc(${theme.mixins.toolbar.minHeight}px + 16px)`,
          height: `calc(100vh - ${theme.mixins.toolbar.minHeight}px - 16px)`,
          zIndex: theme.zIndex.drawer - 1,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  )
}