'use client';

import React, { useEffect, useState } from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent, 
  Box,
  Typography,
  Collapse,
  Button,
  Card,
  CardContent
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import apiClient from '@/services/api';

interface Category {
  id: string;
  name: string;
  level: number;
  parent_id: string | null;
  children?: Category[];
}

interface CategorySelectorProps {
  onCategorySelect: (categories: {
    field?: string;
    major?: string;
    medium?: string;
    minor?: string;
    knowledges?: string;
  }) => void;
}

export default function CategorySelector({ onCategorySelect }: CategorySelectorProps) {
  const [fields, setFields] = useState<Category[]>([]);
  const [majors, setMajors] = useState<Category[]>([]);
  const [mediums, setMediums] = useState<Category[]>([]);
  const [minors, setMinors] = useState<Category[]>([]);
  
  const [selectedField, setSelectedField] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [selectedMedium, setSelectedMedium] = useState('');
  const [selectedMinor, setSelectedMinor] = useState('');
  
  const [knowledgesExpanded, setKnowledgesExpanded] = useState(false);
  const [selectedKnowledges, setSelectedKnowledges] = useState<string[]>([]);
  const [availableKnowledges, setAvailableKnowledges] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);

  // 分野（level=1）を取得
  useEffect(() => {
    const fetchFields = async () => {
      setLoading(true);
      try {
        const result = await apiClient.get('/categories/level/1');
        if (result.success && result.data) {
          setFields(result.data);
        }
      } catch (error) {
        console.error('分野の取得に失敗:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFields();
  }, []);

  // 分野選択時：大分類を取得
  const handleFieldChange = async (event: SelectChangeEvent) => {
    const fieldId = event.target.value;
    setSelectedField(fieldId);
    setSelectedMajor('');
    setSelectedMedium('');
    setSelectedMinor('');
    setMajors([]);
    setMediums([]);
    setMinors([]);
    setSelectedKnowledges([]);
    setAvailableKnowledges([]);
    
    if (fieldId) {
      try {
        const result = await apiClient.get(`/categories/level/2?parent_id=${fieldId}`);
        if (result.success && result.data) {
          setMajors(result.data);
        }
      } catch (error) {
        console.error('大分類の取得に失敗:', error);
      }
      
      // 選択状態を親に通知
      const selectedFieldName = fields.find(f => f.id === fieldId)?.name;
      onCategorySelect({ field: selectedFieldName });
    }
  };

  // 大分類選択時：中分類を取得
  const handleMajorChange = async (event: SelectChangeEvent) => {
    const majorId = event.target.value;
    setSelectedMajor(majorId);
    setSelectedMedium('');
    setSelectedMinor('');
    setMediums([]);
    setMinors([]);
    setSelectedKnowledges([]);
    setAvailableKnowledges([]);
    
    if (majorId) {
      try {
        const result = await apiClient.get(`/categories/level/3?parent_id=${majorId}`);
        if (result.success && result.data) {
          setMediums(result.data);
        }
      } catch (error) {
        console.error('中分類の取得に失敗:', error);
      }
      
      // 選択状態を親に通知
      const selectedFieldName = fields.find(f => f.id === selectedField)?.name;
      const selectedMajorName = majors.find(m => m.id === majorId)?.name;
      onCategorySelect({ field: selectedFieldName, major: selectedMajorName });
    }
  };

  // 中分類選択時：小分類を取得
  const handleMediumChange = async (event: SelectChangeEvent) => {
    const mediumId = event.target.value;
    setSelectedMedium(mediumId);
    setSelectedMinor('');
    setMinors([]);
    setSelectedKnowledges([]);
    setAvailableKnowledges([]);
    
    if (mediumId) {
      try {
        const result = await apiClient.get(`/categories/level/4?parent_id=${mediumId}`);
        if (result.success && result.data) {
          setMinors(result.data);
        }
      } catch (error) {
        console.error('小分類の取得に失敗:', error);
      }
      
      // 選択状態を親に通知
      const selectedFieldName = fields.find(f => f.id === selectedField)?.name;
      const selectedMajorName = majors.find(m => m.id === selectedMajor)?.name;
      const selectedMediumName = mediums.find(m => m.id === mediumId)?.name;
      onCategorySelect({ field: selectedFieldName, major: selectedMajorName, medium: selectedMediumName });
    }
  };

  // 小分類選択時：知識項目を取得
  const handleMinorChange = async (event: SelectChangeEvent) => {
    const minorId = event.target.value;
    setSelectedMinor(minorId);
    setSelectedKnowledges([]);
    
    if (minorId) {
      // 選択された小分類の知識項目を取得
      const selectedMinorCategory = minors.find(m => m.id === minorId);
      if (selectedMinorCategory) {
        try {
          const result = await apiClient.get(`/categories/${minorId}`);
          if (result.success && result.data && result.data.knowledges) {
            const knowledgesList = result.data.knowledges.split(',').map((k: string) => k.trim());
            setAvailableKnowledges(knowledgesList);
          }
        } catch (error) {
          console.error('知識項目の取得に失敗:', error);
        }
      }
      
      // 選択状態を親に通知
      const selectedFieldName = fields.find(f => f.id === selectedField)?.name;
      const selectedMajorName = majors.find(m => m.id === selectedMajor)?.name;
      const selectedMediumName = mediums.find(m => m.id === selectedMedium)?.name;
      const selectedMinorName = minors.find(m => m.id === minorId)?.name;
      onCategorySelect({ 
        field: selectedFieldName, 
        major: selectedMajorName, 
        medium: selectedMediumName, 
        minor: selectedMinorName 
      });
    }
  };

  // 知識項目選択の切り替え
  const toggleKnowledge = (knowledge: string) => {
    const newSelected = selectedKnowledges.includes(knowledge)
      ? selectedKnowledges.filter(k => k !== knowledge)
      : [...selectedKnowledges, knowledge];
    
    setSelectedKnowledges(newSelected);
    
    // 選択状態を親に通知
    const selectedFieldName = fields.find(f => f.id === selectedField)?.name;
    const selectedMajorName = majors.find(m => m.id === selectedMajor)?.name;
    const selectedMediumName = mediums.find(m => m.id === selectedMedium)?.name;
    const selectedMinorName = minors.find(m => m.id === selectedMinor)?.name;
    onCategorySelect({ 
      field: selectedFieldName, 
      major: selectedMajorName, 
      medium: selectedMediumName, 
      minor: selectedMinorName,
      knowledges: newSelected.join(', ') 
    });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          カテゴリセット 1
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          {/* 分野選択 */}
          <FormControl fullWidth>
            <InputLabel>分野</InputLabel>
            <Select
              value={selectedField}
              label="分野"
              onChange={handleFieldChange}
              disabled={loading}
            >
              {fields.map((field) => (
                <MenuItem key={field.id} value={field.id}>
                  {field.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 大分類選択 */}
          <FormControl fullWidth disabled={!selectedField}>
            <InputLabel>カテゴリ大</InputLabel>
            <Select
              value={selectedMajor}
              label="カテゴリ大"
              onChange={handleMajorChange}
            >
              {majors.map((major) => (
                <MenuItem key={major.id} value={major.id}>
                  {major.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          {/* 中分類選択 */}
          <FormControl fullWidth disabled={!selectedMajor}>
            <InputLabel>カテゴリ中</InputLabel>
            <Select
              value={selectedMedium}
              label="カテゴリ中"
              onChange={handleMediumChange}
            >
              {mediums.map((medium) => (
                <MenuItem key={medium.id} value={medium.id}>
                  {medium.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 小分類選択 */}
          <FormControl fullWidth disabled={!selectedMedium}>
            <InputLabel>カテゴリ小</InputLabel>
            <Select
              value={selectedMinor}
              label="カテゴリ小"
              onChange={handleMinorChange}
            >
              {minors.map((minor) => (
                <MenuItem key={minor.id} value={minor.id}>
                  {minor.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* 知識項目選択（複数選択可） */}
        {availableKnowledges.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Button
              onClick={() => setKnowledgesExpanded(!knowledgesExpanded)}
              startIcon={knowledgesExpanded ? <ExpandLess /> : <ExpandMore />}
              sx={{ mb: 1 }}
            >
              ナレッジ（複数選択可）
            </Button>
            <Collapse in={knowledgesExpanded}>
              <Box sx={{ 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 1, 
                p: 2,
                maxHeight: 200,
                overflowY: 'auto'
              }}>
                {availableKnowledges.map((knowledge, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1,
                      cursor: 'pointer',
                      backgroundColor: selectedKnowledges.includes(knowledge) 
                        ? 'primary.light' 
                        : 'transparent',
                      color: selectedKnowledges.includes(knowledge) 
                        ? 'primary.contrastText' 
                        : 'text.primary',
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': {
                        backgroundColor: selectedKnowledges.includes(knowledge)
                          ? 'primary.main'
                          : 'action.hover'
                      }
                    }}
                    onClick={() => toggleKnowledge(knowledge)}
                  >
                    <Typography variant="body2">
                      {knowledge}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}