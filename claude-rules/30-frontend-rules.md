# Frontend 開発仕様 (Next.js App Router版)

## システム概要

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **UI ライブラリ**: Material-UI (MUI) v5
- **数式レンダリング**: KaTeX
- **認証**: JWT認証 (localStorage管理)
- **用途**: 基本情報技術者試験 問題管理システム
- **デプロイ**: Vercel (開発・本番)

## ページ構成

### 1. トップページ (`/`)
**機能**: 試験選択画面
- 年度・季節別の試験一覧表示
- 各試験の統計情報（総問題数、チェック済み数、カテゴリ登録済み数）
- カテゴリ登録完了バッジ（70問以上で表示）
- レスポンシブデザイン（カードレイアウト）

### 2. ログインページ (`/login`)
**機能**: 管理者認証
- JWT認証フォーム
- 自動リダイレクト機能
- エラーハンドリング
- 認証状態の永続化

### 3. 問題一覧ページ (`/exams/[year]/[season]`)
**機能**: 年度・季節別問題表示
- サイドバーナビゲーション（QuestionSidebar）
- フィルタリング機能
- 問題の進捗状況表示
- SPA方式での高速ナビゲーション

### 4. 問題詳細ページ (`/exams/[year]/[season]/[qnumber]`)
**機能**: 個別問題表示・チェック
- LaTeX数式レンダリング
- Markdownテーブル表示
- 画像表示・警告システム
- 問題チェック機能
- 前後問題ナビゲーション
- リアルタイムUI更新

## ディレクトリ構造

```
frontend/src/
├── app/
│   ├── layout.tsx                    # ルートレイアウト
│   ├── page.tsx                      # トップページ（試験選択）
│   ├── login/
│   │   └── page.tsx                  # ログインページ
│   └── exams/[year]/[season]/
│       ├── layout.tsx                # 問題共通レイアウト
│       ├── page.tsx                  # 問題一覧
│       └── [qnumber]/
│           └── page.tsx              # 問題詳細
├── components/
│   ├── AuthProvider.tsx             # 認証コンテキスト
│   ├── Header.tsx                   # ヘッダーコンポーネント
│   ├── QuestionSidebar.tsx          # サイドバーナビゲーション
│   ├── MathRenderer.tsx             # LaTeX・Markdown・画像レンダラー
│   ├── ImageUpload.tsx              # 画像アップロード（未実装）
│   └── QuestionFeatures.tsx         # 問題特徴表示
├── contexts/
│   ├── FilterContext.tsx            # フィルター状態管理
│   └── QuestionsContext.tsx         # 問題データ共有
├── services/
│   └── api.ts                       # APIクライアント
├── lib/
│   └── auth.ts                      # 認証ユーティリティ
└── types/
    └── api.ts                       # TypeScript型定義
```

## コンポーネント仕様

### AuthProvider
```typescript
interface AuthContextType {
  isLoggedIn: boolean;
  handleLogin: () => void;
  handleLogout: () => void;
  handleAuthError: (error: AuthError) => void;
}

// 機能
- JWT認証状態の管理
- localStorage による永続化
- 自動リダイレクト処理
- 未認証時のログイン画面遷移
```

### QuestionSidebar
```typescript
interface QuestionSidebarProps {
  questions: Question[];
  filters: FilterState;
  onFilterChange: (filter: FilterType) => void;
  onQuestionClick: (questionId: string, questionNumber: number) => void;
  currentQuestionNumber?: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
  drawerWidth: number;
}

// 機能
- 問題一覧のナビゲーション
- フィルタリング（チェック済み/未チェック、画像有無等）
- 現在表示中の問題ハイライト
- レスポンシブデザイン（モバイル対応）
- リアルタイム更新対応
```

### MathRenderer
```typescript
interface MathRendererProps {
  text: string;
}

// 機能
- LaTeX数式のKaTeX レンダリング
- Markdownテーブルの Material-UI Table変換
- 画像参照の警告表示
- HTMLエスケープ処理
```

### QuestionsContext
```typescript
interface QuestionsContextType {
  questions: Question[];
  getQuestionIdByNumber: (questionNumber: number) => string | null;
  getAdjacentQuestions: (currentNumber: number) => {
    prevId: string | null;
    nextId: string | null;
  };
  updateQuestionStatus: (questionId: string, updates: Partial<Question>) => void;
}

// 機能
- サイドバーと詳細ページ間でのデータ共有
- 問題状態のリアルタイム同期
- 隣接問題の取得
```

## API 連携

### ApiClient クラス
```typescript
class ApiClient {
  // 認証付きリクエスト
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>>
  
  // エンドポイント
  async getHealth(): Promise<ApiResponse<HealthStatus>>
  async getExams(): Promise<ApiResponse<Exam[]>>
  async getQuestions(params?): Promise<ApiResponse<Question[]>>
  async getQuestionsList(params?): Promise<ApiResponse<Question[]>>  // 軽量版
  async getQuestion(id: string): Promise<ApiResponse<Question>>
  async updateQuestionCheck(id: string, isChecked: boolean): Promise<ApiResponse<any>>
}

// エラーハンドリング
- 401エラー時の自動ログアウト
- ネットワークエラーの適切な表示
- 日本語エラーメッセージ
```

### 認証管理
```typescript
// lib/auth.ts
export const login = (token: string) => {
  localStorage.setItem('authToken', token);
};

export const logout = () => {
  localStorage.removeItem('authToken');
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};
```

## 状態管理パターン

