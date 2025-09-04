'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import Fab from '@mui/material/Fab';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Collapse from '@mui/material/Collapse';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MenuIcon from '@mui/icons-material/Menu';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import Toolbar from '@mui/material/Toolbar';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import MarkdownRenderer from '../../../../../components/MarkdownRenderer';
import MathRenderer from '../../../../../components/MathRenderer';
import ImageUpload from '../../../../../components/ImageUpload';
import QuestionFeatures from '../../../../../components/QuestionFeatures';

interface Choice {
  id: string;
  choice_label: string;
  choice_text: string;
  has_image?: boolean;
  is_correct?: boolean;
  choice_images?: {
    id: string;
    image_url: string;
    caption?: string;
  }[];
  images?: {
    id: string;
    image_url: string;
    caption?: string;
  }[];
}

interface Tag {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  relevance_score: number;
  is_primary: boolean;
}

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  has_image?: boolean;
  has_choice_table?: boolean;  // 選択肢が表形式かどうか
  choice_table_type?: 'markdown' | 'image';  // 表の種類
  choice_table_markdown?: string;  // 表のMarkdownテキスト
  question_images?: {
    id: string;
    image_url: string;
    caption?: string;
  }[];
  choices: Choice[];
  category?: {
    name: string;
  };
  tags?: Tag[];  // タグ配列を追加
  explanation?: string;
  is_checked?: boolean;
  checked_at?: string;
  checked_by?: string;
}

interface Category {
  id: string;
  parent_id?: string;
  exam_code: string;
  level: number;
  category_type: 'field' | 'major' | 'medium' | 'minor' | 'knowledge';
  name: string;
  display_order?: number;
  path?: string;
  children?: Category[];
  question_count?: number;
  relation_id?: string;  // 問題とカテゴリの関連ID
}

interface CategorySet {
  id: number;
  field?: Category;
  major?: Category;
  medium?: Category;
  minor?: Category;
  knowledge: Category[];
}

