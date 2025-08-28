# フロントエンド開発ルール (最新版)

Next.js(React)を使用したFexa試験問題管理システムのフロントエンド開発ルールです。

## 基本方針

### 目的・用途
- **試験問題管理システム**: 基本情報技術者試験の過去問データベース
- **問題表示・管理**: LaTeX数式、Markdownテーブル、画像対応
- **認証システム**: JWT認証による管理者機能
- **画像アップロード**: ドラッグ&ドロップによる画像管理

### 技術選択
- **Next.js 14**: App Router使用
- **TypeScript**: 型安全性重視
- **Material-UI (MUI)**: モダンなUIコンポーネント
- **KaTeX**: LaTeX数式レンダリング
- **React hooks**: 状態管理（useState/useEffect）

## ディレクトリ構成

```
frontend/src/
├── app/
│   ├── layout.tsx                    # 共通レイアウト
│   ├── page.tsx                      # メインページ（問題一覧）
│   ├── login/page.tsx                # 認証ページ
│   ├── exams/[year]/[season]/       # 年度・季節別問題一覧
│   │   └── page.tsx
│   └── exams/[year]/[season]/[qnumber]/  # 問題詳細ページ
│       └── page.tsx
├── components/
│   ├── AuthProvider.tsx              # 認証コンテキスト
│   ├── MathRenderer.tsx              # LaTeX/Markdown レンダリング
│   ├── ImageUpload.tsx               # ファイルアップロード
│   └── QuestionCard.tsx              # 問題カード
├── services/
│   └── api.ts                        # API呼び出し（認証対応）
├── lib/
│   └── auth.ts                       # 認証ユーティリティ
└── types/
    └── api.ts                        # 型定義
```

## API連携

### APIクライアント設計
```typescript
class ApiClient {
  private baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:43001';
  
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }
  
  async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const headers = await this.getAuthHeaders();
    // 自動トークンリフレッシュ、エラーハンドリング付きfetch実装
  }
  
  // 認証関連
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>>
  async refresh(refreshToken: string): Promise<ApiResponse<AuthResponse>>
  async logout(): Promise<void>
  
  // データ取得
  async getExams(): Promise<ApiResponse<Exam[]>>
  async getQuestions(params?): Promise<ApiResponse<Question[]>>
  async getQuestion(id: string): Promise<ApiResponse<Question>>
  
  // 画像アップロード
  async uploadQuestionImage(questionId: string, file: File): Promise<ApiResponse<any>>
  async uploadChoiceImage(choiceId: string, file: File): Promise<ApiResponse<any>>
}
```

### エラーハンドリング
- API接続エラーは日本語で表示
- JWT認証エラー時の自動ログアウト
- ローディング状態の表示
- 404エラーの適切な処理
- ファイルアップロードエラーの詳細表示
- タイムアウト処理（30秒）

### 状態管理
- React hooks（useState/useEffect）+ Context API
- AuthProvider による認証状態の全体管理
- ローカルストレージでのトークン永続化
- コンポーネント間でのprops受け渡し

## UI設計

### デザインコンセプト
- **Material Design**: MUIによる統一されたデザインシステム
- **機能重視**: 直感的で使いやすいインターフェース
- **レスポンシブ対応**: モバイルファースト
- **アクセシビリティ**: 適切なコントラストとARIAラベル

### Material-UI テーマ
```typescript
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // MUI デフォルトブルー
    },
    secondary: {
      main: '#dc004e', // アクセントカラー
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Noto Sans JP", sans-serif',
  },
});
```

### コンポーネント設計
```typescript
// 基本的なprops定義
interface QuestionCardProps {
  question: Question;
  onClick?: (id: string) => void;
}

// MUIコンポーネントの活用
const QuestionCard: React.FC<QuestionCardProps> = ({ question, onClick }) => {
  return (
    <Card elevation={2} sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" component="h2">
          問{question.question_number}
        </Typography>
        <MathRenderer text={question.question_text} />
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => onClick?.(question.id)}>
          詳細を見る
        </Button>
      </CardActions>
    </Card>
  );
};
```

## ページ構成

### メインページ（/）
**機能**:
- 年度・季節別の問題一覧表示
- LaTeX数式とMarkdownテーブルのレンダリング
- 認証状態の表示とログイン/ログアウト
- 問題検索とフィルタリング（年度・季節）

