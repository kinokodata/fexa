'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Question } from '../../../types/api';
import apiClient from '../../../services/api';

export default function QuestionDetail() {
  const params = useParams();
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadQuestion(params.id as string);
    }
  }, [params.id]);

  const loadQuestion = async (id: string) => {
    setLoading(true);
    try {
      const response = await apiClient.getQuestion(id);
      if (response.success && response.data) {
        setQuestion(response.data);
      } else {
        setError(response.error?.message || '問題の取得に失敗しました');
      }
    } catch (error) {
      setError('問題の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>読み込み中...</div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div>
        <button 
          onClick={() => router.back()}
          style={{ 
            marginBottom: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          ← 戻る
        </button>
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '1rem', 
          borderRadius: '0.5rem'
        }}>
          ⚠️ {error || '問題が見つかりませんでした'}
        </div>
      </div>
    );
  }

  const { exam, category, choices, answer, images } = question;

  return (
    <div>
      {/* 戻るボタン */}
      <button 
        onClick={() => router.back()}
        style={{ 
          marginBottom: '2rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: 'pointer'
        }}
      >
        ← 戻る
      </button>

      {/* 問題ヘッダー */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e9ecef' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{ 
            backgroundColor: '#007bff', 
            color: 'white', 
            padding: '0.5rem 1rem', 
            borderRadius: '0.25rem', 
            fontWeight: 'bold'
          }}>
            {exam.year}年 {exam.season}
          </span>
          <span style={{ 
            backgroundColor: '#6c757d', 
            color: 'white', 
            padding: '0.5rem 1rem', 
            borderRadius: '0.25rem'
          }}>
            {question.question_type} 問{question.question_number}
          </span>
          {category && (
            <span style={{ 
              backgroundColor: '#28a745', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.25rem'
            }}>
              {category.name}
            </span>
          )}
          {question.pdf_page_number && (
            <span style={{ 
              backgroundColor: '#17a2b8', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.25rem'
            }}>
              PDF p.{question.pdf_page_number}
            </span>
          )}
        </div>
        
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          登録日: {new Date(question.created_at).toLocaleString('ja-JP')}
        </div>
      </div>

      {/* 問題文 */}
      <div style={{ marginBottom: '2rem', padding: '2rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e9ecef' }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#333' }}>問題文</h2>
        <div style={{ lineHeight: '1.7', fontSize: '1.1rem' }}>
          {question.question_text}
        </div>
      </div>

      {/* 画像 */}
      {images && images.length > 0 && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e9ecef' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>関連画像</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {images.map((image) => (
              <div key={image.id}>
                <img 
                  src={image.image_url} 
                  alt={image.caption || '問題画像'} 
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '0.25rem' }}
                />
                {image.caption && (
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                    {image.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 選択肢 */}
      {choices && choices.length > 0 && (
        <div style={{ marginBottom: '2rem', padding: '2rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e9ecef' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>選択肢</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {choices.map((choice) => (
              <div 
                key={choice.id} 
                style={{ 
                  padding: '1rem', 
                  border: '1px solid #dee2e6', 
                  borderRadius: '0.25rem',
                  backgroundColor: showAnswer && choice.is_correct ? '#d4edda' : 'transparent',
                  borderColor: showAnswer && choice.is_correct ? '#28a745' : '#dee2e6'
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: '#007bff',
                    minWidth: '1.5rem'
                  }}>
                    {choice.choice_label}
                  </span>
                  <span style={{ flex: 1, lineHeight: '1.5' }}>
                    {choice.choice_text}
                  </span>
                  {showAnswer && choice.is_correct && (
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 解答表示ボタン */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          style={{ 
            backgroundColor: showAnswer ? '#dc3545' : '#28a745', 
            color: 'white', 
            border: 'none', 
            padding: '1rem 2rem', 
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {showAnswer ? '解答を隠す' : '解答を表示'}
        </button>
      </div>

      {/* 解答・解説 */}
      {showAnswer && answer && (
        <div style={{ marginBottom: '2rem', padding: '2rem', backgroundColor: '#e8f5e8', borderRadius: '0.5rem', border: '2px solid #28a745' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#28a745' }}>🎯 解答・解説</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <strong style={{ fontSize: '1.2rem' }}>正解: {answer.correct_choice}</strong>
          </div>

          {answer.explanation && (
            <div style={{ 
              lineHeight: '1.6', 
              backgroundColor: 'white', 
              padding: '1rem', 
              borderRadius: '0.25rem',
              marginBottom: '1rem'
            }}>
              {answer.explanation}
            </div>
          )}

          {answer.reference_url && (
            <div>
              <strong>参考URL:</strong>{' '}
              <a 
                href={answer.reference_url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#007bff' }}
              >
                {answer.reference_url}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}