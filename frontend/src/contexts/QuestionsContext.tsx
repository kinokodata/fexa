'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface Question {
  id: string;
  question_number: number;
  is_checked?: boolean;
  has_image?: boolean;
  has_choice_table?: boolean;
  question_text?: string;
  choices?: any[];
  question_images?: any[];
}

interface QuestionsContextType {
  questions: Question[];
  getQuestionIdByNumber: (questionNumber: number) => string | null;
  getAdjacentQuestions: (currentNumber: number) => {
    prevId: string | null;
    nextId: string | null;
  };
  updateQuestionStatus: (questionId: string, updates: Partial<Question>) => void;
}

const QuestionsContext = createContext<QuestionsContextType | undefined>(undefined);

interface QuestionsProviderProps {
  children: ReactNode;
  questions: Question[];
}

export function QuestionsProvider({ children, questions: initialQuestions }: QuestionsProviderProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);

  // 外部からの questions の変更を監視して内部状態を更新
  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);
  const getQuestionIdByNumber = (questionNumber: number): string | null => {
    const question = questions.find(q => q.question_number === questionNumber);
    return question?.id || null;
  };

  const getAdjacentQuestions = (currentNumber: number) => {
    const currentIndex = questions.findIndex(q => q.question_number === currentNumber);
    
    const prevQuestion = currentIndex > 0 ? questions[currentIndex - 1] : null;
    const nextQuestion = currentIndex < questions.length - 1 ? questions[currentIndex + 1] : null;
    
    return {
      prevId: prevQuestion?.id || null,
      nextId: nextQuestion?.id || null,
    };
  };

  const updateQuestionStatus = (questionId: string, updates: Partial<Question>) => {
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.id === questionId 
          ? { ...q, ...updates }
          : q
      )
    );
  };

  const value: QuestionsContextType = {
    questions,
    getQuestionIdByNumber,
    getAdjacentQuestions,
    updateQuestionStatus,
  };

  return (
    <QuestionsContext.Provider value={value}>
      {children}
    </QuestionsContext.Provider>
  );
}

export function useQuestions() {
  const context = useContext(QuestionsContext);
  if (context === undefined) {
    throw new Error('useQuestions must be used within a QuestionsProvider');
  }
  return context;
}