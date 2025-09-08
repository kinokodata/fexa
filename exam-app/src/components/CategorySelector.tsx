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
  Card,
  CardContent
} from '@mui/material';
import apiClient from '../services/api';

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
  }, categoryIds?: {
    field?: string;
    major?: string;
    medium?: string;
    minor?: string;
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
      onCategorySelect(
        { field: selectedFieldName },
        { field: fieldId }
      );
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
      onCategorySelect(
        { field: selectedFieldName, major: selectedMajorName },
        { field: selectedField, major: majorId }
      );
    }
  };

  // 中分類選択時：小分類を取得
  const handleMediumChange = async (event: SelectChangeEvent) => {
    const mediumId = event.target.value;
    setSelectedMedium(mediumId);
    setSelectedMinor('');
    setMinors([]);
    
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
      onCategorySelect(
        { field: selectedFieldName, major: selectedMajorName, medium: selectedMediumName },
        { field: selectedField, major: selectedMajor, medium: mediumId }
      );
    }
  };

  // 小分類選択時
  const handleMinorChange = async (event: SelectChangeEvent) => {
    const minorId = event.target.value;
    setSelectedMinor(minorId);
    
    if (minorId) {
      // 選択状態を親に通知
      const selectedFieldName = fields.find(f => f.id === selectedField)?.name;
      const selectedMajorName = majors.find(m => m.id === selectedMajor)?.name;
      const selectedMediumName = mediums.find(m => m.id === selectedMedium)?.name;
      const selectedMinorName = minors.find(m => m.id === minorId)?.name;
      onCategorySelect(
        { 
          field: selectedFieldName, 
          major: selectedMajorName, 
          medium: selectedMediumName, 
          minor: selectedMinorName 
        },
        { 
          field: selectedField, 
          major: selectedMajor, 
          medium: selectedMedium, 
          minor: minorId 
        }
      );
    }
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

      </CardContent>
    </Card>
  );
}