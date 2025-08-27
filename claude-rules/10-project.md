# Claude開発ルール統合ガイド

このディレクトリはFexaプロジェクトの開発ルールを体系化したものです。

## ルールファイル構成

開発時は以下のルールファイルを**必ず参照**してください：

### 🏗️ プロジェクト全体
- **20-project-overview.md**: システム全体のアーキテクチャと方針
- **30-pdf-analysis.md**: PDF解析・変換処理ルール
- **40-api-rules.md**: Vercel Functions API開発ルール  
- **50-import-tools-rules.md**: PDFインポートツール開発ルール
- **60-frontend-rules.md**: Next.jsフロントエンド開発ルール

## 適用順序

ルールファイルは**番号順**に適用してください：
1. 全体方針（20-project-overview.md）を理解
2. 担当コンポーネントの詳細ルール（30/40/50/60）を確認
3. 番号が大きいファイルの内容を優先

## 現在のシステム構成

```
PDFファイル(ローカル) → インポートツール → Supabase
                                        ↓
                     API (Vercel Functions) → フロントエンド (Next.js)
```

### コンテナ構成
- **frontend**: Next.js UI (43000番ポート)
- **backend**: ローカル開発用API (43001番ポート)  
- **tools**: PDFインポートツール（独立運用）

## 重要な設計原則

### データフロー
- PDFファイル: ローカル保存のみ
- 問題データ: インポートツール → Supabase
- 画像: 問題内画像のみSupabase Storage保存
- API: 読み取り専用（GET メソッドのみ）

### 環境分離
- **開発**: Docker Compose + ローカルAPI
- **本番**: Vercel Functions + Next.js

### 開発時の注意点
- 新機能開発前に該当ルールファイルを必読
- 各コンポーネントのルールに従った実装
- 共通ルール（20-project-overview.md）の原則を遵守

## クイック参照

| 作業内容 | 参照ルール |
|---------|------------|
| プロジェクト理解 | 20-project-overview.md |
| PDF解析・変換 | 30-pdf-analysis.md |
| API開発・修正 | 40-api-rules.md |
| PDF処理実装 | 50-import-tools-rules.md |
| UI開発・修正 | 60-frontend-rules.md |

このガイドにより、開発者は適切なルールを素早く見つけ、一貫した品質でコードを実装できます。