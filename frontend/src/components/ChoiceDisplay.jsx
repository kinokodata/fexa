import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
  Card,
  CardMedia
} from '@mui/material';

/**
 * 選択肢表示コンポーネント
 * 通常のテキスト、画像、表形式に対応
 */
const ChoiceDisplay = ({ choices }) => {
  if (!choices || choices.length === 0) {
    return (
      <Typography color="text.secondary">
        選択肢がありません
      </Typography>
    );
  }

  // 全て表形式の選択肢かチェック
  const isAllTableFormat = choices.every(c => c.is_table_format);
  
  // 表形式の場合
  if (isAllTableFormat && choices[0].table_headers) {
    return <TableChoices choices={choices} />;
  }

  // 通常のリスト形式
  return <ListChoices choices={choices} />;
};

/**
 * リスト形式の選択肢表示
 */
const ListChoices = ({ choices }) => {
  return (
    <List>
      {choices.map((choice) => (
        <ListItem key={choice.id} sx={{ alignItems: 'flex-start' }}>
          <Box display="flex" width="100%">
            <Typography sx={{ mr: 2, fontWeight: 'bold' }}>
              {choice.choice_label}.
            </Typography>
            <Box flex={1}>
              {choice.has_image ? (
                <ImageChoice choice={choice} />
              ) : (
                <Typography>{choice.choice_text}</Typography>
              )}
            </Box>
          </Box>
        </ListItem>
      ))}
    </List>
  );
};

/**
 * 表形式の選択肢表示
 */
const TableChoices = ({ choices }) => {
  if (choices.length === 0) return null;
  
  // ヘッダーを解析
  const headers = JSON.parse(choices[0].table_headers || '[]');
  
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            {headers.map((header, index) => (
              <TableCell key={index} align={index === 0 ? 'left' : 'center'}>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {choices.map((choice) => {
            const data = JSON.parse(choice.table_data || '[]');
            return (
              <TableRow key={choice.id}>
                {data.map((cell, index) => (
                  <TableCell key={index} align={index === 0 ? 'left' : 'center'}>
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/**
 * 画像選択肢の表示
 */
const ImageChoice = ({ choice }) => {
  // 画像URLを抽出（Markdown形式から）
  const imageMatch = choice.choice_text.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  
  if (!imageMatch) {
    return <Typography>{choice.choice_text}</Typography>;
  }
  
  const altText = imageMatch[1];
  const imageUrl = imageMatch[2];
  
  return (
    <Card variant="outlined" sx={{ maxWidth: 400 }}>
      <CardMedia
        component="img"
        image={imageUrl}
        alt={altText}
        sx={{ height: 'auto', maxHeight: 300 }}
      />
      {altText && (
        <Box p={1}>
          <Typography variant="caption" color="text.secondary">
            {altText}
          </Typography>
        </Box>
      )}
    </Card>
  );
};

export default ChoiceDisplay;