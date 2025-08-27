# フロントエンド開発ルール

Next.js(React)を使用した確認用UIフロントエンドの開発ルールです。

## 基本方針

### 目的・用途
- **動作確認用UI**: APIの動作を視覚的に確認
- **データ閲覧**: インポートしたデータの表示・検索
- **管理画面的な位置づけ**: 本格的なエンドユーザー向けUIではない

### 技術選択
- **Next.js 14**: App Router使用
- **TypeScript**: 型安全性重視
- **CSS**: インラインスタイル中心（シンプル重視）
- **外部ライブラリ**: 最小限（依存関係を減らす）

## ディレクトリ構成

```
frontend/src/
├── app/
│   ├── layout.tsx          # 共通レイアウト
│   ├── page.tsx            # メインページ（問題一覧）
│   └── questions/[id]/
│       └── page.tsx        # 問題詳細ページ
├── components/
│   ├── QuestionCard.tsx    # 問題カード
│   ├── SearchForm.tsx      # 検索フォーム
│   └── HealthStatus.tsx    # APIサーバー状態表示
├── services/
│   └── api.ts              # API呼び出し
└── types/
    └── api.ts              # 型定義
```

## API連携

### APIクライアント設計
```typescript
class ApiClient {
  private baseURL = process.env.API_BASE_URL || 'http://localhost:43001';
  
  async request<T>(endpoint: string): Promise<ApiResponse<T>> {
    // エラーハンドリング付きfetch実装
  }
  
  // 各エンドポイントのメソッド
  async getExams(): Promise<ApiResponse<Exam[]>>
  async getQuestions(params?): Promise<ApiResponse<Question[]>>
  async getQuestion(id: string): Promise<ApiResponse<Question>>
}
```

### エラーハンドリング
- API接続エラーは日本語で表示
- ローディング状態の表示
- 404エラーの適切な処理
- タイムアウト処理（30秒）

### 状態管理
- React hooks（useState/useEffect）のみ使用
- 複雑な状態管理ライブラリは使わない
- コンポーネント間でのprops受け渡し

## UI設計

### デザインコンセプト
- **機能重視**: 美しさよりも使いやすさ
- **情報密度**: 多くの情報を効率的に表示
- **レスポンシブ対応**: 基本的なブレークポイントのみ

### カラーパレット
```css
/* プライマリ */
--primary-blue: #007bff;
--primary-green: #28a745;
--primary-red: #dc3545;

/* グレー系 */
--gray-100: #f8f9fa;
--gray-300: #e9ecef;
--gray-600: #666;
--gray-900: #333;
```

### コンポーネント設計
```typescript
// 基本的なprops定義
interface QuestionCardProps {
  question: Question;
  onClick?: (id: string) => void;
}

// インラインスタイルの活用
const cardStyle: React.CSSProperties = {
  border: '1px solid #e9ecef',
  borderRadius: '0.5rem',
  padding: '1.5rem',
  backgroundColor: 'white'
};
```

## ページ構成

### メインページ（/）
**機能**:
- APIサーバーのヘルスチェック表示
- 試験一覧からの検索フォーム
- 問題一覧の表示（ページング付き）

**表示項目**:
- 各問題の基本情報（年度・季節・問題番号）
- 問題文の冒頭（200文字程度）
- 選択肢の一部表示
- 詳細ページへのリンク

### 問題詳細ページ（/questions/[id]）
**機能**:
- 1問の完全な表示
- 選択肢の全表示
- 解答の表示/非表示切り替え
- 画像の表示（将来対応）

**表示項目**:
- 問題メタデータ（年度・季節・カテゴリ）
- 問題文（完全版）
- 選択肢（ア・イ・ウ・エ）
- 正解と解説（ボタンで切り替え）

### 共通レイアウト
- シンプルなヘッダー（プロジェクト名）
- パンくずリスト
- フッター（著作権表示）

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

### データフェッチパターン
```typescript
const [questions, setQuestions] = useState<Question[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string>('');

const loadQuestions = async (params?: SearchParams) => {
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
    setError('ネットワークエラーが発生しました');
  } finally {
    setLoading(false);
  }
};
```

### エラー表示
```typescript
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
```

## パフォーマンス

### 最適化方針
- 不要な再レンダリングの防止
- 大きな画像の遅延読み込み（将来対応）
- APIレスポンスのキャッシュ（Next.jsのデフォルト機能活用）

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
API_BASE_URL=http://localhost:43001  # 開発環境
# API_BASE_URL=https://api.example.com  # 本番環境
```

### Next.js設定
```javascript
// next.config.js
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_BASE_URL: process.env.API_BASE_URL
  },
  // API Proxy設定（開発時）
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE_URL}/api/:path*`
      }
    ];
  }
};
```

## テスト・品質保証

### ブラウザテスト
- Chrome/Firefox/Safari での動作確認
- モバイル端末での基本動作確認
- APIエラー時の表示確認

### データ整合性確認
- 問題数の一致確認
- 選択肢の表示確認
- 画像の表示確認（将来）
- 日本語の文字化け確認

このシンプルな設計により、開発・保守が容易で、APIの動作確認に必要十分な機能を提供できます。