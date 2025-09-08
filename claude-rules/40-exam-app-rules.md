# Exam App 仕様書 (受験者向けアプリ)

## システム概要

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **UI ライブラリ**: Material-UI (MUI) v5
- **数式レンダリング**: KaTeX
- **認証**: JWT認証 (localStorage管理)
- **ユーザデータ**: Cookieによる一時保存（サーバ保存なし）
- **用途**: 基本情報技術者試験 問題演習システム
- **デプロイ**: Vercel

## ページ構成

### 1. トップページ (`/`)
**機能**: 試験選択・カテゴリ練習選択画面
- 年度・季節別の試験一覧表示
- カードレイアウト（春期/秋期の試験選択）
- カテゴリ別練習へのナビゲーション
- ログイン状態チェックとリダイレクト

### 2. ログインページ (`/login`)
**機能**: 受験者認証
- JWT認証フォーム
- 自動リダイレクト機能
- 認証状態の永続化
- エラーハンドリング

### 3. 年度・季節別試験ページ (`/exams/[year]/[season]`)
**機能**: 試験全問の問題演習
- サイドバーナビゲーション（ExamSidebar）
- 全80問の問題一覧表示
- 問題番号クリックでの直接アクセス
- 制限時間・全問必答の表示

### 4. 問題詳細ページ (`/exams/[year]/[season]/[qnumber]`)
**機能**: 個別問題表示・解答
- 問題文・選択肢の表示
- ラジオボタンによる回答選択
- 「解答を確認」ボタンで正解表示
- 正誤判定とフィードバック表示
- 解説の表示
- 前後問題ナビゲーション
- 画像表示対応

### 5. カテゴリ別練習ページ (`/category`)
**機能**: カテゴリ検索・問題セット作成
- CategorySelector による階層的カテゴリ選択
- 分野→大分類→中分類→小分類の4階層順次絞り込み
- 問題数の動的表示
- 「問題セットを作成」による左サイドバー問題一覧生成
- 問題タイトル表記: `H22-S-38` 形式

### 6. 個別問題ページ (`/questions/[questionId]`)
**機能**: カテゴリ検索からの問題表示
- 問題詳細ページと同様の機能
- カテゴリ検索経由での問題アクセス

## ディレクトリ構造

```
exam-app/src/
├── app/
│   ├── layout.tsx                    # ルートレイアウト
│   ├── page.tsx                      # トップページ（試験選択）
│   ├── login/
│   │   └── page.tsx                  # ログインページ
│   ├── exams/[year]/[season]/
│   │   └── [qnumber]/
│   │       └── page.tsx              # 問題詳細（試験モード）
│   ├── category/
│   │   └── page.tsx                  # カテゴリ別練習選択
│   └── questions/[questionId]/
│       └── page.tsx                  # 個別問題表示
├── components/
│   ├── AuthProvider.tsx             # 認証コンテキスト
│   ├── Header.tsx                   # ヘッダーコンポーネント
│   ├── Login.tsx                    # ログインフォーム
│   ├── ExamSidebar.tsx              # 試験用サイドバーナビゲーション
│   ├── CategorySelector.tsx         # カテゴリ階層選択
│   └── QuestionCard.tsx             # 問題カード表示
├── contexts/
│   └── FilterContext.tsx            # フィルター状態管理
├── services/
│   └── api.ts                       # APIクライアント
├── lib/
│   └── auth.ts                      # 認証ユーティリティ
└── types/
    ├── api.ts                       # TypeScript型定義
    └── react-katex.d.ts            # KaTeX型定義
```

## コンポーネント仕様

### AuthProvider
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// 機能
- JWT認証状態の管理
- localStorage による永続化
- 自動リダイレクト処理
- 未認証時のログイン画面遷移
```

### ExamSidebar
```typescript
interface ExamSidebarProps {
  questions?: Question[];
  open: boolean;
  onClose?: () => void;
  variant?: 'temporary' | 'persistent';
  currentQuestionId?: string;
}

// 機能
- 試験問題一覧のナビゲーション
- 現在表示中の問題ハイライト
- レスポンシブデザイン（モバイル対応）
- 試験情報の表示（年度・季節・問題数）
- 制限時間・全問必答の注意事項表示
```

### CategorySelector
```typescript
interface CategorySelectorProps {
  onCategorySelect: (categories: {
    field?: string;
    major?: string;
    medium?: string;
    minor?: string;
  }) => void;
}

