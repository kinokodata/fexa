'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

interface ImageUploadProps {
  questionId: string;
  choiceId: string;
  choiceLabel: string;
  onImageUploaded?: () => void;
}

export default function ImageUpload({ questionId, choiceId, choiceLabel, onImageUploaded }: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const processFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
      
      // プレビュー用のURLを作成
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setError('画像ファイルを選択してください');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  };


  const handleUpload = async () => {
    if (!selectedFile) {
      setError('画像ファイルを選択してください');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { getAuthToken } = await import('../lib/auth');
      const token = getAuthToken();
      
      const formData = new FormData();
      formData.append('questionId', questionId);
      formData.append('choiceId', choiceId);
      formData.append('image', selectedFile);

      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:43001/api/images/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setSelectedFile(null);
        setPreviewUrl(null);
        onImageUploaded?.();
      } else {
        setError(data.error?.message || 'アップロードに失敗しました');
      }
    } catch (err) {
      setError('アップロード中にエラーが発生しました');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <Alert severity="success" sx={{ mt: 1 }}>
        選択肢{choiceLabel}の画像がアップロードされました
      </Alert>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1, backgroundColor: 'grey.50' }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          選択肢{choiceLabel}の画像をアップロード
        </Typography>
      </Box>

      {/* メイン */}
      <Box sx={{ display: 'flex', gap: 3, minWidth: 600, mb: 2 }}>
        {/* 左側: アップロードフォーム */}
        <Box sx={{ flex: 1 }}>
          {/* ドラッグアンドドロップエリア */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              sx={{
                border: '2px dashed',
                borderColor: isDragging ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                backgroundColor: isDragging ? 'action.hover' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minHeight: 150,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                }
              }}
              component="label"
            >
              <CloudUploadIcon 
                sx={{ 
                  fontSize: 64, 
                  color: isDragging ? 'primary.main' : 'grey.400',
                  mb: 2
                }} 
              />
              <Typography variant="h6" color={isDragging ? 'primary.main' : 'text.secondary'}>
                {isDragging ? 'ここにドロップしてください' : '画像をドラッグ&ドロップ'}
              </Typography>
              <VisuallyHiddenInput type="file" accept="image/*" onChange={handleFileSelect} />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                または
              </Typography>
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                disabled={uploading}
                component="label"
              >
                ファイル選択
                <VisuallyHiddenInput type="file" accept="image/*" onChange={handleFileSelect} />
              </Button>
            </Box>
          </Box>
        </Box>

        {/* 右側: プレビュー */}
        {previewUrl && (
          <Box sx={{ width: 300, flexShrink: 0 }}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={previewUrl}
                alt="プレビュー"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
                onError={() => setError('画像を読み込めませんでした')}
              />
            </Paper>
          </Box>
        )}
      </Box>

      {/* フッター */}
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* 左側: 選択済みファイル表示 */}
          <Box>
            {selectedFile && (
              <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                ✓ 選択済み: {selectedFile.name}
              </Typography>
            )}
          </Box>

          {/* 右側: ボタン */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancel}
              disabled={uploading || !selectedFile}
              size="small"
            >
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              size="small"
            >
              {uploading ? 'アップロード中...' : 'アップロード'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}