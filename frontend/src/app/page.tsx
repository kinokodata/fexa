'use client';

import { useState, useEffect } from 'react';
import { Question, Exam } from '../types/api';
import { apiClient } from '../services/api';
import QuestionCard from '../components/QuestionCard';
import SearchForm from '../components/SearchForm';
import HealthStatus from '../components/HealthStatus';

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0
  });

  // 初期データ読み込み
  useEffect(() => {
    loadExams();
    loadRecentQuestions();
  }, []);

  // 試験一覧読み込み
  const loadExams = async () => {
    try {
      const response = await apiClient.getExams();
      if (response.success && response.data) {
        setExams(response.data);
      }
    } catch (error) {
      console.error('試験一覧の取得に失敗:', error);
    }
  };

  // 最近の問題読み込み
  const loadRecentQuestions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getQuestions({ page: 1, limit: 10 });
      if (response.success && response.data) {
        setQuestions(response.data);
        setPagination({
          page: response.pagination?.page || 1,
          total: response.pagination?.total || 0
        });
      } else {
        setError(response.error?.message || '問題の取得に失敗しました');
      }
    } catch (error) {
      setError('問題の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 検索実行
  const handleSearch = async (year?: number, season?: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.getQuestions({ 
        year, 
        season, 
        page: 1, 
        limit: 20 
      });
      
      if (response.success && response.data) {
        setQuestions(response.data);
        setPagination({
          page: response.pagination?.page || 1,
          total: response.pagination?.total || 0
        });
      } else {
        setError(response.error?.message || '検索に失敗しました');
        setQuestions([]);
      }
    } catch (error) {
      setError('検索中にエラーが発生しました');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* ヘルスステータス */}
      <HealthStatus />

      {/* 検索フォーム */}
      <SearchForm exams={exams} onSearch={handleSearch} />

      {/* 結果表示 */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>問題一覧</h2>
          {pagination.total > 0 && (
            <span style={{ color: '#666', fontSize: '0.9rem' }}>
              {pagination.total}件の問題が見つかりました
            </span>
          )}
        </div>

        {error && (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '0.75rem', 
            borderRadius: '0.25rem',
            marginBottom: '1rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div>読み込み中...</div>
          </div>
        ) : questions.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {questions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </div>
        ) : !loading && !error ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '0.5rem',
            color: '#666'
          }}>
            問題が見つかりませんでした。検索条件を変更してお試しください。
          </div>
        ) : null}
      </div>

      {/* 使用方法 */}
      <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '0.5rem' }}>
        <h3>使用方法</h3>
        <ul style={{ marginLeft: '1rem' }}>
          <li>上部の検索フォームで年度・季節を選択して問題を絞り込むことができます</li>
          <li>問題をクリックすると詳細ページで選択肢や解答を確認できます</li>
          <li>このシステムは読み取り専用で、APIサーバー経由で問題データを取得しています</li>
        </ul>
      </div>
    </div>
  );
}