### 問題データ管理
```typescript
// layout.tsx での軽量データ取得
const [questions, setQuestions] = useState<Question[]>([]);

useEffect(() => {
  const fetchQuestionsList = async () => {
    const result = await apiClient.getQuestionsList({ year, season });
    if (result.success) {
      setQuestions(result.data || []);
    }
  };
  fetchQuestionsList();
}, [year, season]);

// 詳細ページでの個別データ取得
const [question, setQuestion] = useState<Question | null>(null);

useEffect(() => {
  const fetchQuestion = async () => {
    if (questionId) {
      const result = await apiClient.getQuestion(questionId);
      if (result.success) {
        setQuestion(result.data);
      }
    }
  };
  fetchQuestion();
}, [questionId]);
```

### フィルター状態管理
```typescript
// FilterContext
const [filters, setFilters] = useState<FilterState>({
  showCheckedOnly: false,
  showUncheckedOnly: false,
  showWithImages: false,
  showWithTables: false,
});

const toggleFilter = (filterType: FilterType) => {
  setFilters(prev => ({
    ...prev,
    [filterType]: !prev[filterType]
  }));
};
```

## UI デザイン

### Material-UI テーマ
```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // MUIデフォルトブルー
    },
    secondary: {
      main: '#dc004e', // アクセントレッド
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});
```

### レスポンシブデザイン
```typescript
// サイドバー幅の調整
const drawerWidth = 450;

// ブレークポイント対応
sx={{
  width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' }
}}

// モバイル対応
<IconButton
  sx={{ display: { md: 'none' } }}
  onClick={handleDrawerToggle}
>
  <MenuIcon />
</IconButton>
```

### 問題表示コンポーネント
```typescript
// カードレイアウト
<Card sx={{ 
  height: '100%',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 6,
  }
}}>
  <CardActionArea onClick={() => handleExamClick(exam)}>
    <CardContent>
      <Typography variant="h2">{getSeasonIcon(exam.season)}</Typography>
      <Chip 
        label={exam.season}
        color={getSeasonColor(exam.season)}
        size="medium"
      />
    </CardContent>
  </CardActionArea>
</Card>
```

## パフォーマンス最適化

### データフェッチ戦略
```typescript
// 軽量リスト取得（サイドバー用）
const getQuestionsList = async (params) => {
  // 必要最小限のフィールドのみ取得
  // question_text, choices, images は含まない
};

// 詳細データ取得（個別ページ用）
const getQuestion = async (id) => {
  // 完全なデータを取得
  // explanation, 全選択肢, 画像情報等
};

// SPA ナビゲーション
const handleQuestionClick = (questionId, questionNumber) => {
  const newPath = `${basePath}/q${questionNumber}?id=${questionId}`;
  router.push(newPath); // レイアウト維持、高速遷移
};
```

### リアルタイム更新
```typescript
// チェック状態更新時の同期
const handleCheckComplete = async () => {
  const result = await apiClient.updateQuestionCheck(questionId, true);
  if (result.success) {
    // 詳細ページの状態更新
    setQuestion(prev => ({ ...prev, is_checked: true }));
    // サイドバーの状態更新（Context経由）
    updateQuestionStatus(questionId, { is_checked: true });
  }
};
```

## 数式・表示機能

### LaTeX 数式レンダリング
```typescript
// KaTeX による数式表示
import 'katex/dist/katex.min.css';
import katex from 'katex';

const renderMath = (text: string) => {
  return text.replace(/\$([^$]+)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: false });
    } catch (error) {
      return `[数式エラー: ${formula}]`;
    }
  });
};
```

### Markdown テーブル表示
```typescript
// Material-UI Table への変換
const parseMarkdownTable = (markdown: string) => {
  const lines = markdown.split('\n').filter(line => line.trim());
  const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
  const rows = lines.slice(2).map(line => 
    line.split('|').map(cell => cell.trim()).filter(Boolean)
  );
  
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {headers.map((header, index) => (
              <TableCell key={index}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
```

### 画像表示・警告システム
```typescript
// 画像参照の処理
const processImageReferences = (text: string) => {
  return text.replace(/!\[([^\]]*)\]\(\.\/images\/([^)]+)\)/g, 
    (match, alt, filename) => {
      return `<div class="image-warning">
        <Alert severity="warning">
          <AlertTitle>画像が見つかりません</AlertTitle>
          推奨ファイル名: <strong>${filename}</strong><br />
          ${alt && `説明: ${alt}`}
        </Alert>
      </div>`;
    }
  );
};
```

## セキュリティ・認証

### JWT 認証フロー
```typescript
// ログイン処理
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('authToken', data.data.token);
      setIsLoggedIn(true);
      router.push('/');
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// 認証ガード
useEffect(() => {
  const authenticated = isAuthenticated();
  if (!authenticated && pathname !== '/login') {
    router.push('/login');
  }
}, [pathname]);
```

### XSS 対策
```typescript
// HTML エスケープ処理
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// dangerouslySetInnerHTML の安全な使用
<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(processedText) 
}} />
```

## 環境設定

### 環境変数
```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:43001

# 本番環境
NEXT_PUBLIC_API_BASE_URL=https://api.fexa.example.com
```

### Next.js 設定
```typescript
// next.config.js
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;
```

## テスト・品質保証

### 動作確認項目
- JWT認証フロー（ログイン・ログアウト・自動リダイレクト）
- 試験選択からの問題表示
- サイドバーナビゲーション
- 問題チェック機能とリアルタイム更新
- LaTeX数式レンダリング
- Markdownテーブル表示
- レスポンシブデザイン（モバイル・デスクトップ）
- エラーハンドリング（ネットワークエラー・認証エラー）

### ブラウザサポート
- Chrome, Firefox, Safari, Edge (各最新版)
- モバイル Safari, Chrome Mobile
- レスポンシブデザイン（320px～）

この仕様に基づいて、Next.js App Router + Material-UIによる効率的な問題管理システムを構築・運用します。