import { Question } from '../types/api';
import Link from 'next/link';

interface QuestionCardProps {
  question: Question;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  const { exam, category } = question;

  return (
    <div style={{ 
      border: '1px solid #e9ecef', 
      borderRadius: '0.5rem', 
      padding: '1.5rem',
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      transition: 'all 0.2s',
      cursor: 'pointer'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ 
              backgroundColor: '#007bff', 
              color: 'white', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '0.25rem', 
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              {exam.year}年 {exam.season}
            </span>
            <span style={{ 
              backgroundColor: '#6c757d', 
              color: 'white', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '0.25rem', 
              fontSize: '0.8rem'
            }}>
              {question.question_type} 問{question.question_number}
            </span>
            {category && (
              <span style={{ 
                backgroundColor: '#28a745', 
                color: 'white', 
                padding: '0.25rem 0.5rem', 
                borderRadius: '0.25rem', 
                fontSize: '0.8rem'
              }}>
                {category.name}
              </span>
            )}
          </div>
          {question.has_image && (
            <span style={{ color: '#ffc107', fontSize: '1.2rem' }}>🖼️</span>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <p style={{ 
          margin: 0, 
          lineHeight: '1.5',
          color: '#333'
        }}>
          {question.question_text.length > 200 
            ? `${question.question_text.substring(0, 200)}...` 
            : question.question_text}
        </p>
      </div>

      {question.choices && question.choices.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {question.choices.slice(0, 2).map((choice) => (
              <div key={choice.id} style={{ 
                fontSize: '0.9rem',
                color: '#666',
                padding: '0.25rem 0'
              }}>
                <strong>{choice.choice_label}</strong> {choice.choice_text.substring(0, 80)}
                {choice.choice_text.length > 80 && '...'}
              </div>
            ))}
            {question.choices.length > 2 && (
              <div style={{ fontSize: '0.8rem', color: '#999' }}>
                他{question.choices.length - 2}つの選択肢
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>
          {question.pdf_page_number && `PDF p.${question.pdf_page_number}`}
        </div>
        <Link 
          href={`/questions/${question.id}`}
          style={{ 
            color: '#007bff', 
            textDecoration: 'none', 
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}
        >
          詳細を見る →
        </Link>
      </div>
    </div>
  );
}