// 機能
- 4階層カテゴリの順次選択（分野→大分類→中分類→小分類）
- 選択に応じた下位カテゴリの動的読み込み
- 選択状態の親コンポーネントへの通知
```

## API 連携

### ApiClient クラス
```typescript
class ApiClient {
  // 汎用メソッド
  async get<T>(endpoint: string): Promise<ApiResponse<T>>
  
  // 基本メソッド
  async getExams(): Promise<ApiResponse<Exam[]>>
  async getQuestions(params?): Promise<ApiResponse<Question[]>>
  async getQuestion(id: string): Promise<ApiResponse<Question>>
  
  // カテゴリ関連
  async getCategoriesByLevel(level: number, parentId?: string): Promise<ApiResponse<any[]>>
  async getCategories(): Promise<ApiResponse<any[]>>
  async getCategoryQuestions(categoryId: string, params?): Promise<ApiResponse<any[]>>
  
  // 認証
  async login(email: string, password: string): Promise<ApiResponse<{token: string}>>
}

// エラーハンドリング
- 401エラー時の自動ログアウト
- ネットワークエラーの適切な表示
- 日本語エラーメッセージ
```

## 問題表示機能

### 問題タイトル形式
```typescript
// H22-S-38 形式の表記
const formatQuestionTitle = (exam: Exam, questionNumber: number) => {
  const yearShort = exam.year.toString().slice(-2); // 2022 → 22
  const seasonCode = exam.season === 'a' ? 'S' : 'H'; // Spring/Autumn
  return `H${yearShort}-${seasonCode}-${questionNumber}`;
};
```

### 選択肢表示
```typescript
// ラジオボタンでの単一選択
<RadioGroup value={selectedAnswer} onChange={handleAnswerChange}>
  {question.choices?.map((choice) => (
    <FormControlLabel
      key={choice.id}
      value={choice.id}
      control={<Radio />}
      label={
        <Box>
          <Typography component="span" sx={{ fontWeight: 'bold' }}>
            {choice.choice_label}.
          </Typography>
          <Typography component="span">
            {choice.choice_text}
          </Typography>
        </Box>
      }
    />
  ))}
</RadioGroup>
```

### 正誤判定・フィードバック
```typescript
const handleShowAnswer = () => {
  setShowAnswer(true);
};

// 正解・不正解の視覚的フィードバック
sx={{
  borderColor: showAnswer && isCorrectAnswer(choice.id) 
    ? 'success.main' 
    : showAnswer && selectedAnswer === choice.id && !isCorrectAnswer(choice.id)
    ? 'error.main'
    : 'grey.300',
  bgcolor: showAnswer && isCorrectAnswer(choice.id) 
    ? 'success.light' 
    : showAnswer && selectedAnswer === choice.id && !isCorrectAnswer(choice.id)
    ? 'error.light'
    : 'transparent'
}}
```

## ユーザデータ管理

### Cookie による一時保存
```typescript
// 問題セット情報の一時保存
interface QuestionSetData {
  selectedCategories: {
    field?: string;
    major?: string;
    medium?: string;
    minor?: string;
  };
  questionIds: string[];
  currentIndex: number;
}

// Cookie への保存（サーバにはデータ保存しない）
const saveQuestionSet = (data: QuestionSetData) => {
  document.cookie = `questionSet=${JSON.stringify(data)}; path=/; max-age=86400`; // 24時間
};
```

### 回答状況の管理
```typescript
// 回答状況は保存せず、セッション中のみ管理
interface AnswerState {
  [questionId: string]: {
    selectedAnswer?: string;
    isAnswered: boolean;
    showAnswer: boolean;
  };
}

// useStateでのセッション管理
const [answerStates, setAnswerStates] = useState<AnswerState>({});
```

## カテゴリ検索機能

### 階層的カテゴリ選択
```typescript
// 4階層の構造
Level 1: 分野 (fields)
Level 2: 大分類 (majors) 
Level 3: 中分類 (mediums)
Level 4: 小分類 (minors)

// 選択に応じた動的API呼び出し
const handleFieldChange = async (fieldId: string) => {
  const result = await apiClient.get(`/categories/level/2?parent_id=${fieldId}`);
  setMajors(result.data || []);
};
```

### 問題数の動的表示
```typescript
// カテゴリ選択時の問題数取得と表示
const handleCategorySelect = async (categories: CategorySelection) => {
  const params = new URLSearchParams();
  if (categories.field) params.append('field_name', categories.field);
  if (categories.major) params.append('major_name', categories.major);
  // ... 他のカテゴリパラメータ
  
  const result = await apiClient.get(`/categories/search/questions?${params.toString()}`);
  setQuestions(result.data || []);
};
```

## レスポンシブデザイン

### モバイル対応
```typescript
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('md'));

