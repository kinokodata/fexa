import { useState } from 'react';
import { Exam } from '../types/api';

interface SearchFormProps {
  exams: Exam[];
  onSearch: (year?: number, season?: string) => void;
}

export default function SearchForm({ exams, onSearch }: SearchFormProps) {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');

  // 年度一覧を取得（重複除去・ソート）
  const years = Array.from(new Set(exams.map(exam => exam.year)))
    .sort((a, b) => b - a);

  // 季節一覧を取得
  const seasons = Array.from(new Set(exams.map(exam => exam.season)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const year = selectedYear ? parseInt(selectedYear) : undefined;
    const season = selectedSeason || undefined;
    
    onSearch(year, season);
  };

  const handleReset = () => {
    setSelectedYear('');
    setSelectedSeason('');
    onSearch(); // 全件検索
  };

  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '1.5rem', 
      borderRadius: '0.5rem', 
      border: '1px solid #e9ecef',
      marginBottom: '2rem'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>🔍 問題検索</h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              年度
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                border: '1px solid #ccc', 
                borderRadius: '0.25rem'
              }}
            >
              <option value="">すべての年度</option>
              {years.map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              季節
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                border: '1px solid #ccc', 
                borderRadius: '0.25rem'
              }}
            >
              <option value="">すべての季節</option>
              {seasons.map(season => (
                <option key={season} value={season}>{season}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="submit"
            style={{ 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            検索
          </button>
          <button
            type="button"
            onClick={handleReset}
            style={{ 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            リセット
          </button>
        </div>
      </form>

      {exams.length > 0 && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '0.25rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            <strong>利用可能なデータ:</strong> {exams.length}回分の試験データが登録されています
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#888' }}>
            {exams.map(exam => (
              <span key={`${exam.year}-${exam.season}`} style={{ marginRight: '1rem' }}>
                {exam.year}年{exam.season}({exam.question_count || 0}問)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}