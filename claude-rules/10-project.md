# Fexa プロジェクト全体ルール

このファイルはプロジェクト全体の概要と方針を定義します。

## プロジェクト概要

Fexaは**基本情報技術者試験の過去問データベース**です。
- IPAが公開するPDFから問題・選択肢を自動抽出
- Supabaseでデータ管理
- Vercel Functions + Next.jsで本番運用
- 外部システムからAPIでデータ取得可能

## システム構成

### アーキテクチャ
```
PDFファイル(ローカル) → インポートツール → Supabase
                                        ↓
                     Vercel Functions API → Next.js フロントエンド
```

### 開発・本番環境
- **本番**: Vercel (API + フロントエンド) + Supabase
- **開発**: ローカル Next.js (43000番ポート) + Supabaseクラウド
- **tools**: PDFインポートツール (Dockerコンテナ)

## 技術スタック

### データベース・ストレージ
- **Supabase PostgreSQL**: 問題・選択肢・解答データ
- **Supabase Storage**: 問題内画像のみ（PDFは保存しない）

### 開発環境
- **Next.js**: App Router + TypeScript
- **Material-UI**: UIコンポーネント
- **KaTeX**: LaTeX数式レンダリング
- **Node.js 18+**: 全サービス共通
- **ESModules**: import/export構文使用

### 本番環境
- **Vercel**: Next.js + API Routes デプロイ
- **Supabase**: データベース・ストレージ・認証

## データ管理方針

### PDFファイル
- ローカルの `pdfs/` ディレクトリに保存
- 年度・季節でディレクトリ分け (`pdfs/2024_a/`, `pdfs/2023_h/`)
- Supabaseには保存しない

### 問題データ
- インポートツールでPDF解析してSupabaseに保存
- API経由での読み取り専用アクセス
- 手動修正は直接Supabaseで行う

### 画像データ
- 問題内の図表・画像のみSupabase Storageに保存
- バケット名: `fexa-images`

## セキュリティ・権限

### API制限
- **認証必須**: `/api/health` を除く全てのエンドポイントで JWT 認証が必要
- **メソッド対応**: 
  - GET: 試験情報・問題データの取得
  - POST: 画像アップロード、ユーザー認証
  - PUT/PATCH: 問題データの更新
  - DELETE: データの削除
- **Vercel Functions**: サーバーレス関数として実行
- **JWT認証**: Bearer トークンによる認証（有効期限: 24時間）

### Supabase接続
- インポートツール: SERVICE_ROLE_KEY を使用（管理者権限）
- Vercel Functions: SERVICE_ROLE_KEY を使用（認証済みユーザーの操作を実行）
- フロントエンド: Vercel Functions 経由でのみアクセス（直接接続なし）
- MCPサーバー: SERVICE_ROLE_KEY を使用（Claude Code連携）

## 開発フロー

### 新機能開発
1. ローカルNext.js環境で開発・テスト
2. API変更は `/api` ディレクトリで実装
3. フロントエンド変更は App Router で実装
4. TypeScript 型定義の更新

### データ更新
1. IPAから最新PDFをダウンロード
2. `pdfs/` ディレクトリに配置
3. インポートツールで処理
4. フロントエンドで確認

## 運用・保守

### ログ管理
- 本番: Vercel Functions ログ
- 開発: Next.js dev server ログ
- インポート: コンソール出力
- MCPサーバー: stderr 出力

### エラーハンドリング
- APIエラーは日本語メッセージで返却
- インポートエラーは詳細ログ出力
- 部分的失敗も許容（best effort方式）

### パフォーマンス
- API応答: 2秒以内を目標
- PDF解析: 大きなファイルでも10分以内
- ページネーション: デフォルト20件/ページ

## 品質管理

### コード品質
- TypeScript 型安全性の確保
- ES6+ 機能を積極使用
- async/await での非同期処理
- エラーの適切なログ出力
- Material-UI のデザインシステム準拠

### テスト方針
- APIエンドポイント: Vercel Functions での動作確認
- インポート機能: サンプルPDFでの動作確認
- UI: ブラウザでの手動確認
- TypeScript: コンパイル時型チェック

### 文書化
- README.md: セットアップ手順
- pdfs/README.md: PDFファイル管理方法
- claude-rules/: 開発ルール

## ルールファイル構成

開発時は以下のルールファイルを**必ず参照**してください：

### 🏗️ 専門分野別ルール
- **20-pdf-analysis.md**: PDF解析・変換処理ルール
- **30-export-tools.md**: エクスポートツール開発ルール
- **40-api-rules.md**: Vercel Functions API開発ルール  
- **50-frontend-rules.md**: Next.js + TypeScript フロントエンド開発ルール
- **90-database-rules.md**: Supabase データベース操作ルール
- **95-mcp-server-rules.md**: MCP サーバー開発・運用ルール

## 適用順序

ルールファイルは**番号順**に適用してください：
1. このファイル（10-project.md）でプロジェクト全体方針を理解
2. 担当コンポーネントの詳細ルール（20/30/40/50）を確認
3. 番号が大きいファイルの内容を優先

この構成により、学習支援と外部システム連携の両方に対応できる、拡張性の高いシステムを維持します。