**表示項目**:
- 各問題の基本情報（年度・季節・問題番号・問題種別）
- 問題文のプレビュー（LaTeX数式対応）
- 画像の有無表示
- 選択肢テーブルの有無表示
- 詳細ページへのナビゲーション

### 問題詳細ページ（/exams/[year]/[season]/[qnumber]）
**機能**:
- 1問の完全な表示（LaTeX数式、Markdownテーブル対応）
- 画像アップロード機能（ドラッグ&ドロップ）
- 選択肢テーブルの表示（問題レベルで管理）
- 解答選択とフィードバック
- 画像の動的表示/警告表示

**表示項目**:
- 問題メタデータ（年度・季節・問題番号・問題種別）
- 問題文（LaTeX数式レンダリング、画像警告対応）
- 画像アップロード用モーダルUI
- 選択肢テーブル（Markdownテーブルまたは画像）
- 選択肢（ア・イ・ウ・エ、画像含む）
- 正解と解説（認証後表示）

### 認証ページ（/login）
**機能**:
- 管理者ログイン機能
- JWT認証の実装
- 自動リダイレクト機能
- エラーハンドリング

**表示項目**:
- ログインフォーム（ユーザー名・パスワード）
- エラーメッセージ表示
- ローディング状態
- ログイン成功後のリダイレクト

### 画像アップロード機能（モーダル）
**機能**:
- ドラッグ&ドロップでの画像アップロード
- ファイル選択による画像アップロード
- アップロード進捗の表示
- 画像プレビュー機能
- UUIDベースファイル管理

**表示項目**:
- アップロード用ドロップゾーン
- ファイル選択ボタン
- アップロード進捗バー
- エラーメッセージ表示
- 成功時のフィードバック

### 共通レイアウト
- シンプルなヘッダー（プロジェクト名）
- パンくずリスト
- フッター（著作権表示）
- 管理機能へのナビゲーション

## データ表示

### 問題一覧表示
```typescript
// カード形式での表示
<div style={{ display: 'grid', gap: '1rem' }}>
  {questions.map(question => (
    <QuestionCard key={question.id} question={question} />
  ))}
</div>
```

### 検索・フィルタ機能
- 年度での絞り込み
- 季節（春期・秋期）での絞り込み
- 問題種別（午前・午後）での絞り込み
- 問題文での部分一致検索は実装しない（API負荷考慮）

### ページング
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
```

## 状態管理パターン

### 認証状態管理パターン
```typescript
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // トークン検証とユーザー情報取得
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await apiClient.login(credentials);
    if (response.success) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      setUser({ username: credentials.username });
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