// サイドバーの表示切り替え
<ExamSidebar
  variant={isMobile ? "temporary" : "persistent"}
  open={sidebarOpen}
  onClose={() => setSidebarOpen(false)}
/>

// モバイル時のメニューボタン
{isMobile && (
  <IconButton onClick={() => setSidebarOpen(true)}>
    <MenuIcon />
  </IconButton>
)}
```

### ブレークポイント対応
```typescript
// グリッドレイアウト
<Grid container spacing={3}>
  {exams.map((exam) => (
    <Grid item xs={12} sm={6} md={4} key={exam.id}>
      <Card>
        {/* 試験カード */}
      </Card>
    </Grid>
  ))}
</Grid>
```

## セキュリティ・認証

### JWT 認証フロー
```typescript
const login = async (email: string, password: string) => {
  const result = await apiClient.login(email, password);
  if (result.success) {
    localStorage.setItem('authToken', result.data.token);
    setUser(result.data.user);
    router.push('/');
  }
};

// 認証ガード
useEffect(() => {
  const token = getAuthToken();
  if (!token && pathname !== '/login') {
    router.push('/login');
  }
}, [pathname]);
```

### データプライバシー
```typescript
// サーバにユーザの回答データは保存しない
// - 問題セット情報: Cookie（24時間）
// - 回答状況: セッション中のみ（useState）
// - 学習履歴: 保存しない

// 個人情報の最小化
interface UserSession {
  id: string;
  email: string;
  // 学習履歴、回答履歴は含まない
}
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
});
```

### 問題表示スタイル
```typescript
// 問題文の表示
<Typography 
  variant="body1" 
  sx={{ 
    whiteSpace: 'pre-wrap',
    lineHeight: 1.8,
    mb: 3 
  }}
>
  {question.question_text}
</Typography>

// 選択肢のホバー効果
sx={{
  '&:hover': {
    bgcolor: 'action.hover'
  }
}}
```

## パフォーマンス最適化

### 問題データの効率的取得
```typescript
// 試験全体の問題を一括取得
useEffect(() => {
  const fetchQuestions = async () => {
    const result = await apiClient.getQuestions({
      year: parseInt(year),
      season: getSeasonCode(season)
    });
    setQuestions(result.data || []);
  };
  fetchQuestions();
}, [year, season]);
```

### カテゴリの遅延読み込み
```typescript
// 親カテゴリ選択時に子カテゴリを動的読み込み
const handleFieldChange = async (fieldId: string) => {
  try {
    const result = await apiClient.get(`/categories/level/2?parent_id=${fieldId}`);
    setMajors(result.data || []);
  } catch (error) {
    console.error('大分類の取得に失敗:', error);
  }
};
```

## 数式・画像表示

### KaTeX 数式レンダリング
```typescript
import 'katex/dist/katex.min.css';
import katex from 'katex';

// 数式の自動レンダリング（MathRenderer コンポーネント利用想定）
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

### 画像表示
```typescript
// 問題画像の表示
{question.question_images?.map((image, index) => (
  <Box key={image.id} sx={{ mb: 2 }}>
    <img 
      src={image.image_url} 
      alt={`問題図 ${index + 1}`}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  </Box>
))}

// 選択肢画像の表示
{choice.choice_images?.map((image, index) => (
  <img 
    key={image.id}
    src={image.image_url} 
    alt={`選択肢${choice.choice_label}の図 ${index + 1}`}
    style={{ maxWidth: '200px', height: 'auto' }}
  />
))}
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
};

module.exports = nextConfig;
```

## 動作確認項目

### 基本機能
- JWT認証フロー（ログイン・ログアウト・自動リダイレクト）
- 試験選択からの問題表示
- サイドバーナビゲーション
- ラジオボタンでの回答選択
- 解答確認と正誤判定表示
- 解説表示
- 前後問題ナビゲーション

### カテゴリ機能
- 4階層カテゴリの階層選択（分野→大分類→中分類→小分類）
- 選択に応じた問題数表示
- 問題セット作成機能
- 問題タイトル `H22-S-38` 形式での表示

### UI/UX
- レスポンシブデザイン（モバイル・デスクトップ）
- 数式・画像の適切な表示
- エラーハンドリング（ネットワークエラー・認証エラー）
- ローディング状態の表示

この仕様に基づいて、Next.js App Router + Material-UIによる効率的な問題演習システムを構築・運用します。ユーザのプライバシーを重視し、サーバにはユーザの学習データを保存せず、Cookie とセッション管理による一時的なデータ保持のみを行います。