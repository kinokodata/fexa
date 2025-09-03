# exam-app 問題演習アプリケーション開発ルール

このファイルはexam-appディレクトリ配下の問題演習アプリケーション開発に関するルールを定義します。

## アプリケーション概要

exam-appは基本情報技術者試験の問題演習に特化したNext.jsアプリケーションです。
- **目的**: 試験対策のための問題演習環境を提供
- **対象**: 基本情報技術者試験の受験者
- **形式**: 年度別試験（80問）およびカテゴリ別練習

## 技術スタック

### フレームワーク・ライブラリ
- **Next.js 14**: App Router使用
- **TypeScript**: 型安全性の確保
- **Material-UI v7**: UIコンポーネント
- **React 18**: UIライブラリ

### 数式・マークダウン対応
- **KaTeX**: 数式レンダリング
- **react-katex**: React用KaTeXコンポーネント
- **react-markdown**: マークダウン表示
- **remark-math**: 数式パース
- **rehype-katex**: KaTeX統合

## ディレクトリ構造

```
exam-app/
├── src/
│   ├── app/              # App Router ページ
│   │   ├── exam/         # 試験画面
│   │   ├── category/     # カテゴリ別練習
│   │   ├── results/      # 結果表示
│   │   └── login/        # ログイン画面
│   ├── components/       # 共通コンポーネント
│   ├── contexts/         # React Context
│   ├── hooks/            # カスタムフック
│   ├── lib/              # ユーティリティ
│   ├── services/         # API通信層
│   └── types/            # TypeScript型定義
```

## 開発規約

### コンポーネント設計
- **Client Components**: 'use client' を明示的に宣言
- **Server Components**: 可能な限りServer Componentを活用
- **コンポーネント分割**: 1ファイル1コンポーネント
- **命名規則**: PascalCaseでファイル名とコンポーネント名を統一

### 状態管理
- **認証状態**: AuthProviderで管理（frontendと共通）
- **試験状態**: ExamContextで管理
- **ローカル保存**: localStorageで学習履歴を管理
- **API通信**: React Queryは使用せず、直接fetchベース

### API通信
- **認証方式**: JWT Bearer Token（frontendと同一）
- **エンドポイント**: backend API (http://localhost:43001)
- **エラーハンドリング**: try-catchで統一
- **型定義**: types/api.tsで共通化

## 機能実装ガイドライン

### 試験機能
```typescript
// 試験データ構造
interface ExamSession {
  examId: string;
  questions: Question[];
  answers: Map<number, string>;
  startTime: Date;
  remainingTime: number;
  status: 'in_progress' | 'completed' | 'paused';
}

// タイマー管理
- 150分（9000秒）の制限時間
- 1秒ごとの更新
- バックグラウンドでも動作継続
- ページリロード対応（localStorage復元）
```

### カテゴリ検索機能
```typescript
// カテゴリ階層構造
interface Category {
  id: string;
  name: string;
  level: number;  // 1-5
  parent_id?: string;
  children?: Category[];
  questionCount?: number;
}

// カテゴリ選択
- 階層表示（TreeView）
- 複数選択可能
- 子カテゴリ含む/含まない切り替え
```

### 問題表示
```typescript
// 問題表示コンポーネント
- QuestionCard: frontendから流用
- KaTeX数式: $$...$$ 形式をレンダリング
- 画像表示: Supabase Storage URL対応
- 選択肢: ラジオボタン形式
```

## スタイリング規約

### Material-UI テーマ
```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Noto Sans JP", "Helvetica", "Arial", sans-serif',
  },
});
```

### レスポンシブ対応
- **モバイル**: 最小幅320px対応
- **タブレット**: 768px以上
- **デスクトップ**: 1024px以上
- **Grid/Flexbox**: Material-UIのGridシステム使用

## パフォーマンス最適化

### Next.js最適化
- **動的インポート**: 重いコンポーネントは遅延ロード
- **画像最適化**: next/image使用
- **コード分割**: ページ単位で自動分割

### 試験データ管理
- **ページネーション**: 問題は1問ずつ表示
- **プリフェッチ**: 次の問題を事前取得
- **キャッシュ**: 取得済み問題はメモリキャッシュ

## セキュリティ

### 認証・認可
- **JWT管理**: localStorageに保存（frontendと同一）
- **トークンリフレッシュ**: 自動更新機能
- **未認証リダイレクト**: ログインページへ自動遷移

### データ保護
- **XSS対策**: React標準のエスケープ機能
- **入力検証**: 選択肢のバリデーション
- **HTTPS**: 本番環境では必須

## デプロイ設定

### Vercel設定
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_BASE_URL": "@api_base_url"
  }
}
```

### 環境変数
- **開発環境**: .env.local
- **本番環境**: Vercel Environment Variables
- **必須変数**:
  - `NEXT_PUBLIC_API_BASE_URL`: Backend API URL
  - `NODE_ENV`: 環境識別

## テスト方針

### 単体テスト
- **実装予定**: Jest + React Testing Library
- **カバレッジ目標**: 主要機能80%以上

### E2Eテスト
- **実装予定**: Playwright
- **テストシナリオ**:
  - ログイン→試験開始→解答→結果確認
  - カテゴリ検索→問題抽出→練習

## 開発フロー

### ローカル開発
```bash
# Docker起動
docker compose up exam-app backend

# アクセス
http://localhost:43002
```

### デプロイ
```bash
# Vercel CLI
vercel --prod

# 環境変数設定
vercel env add NEXT_PUBLIC_API_BASE_URL
```

## トラブルシューティング

### よくある問題
1. **認証エラー**: トークン期限切れ → リフレッシュまたは再ログイン
2. **API接続エラー**: CORS設定確認、backendサービス起動確認
3. **数式表示エラー**: KaTeXライブラリのロード確認

### デバッグ方法
- **ブラウザ開発者ツール**: Network/Consoleタブ確認
- **React DevTools**: コンポーネント状態確認
- **Next.js Dev Server**: エラーメッセージ確認

---

このルールはexam-app開発の指針として使用してください。
frontendとの共通部分は可能な限り流用し、試験機能に特化した実装を行います。