### データフェッチパターン
const [questions, setQuestions] = useState<Question[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string>('');
const { user } = useAuth();

const loadQuestions = async (params?: SearchParams) => {
  if (!user) {
    setError('認証が必要です');
    return;
  }
  
  setLoading(true);
  setError('');
  try {
    const response = await apiClient.getQuestions(params);
    if (response.success) {
      setQuestions(response.data || []);
    } else {
      setError(response.error?.message || 'データの取得に失敗しました');
    }
  } catch (error) {
    if (error.status === 401) {
      // 認証エラー時のハンドリング
      logout();
      router.push('/login');
    } else {
      setError('ネットワークエラーが発生しました');
    }
  } finally {
    setLoading(false);
  }
};
```

### エラー表示（Material-UI）
```typescript
{error && (
  <Alert severity="error" sx={{ mb: 2 }}>
    {error}
  </Alert>
)}

{/* ローディング表示 */}
{loading && (
  <Box display="flex" justifyContent="center" p={2}>
    <CircularProgress />
  </Box>
)}
```

## 画像アップロード機能

### MathRenderer コンポーネント
```typescript
interface MathRendererProps {
  text: string;
  hasImages?: boolean;    // 実際の画像が存在するかどうか
  shouldShowImages?: boolean; // has_imageフラグの状態
}

// LaTeX数式、Markdownテーブル、画像警告を統合処理
const MathRenderer: React.FC<MathRendererProps> = ({ text, hasImages = false, shouldShowImages = false }) => {
  if (!text) return null;

  // 画像マークダウンを検出して警告ボックスに変換
  // LaTeX数式をKaTeXでレンダリング
  // Markdownテーブルを Material-UI Table でレンダリング
};
```

### ドラッグ&ドロップ実装
```typescript
const [dragActive, setDragActive] = useState(false);

const handleDrop = useCallback(async (e: React.DragEvent) => {
  e.preventDefault();
  setDragActive(false);
  
  const files = Array.from(e.dataTransfer.files);
  const imageFiles = files.filter(file => 
    file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB制限
  );
  
  if (imageFiles.length > 0) {
    await uploadImage(imageFiles[0]); // 1ファイルのみ
  }
}, []);

const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const endpoint = isQuestionImage 
    ? `/api/images/upload/question/${questionId}`
    : `/api/images/upload/choice/${choiceId}`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: formData
    });
    
    if (response.ok) {
      setUploadSuccess(true);
      onUploadSuccess?.(); // 親コンポーネントに通知
    } else {
      const errorData = await response.json();
      setError(errorData.error?.message || 'アップロードに失敗しました');
    }
  } catch (error) {
    setError('ネットワークエラーが発生しました');
  }
};
```

### 画像表示コンポーネント（Material-UI版）
```typescript
interface ImageDisplayProps {
  src?: string;
  alt: string;
  filename: string;
  hasImage: boolean;
  shouldShowImages: boolean;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ src, alt, filename, hasImage, shouldShowImages }) => {
  if (!shouldShowImages) {
    return null; // 画像マークダウンを表示しない
  }
  
  if (!hasImage) {
    return (
      <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ my: 2 }}>
        <AlertTitle>画像が見つかりません</AlertTitle>
        推奨ファイル名: <strong>{filename}</strong><br />
        {alt && <Typography variant="body2" color="text.secondary">{alt}</Typography>}
      </Alert>
    );
  }
  
  return (
    <Box sx={{ my: 2, textAlign: 'left' }}>
      <img 
        src={src} 
        alt={alt} 
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          border: '1px solid #e0e0e0',
          borderRadius: '4px'
        }} 
      />
    </Box>
  );
};
```

### アップロード状態管理
```typescript
const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
const [uploadStatus, setUploadStatus] = useState<Record<string, 'pending' | 'uploading' | 'success' | 'error'>>({});

const updateImageStatus = async (filename: string, isUploaded: boolean) => {
  try {
    const response = await fetch('/api/update-image-status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, isUploaded })
    });
    
    if (response.ok) {
      // UI状態を更新
      setUploadStatus(prev => ({ ...prev, [filename]: 'success' }));
      // 画像一覧を再取得
      await refreshImageList();
    }
  } catch (error) {
    setUploadStatus(prev => ({ ...prev, [filename]: 'error' }));
  }
};
```

## パフォーマンス

### 最適化方針
- 不要な再レンダリングの防止
- 大きな画像の遅延読み込み
- APIレスポンスのキャッシュ（Next.jsのデフォルト機能活用）
- 画像アップロード時の進捗表示

### 読み込み状態
```typescript
{loading ? (
  <div style={{ textAlign: 'center', padding: '2rem' }}>
    読み込み中...
  </div>
) : (
  // コンテンツ表示
)}
```

## アクセシビリティ

### 基本対応
- セマンティックHTML使用
- 適切なaria-label設定
- キーボードナビゲーション対応
- カラーコントラスト確保

### スクリーンリーダー対応
```tsx
<button 
  aria-label={`問題${question.question_number}の詳細を表示`}
  onClick={() => router.push(`/questions/${question.id}`)}
>
  詳細を見る
</button>
```

## 環境設定

### 環境変数
```env
# 開発環境
NEXT_PUBLIC_API_BASE_URL=http://localhost:43001

# 本番環境
# NEXT_PUBLIC_API_BASE_URL=https://api.example.com

# 認証設定
NEXTPUBLIC_APP_NAME=Fexa
```

### Next.js設定
```javascript
// next.config.js
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true, // App Router使用
  },
  // 画像最適化設定
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
};

module.exports = nextConfig;
```

## テスト・品質保証

### ブラウザテスト
- Chrome/Firefox/Safari での動作確認
- モバイル端末でのレスポンシブ表示確認
- 認証フローのテスト
- 画像アップロード機能のテスト
- LaTeX数式レンダリングの確認
- Markdownテーブル表示の確認

### 機能テスト
- JWT認証とトークンリフレッシュ
- 画像アップロード（問題・選択肢別）
- 選択肢テーブル表示（新形式・旧形式対応）
- 数式レンダリング（inline/block）
- エラーハンドリング（認証・ネットワーク・アップロード）
- 日本語の文字化け確認

このシンプルな設計により、開発・保守が容易で、APIの動作確認に必要十分な機能を提供できます。