export default function QuestionDetail() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { year, season, qnumber } = params;
  
  // URL からquestion ID を取得
  const questionId = searchParams.get('id');
  
  // qnumberから数値部分を抽出
  const number = qnumber ? qnumber.toString().replace('q', '') : '';
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadModal, setUploadModal] = useState<{open: boolean, questionId: string, choiceId: string, choiceLabel: string}>({open: false, questionId: '', choiceId: '', choiceLabel: ''});
  const [checkingQuestion, setCheckingQuestion] = useState(false);
  const [editingCorrectAnswer, setEditingCorrectAnswer] = useState(false);
  const [selectedCorrectAnswerId, setSelectedCorrectAnswerId] = useState<string | null>(null);
  const [updatingCorrectAnswer, setUpdatingCorrectAnswer] = useState(false);
  const [questionTextModal, setQuestionTextModal] = useState<{open: boolean, text: string}>({open: false, text: ''});
  const [updatingQuestionText, setUpdatingQuestionText] = useState(false);
  const [explanationModal, setExplanationModal] = useState<{open: boolean, text: string}>({open: false, text: ''});
  const [updatingExplanation, setUpdatingExplanation] = useState(false);
  const [choiceEditModal, setChoiceEditModal] = useState<{open: boolean, choiceId: string, choiceLabel: string, text: string}>({open: false, choiceId: '', choiceLabel: '', text: ''});
  const [updatingChoiceText, setUpdatingChoiceText] = useState(false);
  const [choiceTableModal, setChoiceTableModal] = useState<{open: boolean, text: string}>({open: false, text: ''});
  const [updatingChoiceTable, setUpdatingChoiceTable] = useState(false);
  const [deletingChoiceTable, setDeletingChoiceTable] = useState(false);
  const [convertingToTable, setConvertingToTable] = useState(false);
  const [convertToTableModal, setConvertToTableModal] = useState<{open: boolean, text: string}>({open: false, text: ''});
  
  // カテゴリ関連の状態
  const [categoryModal, setCategoryModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questionCategories, setQuestionCategories] = useState<Category[]>([]);
  const [categorySets, setCategorySets] = useState<CategorySet[]>([{ id: 1, field: undefined, major: undefined, medium: undefined, minor: undefined, knowledge: [] }]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  
  // チェックエリア関連の状態
  const [checkAreaOpen, setCheckAreaOpen] = useState(true);  // デフォルトで表示
  const [checkAreaExpanded, setCheckAreaExpanded] = useState(false);
  const [checkList, setCheckList] = useState({
    questionNumber: false,
    questionContent: false,
    choiceA: false,
    choiceI: false,
    choiceU: false,
    choiceE: false,
    correctAnswer: false,
    appropriateExplanation: false,
    other: false
  });

  const seasonJapanese = season === 'spring' ? '春期' : season === 'autumn' ? '秋期' : '';
  const questionNumber = parseInt(number as string);

  useEffect(() => {
    if (year && season && number) {
      console.log('詳細ページ - パラメータ:', { year, season, number, questionId });
      fetchQuestions();
    }
  }, [year, season, number, questionId]);

  // 問題が設定されたときにカテゴリ情報を取得
  useEffect(() => {
    if (question?.id) {
      fetchQuestionCategories();
    }
  }, [question?.id]);

  // 問題が変わったときにチェックリストをリセット
  useEffect(() => {
    setCheckList({
      questionNumber: false,
      questionContent: false,
      choiceA: false,
      choiceI: false,
      choiceU: false,
      choiceE: false,
      correctAnswer: false,
      appropriateExplanation: false,
      other: false
    });
    // 問題が変わってもチェックエリアは表示したまま
    setCheckAreaExpanded(false);
  }, [questionNumber]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { default: apiClient } = await import('../../../../../services/api');
      
      // questionIdが利用可能な場合は個別取得、そうでなければ全件取得からフィルタ
      if (questionId) {
        // 個別問題取得
        const questionData = await apiClient.getQuestion(questionId);
        
        if (questionData.success && questionData.data) {
          setQuestion(questionData.data);
          // 軽量なナビゲーション用リストも取得（後で実装）
          // TODO: 軽量なナビゲーション用のリストを取得
        } else {
          setError('問題の取得に失敗しました');
        }
      } else {
        // 従来の全件取得方式（フォールバック）
        // パラメータの型を安全に処理
        const yearStr = Array.isArray(year) ? year[0] : year;
        const seasonStr = Array.isArray(season) ? season[0] : season;
        
        const data = await apiClient.getQuestions({
          year: parseInt(yearStr),
          season: seasonStr,
          limit: 100
        });
        
        if (data.success) {
          const allQuestions = data.data || [];
          
          const currentQuestion = allQuestions.find(q => q.question_number === questionNumber);
          if (currentQuestion) {
            setQuestion(currentQuestion);
          } else {
            setError('問題が見つかりませんでした');
          }
        } else {
          setError('問題の取得に失敗しました');
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      if (err instanceof Error && err.name === 'AuthError') {
        // AuthErrorは既にAuthProviderで処理される
        return;
      }
      setError('データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };


  const handleNavigation = (direction: 'prev' | 'next') => {
    const newNumber = direction === 'prev' ? questionNumber - 1 : questionNumber + 1;
    // TODO: 軽量リストから対応するquestionIdを取得してナビゲーション
    router.push(`/exams/${year}/${season}/q${newNumber}`);
  };


  const openUploadModal = (questionId: string, choiceId: string, choiceLabel: string) => {
    setUploadModal({open: true, questionId, choiceId, choiceLabel});
  };

  const closeUploadModal = () => {
    setUploadModal({open: false, questionId: '', choiceId: '', choiceLabel: ''});
  };

  const handleUpdateCorrectAnswer = async () => {
    if (!question?.id || !selectedCorrectAnswerId || updatingCorrectAnswer) return;
    
    try {
      setUpdatingCorrectAnswer(true);
      const { default: apiClient } = await import('../../../../../services/api');
      const result = await apiClient.updateCorrectAnswer(question.id, selectedCorrectAnswerId);
      
      if (result.success) {
        // 問題データを更新
        setQuestion(prev => {
          if (!prev) return null;
          return {
            ...prev,
            choices: prev.choices.map(c => ({
              ...c,
              is_correct: c.id === selectedCorrectAnswerId
            }))
          };
        });
        
        setEditingCorrectAnswer(false);
        setSelectedCorrectAnswerId(null);
        setError(null);
      } else {
        setError('正答の更新に失敗しました');
      }
    } catch (error) {
      console.error('正答更新エラー:', error);
      setError('正答の更新中にエラーが発生しました');
    } finally {
      setUpdatingCorrectAnswer(false);
    }
  };

  const handleStartEditingCorrectAnswer = () => {
    setEditingCorrectAnswer(true);
    // 現在の正答を初期選択状態にする
    const currentCorrectChoice = question?.choices.find(c => c.is_correct === true);
    if (currentCorrectChoice) {
      setSelectedCorrectAnswerId(currentCorrectChoice.id);
    }
  };

  const handleCancelEditingCorrectAnswer = () => {
    setEditingCorrectAnswer(false);
    setSelectedCorrectAnswerId(null);
  };

  const handleOpenQuestionTextModal = () => {
    if (question?.question_text) {
      setQuestionTextModal({
        open: true,
        text: question.question_text
      });
    }
  };

  const handleCloseQuestionTextModal = () => {
    setQuestionTextModal({open: false, text: ''});
  };

  const handleUpdateQuestionText = async () => {
    if (!question?.id || !questionTextModal.text.trim() || updatingQuestionText) return;
    
    try {
      setUpdatingQuestionText(true);
      const { default: apiClient } = await import('../../../../../services/api');
      const result = await apiClient.updateQuestionText(question.id, questionTextModal.text.trim());
      
      if (result.success) {
        // 問題データを更新
        setQuestion(prev => prev ? {
          ...prev,
          question_text: questionTextModal.text.trim()
        } : null);
        
        handleCloseQuestionTextModal();
        setError(null);
      } else {
        setError('問題文の更新に失敗しました');
      }
    } catch (error) {
      console.error('問題文更新エラー:', error);
      setError('問題文の更新中にエラーが発生しました');
    } finally {
      setUpdatingQuestionText(false);
    }
  };

  const handleOpenExplanationModal = () => {
    setExplanationModal({
      open: true,
      text: question?.explanation || ''
    });
  };

  const handleCloseExplanationModal = () => {
    setExplanationModal({open: false, text: ''});
  };

  const handleUpdateExplanation = async () => {
    if (!question?.id || updatingExplanation) return;
    
    try {
      setUpdatingExplanation(true);
      const { default: apiClient } = await import('../../../../../services/api');
      const result = await apiClient.updateExplanation(question.id, explanationModal.text);
      
      if (result.success) {
        // 問題データを更新
        setQuestion(prev => prev ? {
          ...prev,
          explanation: explanationModal.text
        } : null);
        
        handleCloseExplanationModal();
        setError(null);
      } else {
        setError('解説の更新に失敗しました');
      }
    } catch (error) {
      console.error('解説更新エラー:', error);
      setError('解説の更新中にエラーが発生しました');
    } finally {
      setUpdatingExplanation(false);
    }
  };

  // 選択肢編集モーダルのハンドラー
  const handleOpenChoiceEditModal = (choice: Choice) => {
    setChoiceEditModal({
      open: true,
      choiceId: choice.id,
      choiceLabel: choice.choice_label,
      text: choice.choice_text || ''
    });
  };

  const handleCloseChoiceEditModal = () => {
    setChoiceEditModal({open: false, choiceId: '', choiceLabel: '', text: ''});
  };

  // 表形式選択肢編集モーダルのハンドラー
  const handleOpenChoiceTableModal = () => {
    setChoiceTableModal({
      open: true,
      text: question?.choice_table_markdown || ''
    });
  };

  const handleCloseChoiceTableModal = () => {
    setChoiceTableModal({open: false, text: ''});
  };

  // 選択肢を表形式にするモーダルのハンドラー
  const handleOpenConvertToTableModal = () => {
    setConvertToTableModal({
      open: true,
      text: ''
    });
  };

  const handleCloseConvertToTableModal = () => {
    setConvertToTableModal({open: false, text: ''});
  };

  const handleUpdateChoiceText = async () => {
    if (!question?.id || !choiceEditModal.choiceId || updatingChoiceText) return;
    
    try {
      setUpdatingChoiceText(true);
      const { default: apiClient } = await import('../../../../../services/api');
      const result = await apiClient.updateChoiceText(question.id, choiceEditModal.choiceId, choiceEditModal.text || '');
      
      if (result.success) {
        // 問題データを更新
        setQuestion(prev => {
          if (!prev) return null;
          return {
            ...prev,
            choices: prev.choices.map(c => 
              c.id === choiceEditModal.choiceId 
                ? { ...c, choice_text: choiceEditModal.text || '' }
                : c
            )
          };
        });
        
        handleCloseChoiceEditModal();
        setError(null);
      } else {
        setError('選択肢の更新に失敗しました');
      }
    } catch (error) {
      console.error('選択肢更新エラー:', error);
      setError('選択肢の更新中にエラーが発生しました');
    } finally {
      setUpdatingChoiceText(false);
    }
  };

  const handleUpdateChoiceTable = async () => {
    if (!question?.id || updatingChoiceTable) return;
    
    try {
      setUpdatingChoiceTable(true);
      const { default: apiClient } = await import('../../../../../services/api');
      const result = await apiClient.updateChoiceTable(question.id, choiceTableModal.text || '');
      
      if (result.success) {
        // 問題データを更新
        setQuestion(prev => prev ? {
          ...prev,
          choice_table_markdown: choiceTableModal.text || ''
        } : null);
        
        handleCloseChoiceTableModal();
        setError(null);
      } else {
        setError('表形式選択肢の更新に失敗しました');
      }
    } catch (error) {
      console.error('表形式選択肢更新エラー:', error);
      setError('表形式選択肢の更新中にエラーが発生しました');
    } finally {
      setUpdatingChoiceTable(false);
    }
  };

  const handleDeleteChoiceTable = async () => {
    if (!question?.id || deletingChoiceTable) return;
    
    // 確認ダイアログ
    if (!window.confirm('表形式選択肢を削除してもよろしいですか？\n削除すると元に戻すことはできません。')) {
      return;
    }
    
    try {
      setDeletingChoiceTable(true);
      const { default: apiClient } = await import('../../../../../services/api');
      const result = await apiClient.deleteChoiceTable(question.id);
      
      if (result.success) {
        // 問題データを更新
        setQuestion(prev => prev ? {
          ...prev,
          choice_table_markdown: undefined,
          has_choice_table: false,
          choice_table_type: undefined
        } : null);
        
        
        setError(null);
        // 成功メッセージは表示せず、削除されたことが視覚的に分かるようにする
      } else {
        setError('表形式選択肢の削除に失敗しました');
      }
    } catch (error) {
      console.error('表形式選択肢削除エラー:', error);
      setError('表形式選択肢の削除中にエラーが発生しました');
    } finally {
      setDeletingChoiceTable(false);
    }
  };

  const handleConvertToTable = async () => {
    if (!question?.id || convertingToTable) return;
    
    try {
      setConvertingToTable(true);
      const { default: apiClient } = await import('../../../../../services/api');
      
      // 表形式選択肢として保存
      const result = await apiClient.updateChoiceTable(question.id, convertToTableModal.text);
      
      if (result.success) {
        // 問題データを更新（表形式フラグも設定）
        setQuestion(prev => prev ? {
          ...prev,
          choice_table_markdown: convertToTableModal.text,
          has_choice_table: true,
          choice_table_type: 'markdown'
        } : null);
        
        
        handleCloseConvertToTableModal();
        setError(null);
      } else {
        setError('表形式への変換に失敗しました');
      }
    } catch (error) {
      console.error('表形式変換エラー:', error);
      setError('表形式への変換中にエラーが発生しました');
    } finally {
      setConvertingToTable(false);
    }
  };

  // カテゴリ関連の関数
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const { default: apiClient } = await import('../../../../../services/api');
      const result = await apiClient.getCategoriesHierarchy({ examCode: 'FE' });
      
      console.log('カテゴリ取得結果:', result);
      
      if (result.success) {
        console.log('取得したカテゴリ:', result.data);
        console.log('レベル別カテゴリ数:', {
          level1: result.data?.filter(c => c.level === 1).length || 0,
          level2: result.data?.filter(c => c.level === 2).length || 0,
          level3: result.data?.filter(c => c.level === 3).length || 0,
          level4: result.data?.filter(c => c.level === 4).length || 0,
          level5: result.data?.filter(c => c.level === 5).length || 0,
        });
        setCategories(result.data || []);
      } else {
        console.error('カテゴリ取得失敗:', result.error);
        setError('カテゴリの取得に失敗しました');
      }
    } catch (error) {
      console.error('カテゴリ取得エラー:', error);
      setError('カテゴリの取得中にエラーが発生しました');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchQuestionCategories = async () => {
    if (!question?.id) return;
    
    try {
      const { default: apiClient } = await import('../../../../../services/api');
      const result = await apiClient.getQuestionCategories(question.id);
      
      if (result.success) {
        setQuestionCategories(result.data || []);
      }
    } catch (error) {
      console.error('問題カテゴリ取得エラー:', error);
    }
  };

  const handleOpenCategoryModal = async () => {
    setCategoryModal(true);
    await fetchCategories();
    await fetchQuestionCategories();
  };

  const handleCloseCategoryModal = () => {
    setCategoryModal(false);
    setCategorySets([{ id: 1, field: undefined, major: undefined, medium: undefined, minor: undefined, knowledge: [] }]);
  };

  const addCategorySet = () => {
    const newId = Math.max(...categorySets.map(s => s.id)) + 1;
    setCategorySets([...categorySets, { id: newId, field: undefined, major: undefined, medium: undefined, minor: undefined, knowledge: [] }]);
  };

  const removeCategorySet = (id: number) => {
    if (categorySets.length > 1) {
      setCategorySets(categorySets.filter(s => s.id !== id));
    }
  };

  const updateCategorySet = (id: number, updates: Partial<CategorySet>) => {
    setCategorySets(categorySets.map(set => 
      set.id === id ? { ...set, ...updates } : set
    ));
  };

  const getCategoriesByType = (type: Category['category_type'], parentName?: string): Category[] => {
    let filtered: Category[] = [];
    
    switch (type) {
      case 'field':
        // Level 1: 分野 - Get all field level categories
        filtered = categories.filter(cat => cat.level === 1);
        break;
        
      case 'major':
        // Level 2: カテゴリ大 - Filter by parent field
        if (parentName) {
          const parentField = categories.find(cat => cat.level === 1 && cat.name === parentName);
          if (parentField) {
            filtered = categories.filter(cat => cat.level === 2 && cat.parent_id === parentField.id);
          }
        }
        break;
        
      case 'medium':
        // Level 3: カテゴリ中 - Filter by parent major
        if (parentName) {
          const parentMajor = categories.find(cat => cat.level === 2 && cat.name === parentName);
          if (parentMajor) {
            filtered = categories.filter(cat => cat.level === 3 && cat.parent_id === parentMajor.id);
          }
        }
        break;
        
      case 'minor':
        // Level 4: カテゴリ小 - Filter by parent medium
        if (parentName) {
          const parentMedium = categories.find(cat => cat.level === 3 && cat.name === parentName);
          if (parentMedium) {
            filtered = categories.filter(cat => cat.level === 4 && cat.parent_id === parentMedium.id);
          }
        }
        break;
        
      case 'knowledge':
        // Level 5: ナレッジ - Filter by parent minor
        if (parentName) {
          const parentMinor = categories.find(cat => cat.level === 4 && cat.name === parentName);
          if (parentMinor) {
            filtered = categories.filter(cat => cat.level === 5 && cat.parent_id === parentMinor.id);
          }
        }
        break;
        
      default:
        filtered = [];
    }
    
    console.log(`カテゴリフィルタ結果 (type: ${type}, parent: ${parentName}):`, filtered);
    return filtered;
  };

  const handleSaveCategories = async () => {
    if (!question?.id) return;

    try {
      setSavingCategories(true);
      const { default: apiClient } = await import('../../../../../services/api');
      
      // 既存のカテゴリ関連付けを削除（実装が必要な場合）
      // まず新しいカテゴリを登録
      for (const categorySet of categorySets) {
        // knowledge カテゴリを登録
        for (const knowledgeCategory of categorySet.knowledge) {
          await apiClient.assignCategoryToQuestion(
            question.id,
            knowledgeCategory.id,
            {
              relevance_score: 1.0,
              is_primary: categorySet.knowledge.length === 1
            }
          );
        }
      }

      // 問題カテゴリを再取得
      await fetchQuestionCategories();
      handleCloseCategoryModal();
      setError(null);
    } catch (error) {
      console.error('カテゴリ保存エラー:', error);
      setError('カテゴリの保存中にエラーが発生しました');
    } finally {
      setSavingCategories(false);
    }
  };

  const handleDeleteQuestionCategory = async (relationId: string) => {
    if (!question?.id || !relationId) return;

    // 削除対象のカテゴリ情報を取得（確認用）
    const categoryToDelete = questionCategories.find(cat => (cat as any).relation_id === relationId || cat.id === relationId);
    const categoryName = categoryToDelete?.path || categoryToDelete?.name || 'カテゴリ';

    // 確認ダイアログ
    if (!confirm(`「${categoryName}」を削除しますか？\n\n※階層パス上のすべてのカテゴリが削除されます`)) {
      return;
    }

    try {
      const { default: apiClient } = await import('../../../../../services/api');
      const result = await apiClient.removeQuestionCategoryRelation(question.id, relationId);

      if (result.success) {
        // 問題カテゴリを再取得
        await fetchQuestionCategories();
        setError(null);
        
        // 削除完了メッセージ
        if ((result.data as any)?.categories_deleted) {
          console.log(`階層カテゴリを削除しました: ${(result.data as any).path} (${(result.data as any).categories_deleted}件)`);
        }
      } else {
        console.error('カテゴリ削除失敗:', result.error);
        setError('カテゴリの削除に失敗しました');
      }
    } catch (error) {
      console.error('カテゴリ削除エラー:', error);
      setError('カテゴリの削除中にエラーが発生しました');
    }
  };

  // チェックエリア関連の関数
  const handleCheckChange = (key: keyof typeof checkList) => {
    setCheckList(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 未登録の画像があるかチェック（任意の問題）
  const hasUnregisteredImagesForQuestion = (q?: Question) => {
    const targetQuestion = q || question;
    if (!targetQuestion) return false;
    
    // 問題画像のチェック
    if (targetQuestion.has_image && (!targetQuestion.question_images || targetQuestion.question_images.length === 0)) {
      return true;
    }
    
    // 選択肢画像のチェック
    for (const choice of targetQuestion.choices) {
      if (choice.has_image) {
        const images = choice.images || (choice as any).choice_images || [];
        if (images.length === 0) {
          return true;
        }
      }
    }
    
    return false;
  };

  // 現在の問題の未登録画像チェック
  const hasUnregisteredImages = () => hasUnregisteredImagesForQuestion();

  const isAllChecked = () => {
    const allItemsChecked = Object.values(checkList).every(checked => checked);
    const noUnregisteredImages = !hasUnregisteredImages();
    return allItemsChecked && noUnregisteredImages;
  };

  const handleCheckComplete = async () => {
    if (!isAllChecked() || !question?.id) return;
    
    try {
      setCheckingQuestion(true);
      const { getUserEmail } = await import('../../../../../lib/auth');
      const userEmail = getUserEmail() || 'unknown@example.com';
      
      const { default: apiClient } = await import('../../../../../services/api');
      const result = await apiClient.markQuestionAsChecked(question.id, userEmail);
      
      if (result.success) {
        // 問題データを更新
        setQuestion(prev => prev ? {
          ...prev,
          is_checked: true,
          checked_at: result.data?.checked_at || new Date().toISOString(),
          checked_by: result.data?.checked_by || userEmail
        } : null);
        
        
        // 成功時の処理
        setCheckAreaExpanded(false);
        console.log('チェック完了:', question.id);
      } else {
        setError('チェック完了の更新に失敗しました');
      }
    } catch (error) {
      console.error('チェック完了の送信に失敗:', error);
      setError('チェック完了の更新中にエラーが発生しました');
    } finally {
      setCheckingQuestion(false);
    }
  };

  // 再チェック用の関数
  const handleReCheck = () => {
    // チェックリストをリセット
    setCheckList({
      questionNumber: false,
      questionContent: false,
      choiceA: false,
      choiceI: false,
      choiceU: false,
      choiceE: false,
      correctAnswer: false,
      appropriateExplanation: false,
      other: false,
    });
    // チェック完了状態をリセット（ローカルのみ）
    if (question) {
      setQuestion(prev => prev ? {
        ...prev,
        is_checked: false,
        checked_at: undefined,
        checked_by: undefined
      } : null);
    }
    // チェックエリアを展開状態で表示
    setCheckAreaExpanded(true);
    setCheckAreaOpen(true);
  };


  const renderChoice = (choice: Choice) => {
    // choice_imagesをimagesとしても使えるようにする
    const images = choice.images || (choice as any).choice_images || [];
    
    // choice_textから画像マークダウンを除去
    const cleanChoiceText = choice.choice_text 
      ? choice.choice_text
          .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '')  // 標準形式 ![alt](url)
          .replace(/\[画像:\s*([^\]]*)\]\(([^)]+)\)/g, '')  // カスタム形式 [画像: alt](url)
          .trim()
      : '';

    if (choice.has_image) {
      return (
        <Box>
          {images && images.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* アップロード済みの画像を表示 */}
              {images.map((image: any) => (
                <Box key={image.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    backgroundColor: 'grey.50',
                    borderRadius: 1,
                    p: 2
                  }}>
                    <img 
                      src={image.image_url} 
                      alt={image.caption || `${choice.choice_label}の画像`}
                      style={{
                        maxWidth: '400px',
                        maxHeight: '300px',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                  </Box>
                  <IconButton
                    onClick={() => openUploadModal(question?.id || '', choice.id, choice.choice_label)}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      boxShadow: 2,
                      '&:hover': {
                        backgroundColor: 'primary.dark'
                      }
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
              ))}
              {/* 画像の説明テキスト */}
              {cleanChoiceText && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <MathRenderer 
                    text={cleanChoiceText}
                    hasImages={images && images.length > 0}
                    shouldShowImages={false}  // 画像はすでに表示済みなので警告ボックスは不要
                  />
                </Typography>
              )}
            </Box>
          ) : (
            <Alert 
              severity="warning"
              iconMapping={{
                warning: <WarningAmberIcon sx={{ fontSize: 40 }} />
              }}
              sx={{ 
                margin: '16px 0',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                '& .MuiAlert-icon': {
                  fontSize: '40px',
                  marginRight: '28px'
                }
              }}
            >
              <Box>
                <strong>画像をアップロードしてください</strong>
                <br />
                選択肢: {choice.choice_label}
                {choice.choice_text && (
                  <>
                    <br />
                    内容: {choice.choice_text}
                  </>
                )}
              </Box>
            </Alert>
          )}
        </Box>
      );
    }

    return (
      <Typography variant="body1">
        <MathRenderer 
          text={cleanChoiceText || choice.choice_text}
          hasImages={choice.has_image && images && images.length > 0}
          shouldShowImages={choice.has_image} 
        />
      </Typography>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error || !question) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || '問題が見つかりませんでした'}
        </Alert>
        <Button onClick={() => router.push(`/exams/${year}/${season}`)}>
          問題一覧に戻る
        </Button>
      </Container>
    );
  }


  return (
    <>
      {/* コンテンツは共通レイアウト（layout.tsx）内に表示される */}

        {/* パンくずリスト */}
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 3 }}
        >
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            color="inherit"
            onClick={() => router.push('/')}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
            トップ
          </Link>
          <Link
            underline="hover"
            sx={{ cursor: 'pointer' }}
            color="inherit"
            onClick={() => router.push(`/exams/${year}/${season}`)}
          >
            {year}年 {seasonJapanese}
          </Link>
          <Typography color="text.primary">
            問{question.question_number}
          </Typography>
        </Breadcrumbs>

        {/* ナビゲーションボタン */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Button
            startIcon={<NavigateBeforeIcon />}
            onClick={() => handleNavigation('prev')}
            disabled={questionNumber <= 1}
            variant="outlined"
          >
            前の問題
          </Button>
          
          <Typography variant="h5" component="h1" textAlign="center">
            問{question.question_number}
          </Typography>
          
          <Button
            endIcon={<NavigateNextIcon />}
            onClick={() => handleNavigation('next')}
            variant="outlined"
          >
            次の問題
          </Button>
        </Box>

        {/* カテゴリ */}
        <Box mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {question.category && (
            <Chip 
              label={question.category.name} 
              size="medium" 
              variant="outlined"
              color="primary"
              sx={{ px: 2, py: 1 }}
            />
          )}
          {questionCategories
            .filter(category => category.level === 5) // ナレッジレベルのみ表示
            .map((category) => {
              // パス情報がある場合は表示、ない場合はカテゴリ名のみ
              const displayLabel = category.path 
                ? `${category.path.replace(/\//g, ' > ')}` 
                : category.name;
              
              return (
                <Chip 
                  key={category.id}
                  label={displayLabel}
                  size="medium"
                  variant="filled"
                  title={category.path ? `パス: ${category.path}` : category.name}
                  sx={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    px: 2,
                    py: 1,
                    fontSize: '0.875rem',
                    '&:hover': {
                      backgroundColor: '#1565c0'
                    }
                  }}
                />
              );
            })}
          <Button
            startIcon={<CategoryIcon />}
            onClick={handleOpenCategoryModal}
            variant="outlined"
            size="small"
            color="info"
          >
            カテゴリ登録
          </Button>
        </Box>

        {/* タグ表示 */}
        {question.tags && question.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mr: 1, color: 'text.secondary' }}>
              タグ:
            </Typography>
            {question.tags
              .sort((a, b) => {
                // 主要タグを先に、その後は関連度順
                if (a.is_primary && !b.is_primary) return -1;
                if (!a.is_primary && b.is_primary) return 1;
                return b.relevance_score - a.relevance_score;
              })
              .map((tag) => (
                <Chip 
                  key={tag.id}
                  label={tag.display_name}
                  size="small"
                  variant={tag.is_primary ? "filled" : "outlined"}
                  title={tag.description ? `${tag.description} (関連度: ${tag.relevance_score})` : `関連度: ${tag.relevance_score}`}
                  sx={{
                    backgroundColor: tag.is_primary ? '#4caf50' : 'transparent',
                    color: tag.is_primary ? 'white' : '#4caf50',
                    borderColor: '#4caf50',
                    fontSize: '0.75rem',
                    '&:hover': {
                      backgroundColor: tag.is_primary ? '#388e3c' : 'rgba(76, 175, 80, 0.1)'
                    }
                  }}
                />
              ))}
          </Box>
        )}

        {/* 問題文 */}
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              問題文
            </Typography>
            <Button
              startIcon={<EditIcon />}
              onClick={handleOpenQuestionTextModal}
              variant="outlined"
              size="small"
            >
              問題文を修正
            </Button>
          </Box>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
            <>
              <MathRenderer 
                text={question.question_text}
                hasImages={question.has_image && question.question_images && question.question_images.length > 0}
                shouldShowImages={false}  // 問題文では警告ボックスを表示しない
              />
              {/* 画像が実際に存在する場合のみimgタグを表示 */}
              {question.has_image && question.question_images && question.question_images.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {question.question_images.map((image: any, index: number) => (
                    <img 
                      key={index}
                      src={image.image_url} 
                      alt="問題画像" 
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  ))}
                </Box>
              )}
              
              {/* 問題画像がない場合の警告ボックス */}
              {question.has_image && (!question.question_images || question.question_images.length === 0) && (
                <Alert 
                  severity="warning"
                  iconMapping={{
                    warning: <WarningAmberIcon sx={{ fontSize: 40 }} />
                  }}
                  sx={{ 
                    margin: '16px 0',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    '& .MuiAlert-icon': {
                      fontSize: '40px',
                      marginRight: '28px'
                    }
                  }}
                >
                  <Box>
                    <strong>画像をアップロードしてください</strong>
                    <br />
                    推奨ファイル名: 問題画像
                  </Box>
                </Alert>
              )}
            </>
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {question.has_image && question.question_images && question.question_images.length > 0 
                ? '画像を変更' 
                : '画像をアップロード'}
            </Typography>
            <IconButton
              onClick={() => openUploadModal(question.id, 'question', '問題文')}
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark'
                }
              }}
            >
              <ImageIcon />
            </IconButton>
          </Box>
        </Paper>

        {/* 選択肢 */}
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              選択肢
            </Typography>
            {!editingCorrectAnswer ? (
              <Button
                startIcon={<EditIcon />}
                onClick={handleStartEditingCorrectAnswer}
                variant="outlined"
                size="small"
              >
                選択肢を修正
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={handleUpdateCorrectAnswer}
                  variant="contained"
                  size="small"
                  color="primary"
                  disabled={
                    !selectedCorrectAnswerId || 
                    updatingCorrectAnswer ||
                    selectedCorrectAnswerId === question?.choices.find(c => c.is_correct === true)?.id
                  }
                >
                  {updatingCorrectAnswer ? '更新中...' : '更新'}
                </Button>
                <Button
                  onClick={handleCancelEditingCorrectAnswer}
                  variant="outlined"
                  size="small"
                  color="secondary"
                >
                  キャンセル
                </Button>
              </Box>
            )}
          </Box>
          
          
          {/* 選択肢の表 */}
          {question.has_choice_table && (
            <Box sx={{ mb: 3 }}>
              {question.choice_table_type === 'markdown' && editingCorrectAnswer && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={handleOpenChoiceTableModal}
                    variant="outlined"
                    size="small"
                  >
                    表を編集
                  </Button>
                  <Button
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteChoiceTable}
                    variant="outlined"
                    size="small"
                    color="error"
                    disabled={deletingChoiceTable}
                  >
                    {deletingChoiceTable ? '削除中...' : '表を削除'}
                  </Button>
                </Box>
              )}
              {question.choice_table_type === 'markdown' && question.choice_table_markdown ? (
                <MarkdownRenderer 
                  hasImages={false}
                  shouldShowImages={false}
                >
                  {question.choice_table_markdown}
                </MarkdownRenderer>
              ) : question.choice_table_type === 'image' ? (
                <Typography color="text.secondary">
                  選択肢の表画像が表示されます（未実装）
                </Typography>
              ) : (
                // 古い形式の表データがある場合の表示（後方互換性）
                question.choices.some(choice => 
                  (choice as any).is_table_format || 
                  (choice as any).table_headers || 
                  (choice as any).table_data
                ) && (
                  <Box>
                    {question.choices.sort((a, b) => a.choice_label.localeCompare(b.choice_label)).map((choice) => {
                      const legacyChoice = choice as any;
                      if (legacyChoice.is_table_format && (legacyChoice.table_headers || legacyChoice.table_data)) {
                        let tableMarkdown = '';
                        if (legacyChoice.table_headers && legacyChoice.table_data) {
                          const headers = Array.isArray(legacyChoice.table_headers) 
                            ? legacyChoice.table_headers 
                            : JSON.parse(legacyChoice.table_headers || '[]');
                          const data = Array.isArray(legacyChoice.table_data) 
                            ? legacyChoice.table_data 
                            : JSON.parse(legacyChoice.table_data || '[]');
                          
                          if (headers.length > 0) {
                            tableMarkdown = `| ${headers.join(' | ')} |\n`;
                            tableMarkdown += `| ${headers.map(() => '---').join(' | ')} |\n`;
                            data.forEach((row: string[]) => {
                              tableMarkdown += `| ${row.join(' | ')} |\n`;
                            });
                          }
                        }
                        
                        return tableMarkdown ? (
                          <Box key={choice.id} sx={{ mb: 2 }}>
                            <MarkdownRenderer 
                              hasImages={false}
                              shouldShowImages={false}
                            >
                              {tableMarkdown}
                            </MarkdownRenderer>
                          </Box>
                        ) : null;
                      }
                      return null;
                    })}
                  </Box>
                )
              )}
            </Box>
          )}
          
          {/* 表形式変換ボタン（通常選択肢かつ編集モードの時のみ表示） */}
          {!question.has_choice_table && editingCorrectAnswer && question.choices && question.choices.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                startIcon={<TableChartIcon />}
                onClick={handleOpenConvertToTableModal}
                variant="outlined"
                size="small"
                color="primary"
              >
                選択肢を表形式にする
              </Button>
            </Box>
          )}

          <Box sx={{ width: '100%' }}>
            {question.choices.sort((a, b) => a.choice_label.localeCompare(b.choice_label)).map((choice) => (
              <Box 
                key={choice.id} 
                sx={{ 
                  mb: 3, 
                  border: '1px solid', 
                  borderColor: choice.is_correct === true ? 'success.main' : 'divider', 
                  borderRadius: 1, 
                  p: 2,
                  backgroundColor: choice.is_correct === true ? '#e8f5e8' : 'transparent',
                  position: 'relative'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 2 }}>
                  {editingCorrectAnswer && (
                    <IconButton
                      onClick={() => setSelectedCorrectAnswerId(choice.id)}
                      disabled={updatingCorrectAnswer}
                      sx={{ 
                        color: selectedCorrectAnswerId === choice.id ? 'success.main' : 'action.disabled',
                        p: 0.5,
                        mt: -0.5
                      }}
                    >
                      {selectedCorrectAnswerId === choice.id ? (
                        <RadioButtonCheckedIcon />
                      ) : (
                        <RadioButtonUncheckedIcon />
                      )}
                    </IconButton>
                  )}
                  <Typography variant="body1" component="span" sx={{ fontWeight: 'bold', minWidth: '30px', flexShrink: 0 }}>
                    {choice.choice_label}.
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    {renderChoice(choice)}
                  </Box>
                  {/* 正答マークを右端に表示（編集モードでない場合のみ） */}
                  {!editingCorrectAnswer && choice.is_correct === true && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      minWidth: '28px',
                      height: '28px',
                      backgroundColor: 'success.main',
                      color: 'white',
                      borderRadius: '50%',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      ml: 1
                    }}>
                      ✓
                    </Box>
                  )}
                </Box>
                {/* 編集モード時のみ編集ボタンと画像ボタンを表示 */}
                {editingCorrectAnswer && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    display: 'flex', 
                    gap: 1 
                  }}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenChoiceEditModal(choice)}
                      sx={{
                        backgroundColor: 'primary.main',
                        color: 'white',
                        boxShadow: 1,
                        '&:hover': {
                          backgroundColor: 'primary.dark'
                        }
                      }}
                      title={`選択肢${choice.choice_label}を編集`}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => openUploadModal(question.id, choice.id, choice.choice_label)}
                      sx={{
                        backgroundColor: 'primary.main',
                        color: 'white',
                        boxShadow: 1,
                        '&:hover': {
                          backgroundColor: 'primary.dark'
                        }
                      }}
                      title={`選択肢${choice.choice_label}に画像を追加`}
                    >
                      <ImageIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Paper>

        {/* 解説 */}
        <Paper elevation={1} sx={{ p: 3, mb: 4, backgroundColor: '#f8f9fa' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              解説
            </Typography>
            <Button
              startIcon={<EditIcon />}
              onClick={handleOpenExplanationModal}
              variant="outlined"
              size="small"
            >
              {question.explanation ? '解説を修正' : '解説を追加'}
            </Button>
          </Box>
          {question.explanation ? (
            <Box sx={{ mt: 2 }}>
              <MarkdownRenderer 
                hasImages={false}
                shouldShowImages={false}
              >
                {question.explanation}
              </MarkdownRenderer>
            </Box>
          ) : (
            <Box sx={{ mt: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1, textAlign: 'center', color: 'text.secondary' }}>
              解説が登録されていません
            </Box>
          )}
        </Paper>

        {/* 問題一覧に戻るボタン */}
        <Box textAlign="center" mt={4}>
          <Button 
            variant="contained" 
            onClick={() => router.push(`/exams/${year}/${season}`)}
            size="large"
          >
            問題一覧に戻る
          </Button>
        </Box>

        {/* チェックエリア */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: 1200
          }}
        >
          {!checkAreaOpen ? (
            <Fab
              color="primary"
              onClick={() => setCheckAreaOpen(true)}
              sx={{
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}
            >
              <PlaylistAddCheckIcon />
            </Fab>
          ) : (
            <Paper
              elevation={8}
              sx={{
                width: 400,
                maxHeight: checkAreaExpanded ? '80vh' : '200px',
                overflow: 'hidden',
                borderRadius: 2
              }}
            >
              {/* ヘッダー */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PlaylistAddCheckIcon />
                  <Typography variant="h6">チェックリスト</Typography>
                </Box>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => setCheckAreaExpanded(!checkAreaExpanded)}
                    sx={{ color: 'white', mr: 1 }}
                  >
                    {checkAreaExpanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setCheckAreaOpen(false)}
                    sx={{ color: 'white' }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>

              <Collapse in={checkAreaExpanded} timeout={200}>
                {/* チェックリスト内容 */}
                <Box sx={{ p: 2, maxHeight: 'calc(80vh - 100px)', overflow: 'auto' }}>
                  {/* チェック完了状態の表示 */}
                  {question?.is_checked && (
                    <Alert 
                      severity="success"
                      sx={{ 
                        mb: 2,
                        '& .MuiAlert-message': {
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        ✅ チェック完了
                      </Typography>
                      <Typography variant="caption" display="block">
                        完了日時: {question.checked_at ? new Date(question.checked_at).toLocaleString('ja-JP') : '不明'}
                      </Typography>
                      <Typography variant="caption" display="block">
                        チェック者: {question.checked_by || '不明'}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleReCheck}
                        sx={{ 
                          mt: 1, 
                          alignSelf: 'flex-start',
                          borderColor: 'success.main',
                          color: 'success.main',
                          '&:hover': {
                            borderColor: 'success.dark',
                            backgroundColor: 'success.light',
                            color: 'success.dark'
                          }
                        }}
                      >
                        再チェックする
                      </Button>
                    </Alert>
                  )}
                  
                  {/* 未登録画像の警告 */}
                  {hasUnregisteredImages() && (
                    <Alert 
                      severity="warning"
                      sx={{ 
                        mb: 2,
                        '& .MuiAlert-message': {
                          width: '100%'
                        }
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        未登録の画像があります
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                        すべての画像を登録してからチェックを完了してください
                      </Typography>
                    </Alert>
                  )}
                  
                  {/* チェックリスト（チェック完了していない場合のみ表示） */}
                  {!question?.is_checked && (
                    <>
                      <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.questionNumber || false}
                          onChange={() => handleCheckChange('questionNumber')}
                        />
                      }
                      label={`問題番号: 問${question?.question_number || ''}`}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.questionContent || false}
                          onChange={() => handleCheckChange('questionContent')}
                        />
                      }
                      label="問題文の内容（画像や表を含む）"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.choiceA || false}
                          onChange={() => handleCheckChange('choiceA')}
                        />
                      }
                      label="選択肢アの内容（画像や表を含む）"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.choiceI || false}
                          onChange={() => handleCheckChange('choiceI')}
                        />
                      }
                      label="選択肢イの内容（画像や表を含む）"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.choiceU || false}
                          onChange={() => handleCheckChange('choiceU')}
                        />
                      }
                      label="選択肢ウの内容（画像や表を含む）"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.choiceE || false}
                          onChange={() => handleCheckChange('choiceE')}
                        />
                      }
                      label="選択肢エの内容（画像や表を含む）"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.correctAnswer || false}
                          onChange={() => handleCheckChange('correctAnswer')}
                        />
                      }
                      label="正答が正しい"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.appropriateExplanation || false}
                          onChange={() => handleCheckChange('appropriateExplanation')}
                        />
                      }
                      label="解説が適切である"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkList.other || false}
                          onChange={() => handleCheckChange('other')}
                        />
                      }
                      label="その他違和感がないか"
                    />
                  </FormGroup>

                  {/* チェック完了ボタン */}
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    disabled={!isAllChecked() || checkingQuestion}
                    onClick={handleCheckComplete}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      fontWeight: 'bold'
                    }}
                  >
                    {checkingQuestion ? 'チェック中...' : 'チェック完了'}
                  </Button>
                    </>
                  )}
                </Box>
              </Collapse>

              {!checkAreaExpanded && (
                <Box sx={{ p: 2 }}>
                  {question?.is_checked ? (
                    <>
                      <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ mb: 1 }}>
                        ✅ 問{question?.question_number || ''}チェック完了
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {question.checked_at ? new Date(question.checked_at).toLocaleString('ja-JP') : '完了日時不明'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                        チェック者: {question.checked_by || '不明'}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={handleReCheck}
                        sx={{ 
                          borderColor: 'success.main',
                          color: 'success.main',
                          '&:hover': {
                            borderColor: 'success.dark',
                            backgroundColor: 'success.light'
                          }
                        }}
                      >
                        再チェックする
                      </Button>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        問{question?.question_number || ''}のチェック
                      </Typography>
                  
                  {/* 未登録画像の警告（コンパクト表示） */}
                  {hasUnregisteredImages() && (
                    <Alert 
                      severity="warning"
                      sx={{ 
                        mb: 2,
                        py: 0.5,
                        '& .MuiAlert-message': {
                          fontSize: '0.75rem'
                        }
                      }}
                    >
                      未登録の画像があります
                    </Alert>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="body2">
                      {Object.values(checkList).filter(checked => checked).length} / {Object.keys(checkList).length} 完了
                    </Typography>
                    <Box sx={{ flexGrow: 1 }}>
                      {/* プログレスバー風の表示 */}
                      <Box
                        sx={{
                          height: 4,
                          bgcolor: 'grey.300',
                          borderRadius: 2,
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            bgcolor: isAllChecked() ? 'success.main' : 'primary.main',
                            width: `${(Object.values(checkList).filter(checked => checked).length / Object.keys(checkList).length) * 100}%`,
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    disabled={!isAllChecked() || checkingQuestion}
                    onClick={handleCheckComplete}
                    size="small"
                  >
                    {checkingQuestion ? 'チェック中...' : 'チェック完了'}
                  </Button>
                    </>
                  )}
                </Box>
              )}
            </Paper>
          )}
        </Box>

        {/* 画像アップロードモーダル */}
        <Modal
          open={uploadModal.open}
          onClose={closeUploadModal}
          aria-labelledby="upload-modal-title"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 600 },
              bgcolor: 'background.paper',
              boxShadow: 24,
              borderRadius: 2,
              p: 4,
            }}
          >
            <Typography id="upload-modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
              {uploadModal.choiceLabel}の画像をアップロード
            </Typography>
            <ImageUpload
              questionId={uploadModal.questionId}
              choiceId={uploadModal.choiceId}
              choiceLabel={uploadModal.choiceLabel}
              onImageUploaded={() => {
                // 画像アップロード後はデータを再取得
                fetchQuestions();
                closeUploadModal();
              }}
            />
          </Box>
        </Modal>

        {/* 問題文修正モーダル */}
        <Modal
          open={questionTextModal.open}
          onClose={handleCloseQuestionTextModal}
          aria-labelledby="question-text-modal-title"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '80%', md: '70%' },
              bgcolor: 'background.paper',
              boxShadow: 24,
              borderRadius: 2,
              p: 4,
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <Typography id="question-text-modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
              問題文を修正
            </Typography>
            <TextField
              multiline
              rows={10}
              fullWidth
              variant="outlined"
              label="問題文"
              value={questionTextModal.text}
              onChange={(e) => setQuestionTextModal(prev => ({...prev, text: e.target.value}))}
              sx={{ mb: 3 }}
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCloseQuestionTextModal}
                variant="outlined"
                disabled={updatingQuestionText}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleUpdateQuestionText}
                variant="contained"
                disabled={
                  updatingQuestionText || 
                  !questionTextModal.text.trim() ||
                  questionTextModal.text.trim() === question?.question_text
                }
              >
                {updatingQuestionText ? '更新中...' : '更新'}
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* 解説修正モーダル */}
        <Modal
          open={explanationModal.open}
          onClose={handleCloseExplanationModal}
          aria-labelledby="explanation-modal-title"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '80%', md: '70%' },
              bgcolor: 'background.paper',
              boxShadow: 24,
              borderRadius: 2,
              p: 4,
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <Typography id="explanation-modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
              解説を{question?.explanation ? '修正' : '追加'}
            </Typography>
            <TextField
              multiline
              rows={12}
              fullWidth
              variant="outlined"
              label="解説"
              value={explanationModal.text}
              onChange={(e) => setExplanationModal(prev => ({...prev, text: e.target.value}))}
              placeholder="Markdownで解説を記述してください..."
              sx={{ mb: 3 }}
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCloseExplanationModal}
                variant="outlined"
                disabled={updatingExplanation}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleUpdateExplanation}
                variant="contained"
                disabled={
                  updatingExplanation ||
                  explanationModal.text === (question?.explanation || '')
                }
              >
                {updatingExplanation ? '更新中...' : '更新'}
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* 選択肢編集モーダル */}
        <Modal
          open={choiceEditModal.open}
          onClose={handleCloseChoiceEditModal}
          aria-labelledby="choice-edit-modal-title"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '80%', md: '70%' },
              bgcolor: 'background.paper',
              boxShadow: 24,
              borderRadius: 2,
              p: 4,
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <Typography id="choice-edit-modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
              選択肢{choiceEditModal.choiceLabel}を編集
            </Typography>
            <TextField
              multiline
              rows={8}
              fullWidth
              variant="outlined"
              label={`選択肢${choiceEditModal.choiceLabel}のテキスト`}
              value={choiceEditModal.text}
              onChange={(e) => setChoiceEditModal(prev => ({...prev, text: e.target.value}))}
              placeholder="Markdownで選択肢テキストを記述してください..."
              sx={{ mb: 3 }}
              helperText="生のMarkdownテキストを編集できます。数式は $$数式$$ の形式で記述してください。"
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCloseChoiceEditModal}
                variant="outlined"
                disabled={updatingChoiceText}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleUpdateChoiceText}
                variant="contained"
                disabled={
                  updatingChoiceText ||
                  (choiceEditModal.text || '') === (question?.choices.find(c => c.id === choiceEditModal.choiceId)?.choice_text || '')
                }
              >
                {updatingChoiceText ? '更新中...' : '更新'}
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* 表形式選択肢編集モーダル */}
        <Modal
          open={choiceTableModal.open}
          onClose={handleCloseChoiceTableModal}
          aria-labelledby="choice-table-modal-title"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '80%', md: '70%' },
              bgcolor: 'background.paper',
              boxShadow: 24,
              borderRadius: 2,
              p: 4,
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <Typography id="choice-table-modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
              選択肢表を編集
            </Typography>
            <TextField
              multiline
              rows={12}
              fullWidth
              variant="outlined"
              label="選択肢表（Markdownテーブル形式）"
              value={choiceTableModal.text}
              onChange={(e) => setChoiceTableModal(prev => ({...prev, text: e.target.value}))}
              placeholder="Markdownテーブル形式で選択肢表を記述してください..."
              sx={{ mb: 3 }}
              helperText="例: | | 送信元ポート番号 | 宛先ポート番号 |"
            />
            
            {/* プレビュー表示 */}
            {choiceTableModal.text && (
              <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: 'grey.50' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  プレビュー:
                </Typography>
                <MarkdownRenderer 
                  hasImages={false}
                  shouldShowImages={false}
                >
                  {choiceTableModal.text}
                </MarkdownRenderer>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCloseChoiceTableModal}
                variant="outlined"
                disabled={updatingChoiceTable}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleUpdateChoiceTable}
                variant="contained"
                disabled={
                  updatingChoiceTable ||
                  choiceTableModal.text === (question?.choice_table_markdown || '')
                }
              >
                {updatingChoiceTable ? '更新中...' : '更新'}
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* 選択肢を表形式に変換するモーダル */}
        <Modal
          open={convertToTableModal.open}
          onClose={handleCloseConvertToTableModal}
          aria-labelledby="convert-to-table-modal-title"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '80%', md: '70%' },
              bgcolor: 'background.paper',
              boxShadow: 24,
              borderRadius: 2,
              p: 4,
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <Typography id="convert-to-table-modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
              選択肢を表形式にする
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              選択肢を表形式で表示します。表として表示され、個別の選択肢編集はできなくなります。
            </Alert>
            
            <TextField
              multiline
              rows={10}
              fullWidth
              variant="outlined"
              label="選択肢表（Markdownテーブル形式）"
              value={convertToTableModal.text}
              onChange={(e) => setConvertToTableModal(prev => ({...prev, text: e.target.value}))}
              sx={{ mb: 3 }}
              helperText="例: | 選択肢 | 内容 |"
              placeholder="Markdownテーブル形式で入力してください...&#10;例:&#10;| 選択肢 | 内容 |&#10;| --- | --- |&#10;| ア | 内容1 |&#10;| イ | 内容2 |"
            />
            
            {/* プレビュー表示 */}
            {convertToTableModal.text && (
              <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: 'grey.50' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  プレビュー:
                </Typography>
                <MarkdownRenderer 
                  hasImages={false}
                  shouldShowImages={false}
                >
                  {convertToTableModal.text}
                </MarkdownRenderer>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCloseConvertToTableModal}
                variant="outlined"
                disabled={convertingToTable}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleConvertToTable}
                variant="contained"
                disabled={convertingToTable || !convertToTableModal.text.trim()}
              >
                {convertingToTable ? '更新中...' : '更新'}
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* カテゴリ登録モーダル */}
        <Modal
          open={categoryModal}
          onClose={handleCloseCategoryModal}
          aria-labelledby="category-modal-title"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '95%', sm: '90%', md: '80%', lg: '70%' },
              bgcolor: 'background.paper',
              boxShadow: 24,
              borderRadius: 2,
              p: 4,
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography id="category-modal-title" variant="h6" component="h2">
                問{question?.question_number}のカテゴリ登録
              </Typography>
              <IconButton onClick={handleCloseCategoryModal}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* 問題文表示 */}
            {question && (
              <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  問題文:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  <MathRenderer 
                    text={question.question_text}
                    hasImages={question.has_image && question.question_images && question.question_images.length > 0}
                    shouldShowImages={false}
                  />
                </Typography>
                {/* 問題画像がある場合の表示 */}
                {question.has_image && question.question_images && question.question_images.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {question.question_images.map((image: any, index: number) => (
                      <img 
                        key={index}
                        src={image.image_url} 
                        alt="問題画像" 
                        style={{ 
                          maxWidth: '100%', 
                          height: 'auto', 
                          maxHeight: '200px',
                          objectFit: 'contain'
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Paper>
            )}

            {loadingCategories && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            )}

            {/* 現在のカテゴリ表示 */}
            {questionCategories.filter(category => category.level === 5).length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>現在登録されているカテゴリ:</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {questionCategories
                    .filter(category => category.level === 5) // ナレッジレベルのみ表示
                    .map((category) => {
                      // パス情報がある場合はフルパス表示
                      const displayLabel = category.path 
                        ? category.path.replace(/\//g, ' > ')
                        : category.name;
                      
                      return (
                        <Chip 
                          key={category.id}
                          label={displayLabel}
                          size="medium"
                          variant="filled"
                          onDelete={() => handleDeleteQuestionCategory((category as any).relation_id || category.id)}
                          deleteIcon={<DeleteIcon />}
                          title={category.path ? `パス: ${category.path}` : category.name}
                          sx={{
                            backgroundColor: '#1976d2',
                            color: 'white',
                            px: 2,
                            py: 1.5,
                            fontSize: '0.875rem',
                            '&:hover': {
                              backgroundColor: '#1565c0'
                            },
                            '& .MuiChip-deleteIcon': {
                              color: 'rgba(255, 255, 255, 0.7)',
                              '&:hover': {
                                color: 'white'
                              }
                            }
                          }}
                        />
                      );
                    })}
                </Box>
              </Box>
            )}

            {/* カテゴリ選択セット */}
            {categorySets.map((categorySet, index) => (
              <Paper key={categorySet.id} elevation={1} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">カテゴリセット {index + 1}</Typography>
                  {categorySets.length > 1 && (
                    <IconButton 
                      onClick={() => removeCategorySet(categorySet.id)}
                      size="small"
                      color="error"
                    >
                      <RemoveIcon />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
                  {/* 分野選択 */}
                  <FormControl fullWidth>
                    <InputLabel>分野</InputLabel>
                    <Select
                      value={categorySet.field?.name || ''}
                      label="分野"
                      onChange={(e) => {
                        const field = getCategoriesByType('field').find(c => c.name === e.target.value);
                        updateCategorySet(categorySet.id, { 
                          field, 
                          major: undefined, 
                          medium: undefined, 
                          minor: undefined, 
                          knowledge: [] 
                        });
                      }}
                    >
                      {getCategoriesByType('field').map((category) => (
                        <MenuItem key={category.id} value={category.name}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* カテゴリ大選択 */}
                  <FormControl fullWidth disabled={!categorySet.field}>
                    <InputLabel>カテゴリ大</InputLabel>
                    <Select
                      value={categorySet.major?.name || ''}
                      label="カテゴリ大"
                      onChange={(e) => {
                        const major = getCategoriesByType('major', categorySet.field?.name).find(c => c.name === e.target.value);
                        updateCategorySet(categorySet.id, { 
                          major, 
                          medium: undefined, 
                          minor: undefined, 
                          knowledge: [] 
                        });
                      }}
                    >
                      {getCategoriesByType('major', categorySet.field?.name).map((category) => (
                        <MenuItem key={category.id} value={category.name}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* カテゴリ中選択 */}
                  <FormControl fullWidth disabled={!categorySet.major}>
                    <InputLabel>カテゴリ中</InputLabel>
                    <Select
                      value={categorySet.medium?.name || ''}
                      label="カテゴリ中"
                      onChange={(e) => {
                        const medium = getCategoriesByType('medium', categorySet.major?.name).find(c => c.name === e.target.value);
                        updateCategorySet(categorySet.id, { 
                          medium, 
                          minor: undefined, 
                          knowledge: [] 
                        });
                      }}
                    >
                      {getCategoriesByType('medium', categorySet.major?.name).map((category) => (
                        <MenuItem key={category.id} value={category.name}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* カテゴリ小選択 */}
                  <FormControl fullWidth disabled={!categorySet.medium}>
                    <InputLabel>カテゴリ小</InputLabel>
                    <Select
                      value={categorySet.minor?.name || ''}
                      label="カテゴリ小"
                      onChange={(e) => {
                        const minor = getCategoriesByType('minor', categorySet.medium?.name).find(c => c.name === e.target.value);
                        updateCategorySet(categorySet.id, { minor, knowledge: [] });
                      }}
                    >
                      {getCategoriesByType('minor', categorySet.medium?.name).map((category) => (
                        <MenuItem key={category.id} value={category.name}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* ナレッジ選択（複数選択可） */}
                <Box sx={{ mt: 3 }}>
                  <Autocomplete
                    multiple
                    value={categorySet.knowledge}
                    onChange={(_, newValue) => {
                      updateCategorySet(categorySet.id, { knowledge: newValue });
                    }}
                    options={getCategoriesByType('knowledge', categorySet.minor?.name)}
                    getOptionLabel={(option) => option.name}
                    disabled={!categorySet.minor}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="ナレッジ（複数選択可）"
                        placeholder="ナレッジを選択してください"
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                          <Chip
                            key={option.id}
                            variant="outlined"
                            label={option.name}
                            {...tagProps}
                          />
                        );
                      })
                    }
                  />
                </Box>
              </Paper>
            ))}

            {/* カテゴリセット追加ボタン */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Button
                startIcon={<AddIcon />}
                onClick={addCategorySet}
                variant="outlined"
                color="primary"
              >
                カテゴリセットを追加
              </Button>
            </Box>

            {/* 保存・キャンセルボタン */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCloseCategoryModal}
                variant="outlined"
                disabled={savingCategories}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleSaveCategories}
                variant="contained"
                disabled={
                  savingCategories ||
                  categorySets.every(set => set.knowledge.length === 0)
                }
              >
                {savingCategories ? '保存中...' : 'カテゴリを保存'}
              </Button>
            </Box>
          </Box>
        </Modal>
    </>
  );
}