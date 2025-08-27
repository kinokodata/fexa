# Fexa - 基本情報技術者試験過去問データベース

IPAが公開している基本情報技術者試験の過去問PDFを解析し、Supabaseで管理するシステムです。  
**APIサーバーはVercelにデプロイ、フロントエンドも含めた確認用UIを提供します。**

## 🚀 セットアップ

### 1. 前提条件

- Docker & Docker Compose
- Supabaseアカウント
- Node.js 18以上（ローカル開発時）

### 2. Supabaseプロジェクトの準備

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. `init.sql`の内容をSupabaseのSQL Editorで実行してテーブルを作成
3. Settings > API から以下の情報を取得：
   - Project URL
   - anon key
   - service_role key

### 3. 環境変数の設定

```bash
# .env.exampleをコピー
cp .env.example .env

# .envファイルを編集してSupabaseの接続情報を設定
```

### 4. Docker環境の起動

```bash
# コンテナの起動（フロントエンド + バックエンド）
docker compose up -d

# ログの確認
docker compose logs -f

# フロントエンドアクセス: http://localhost:43000
# バックエンドAPI: http://localhost:43001
```

## 📁 ディレクトリ構成

```
fexa/
├── compose.yml                   # Docker Compose設定
├── vercel.json                   # Vercel設定
├── package.json                  # Vercel API依存関係
├── init.sql                     # データベース初期化SQL
├── .env.example                 # 環境変数テンプレート
├── api/                         # Vercel Functions
│   ├── health.js                # ヘルスチェック
│   ├── exams/index.js           # 試験一覧
│   └── questions/
│       ├── index.js             # 問題一覧
│       └── [id].js              # 問題詳細
├── backend/                     # ローカル開発用APIサーバー
│   ├── Dockerfile
│   ├── lib/
│   │   ├── logger.js            # ロガー
│   │   └── supabase.js          # Supabase接続
│   ├── middleware/cors.js       # CORS設定
│   └── src/server.js            # 簡易APIサーバー
├── tools/                       # PDFインポートツール（独立）
│   ├── Dockerfile
│   ├── package.json
│   ├── import-pdf.js            # インポートスクリプト
│   └── lib/
│       ├── logger.js            # ロガー
│       ├── supabase.js          # Supabase接続
│       └── pdfParser.js         # PDF解析
├── frontend/                    # Next.jsフロントエンド
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   └── src/
│       ├── app/
│       │   ├── layout.tsx       # レイアウト
│       │   ├── page.tsx         # メインページ
│       │   └── questions/[id]/page.tsx # 問題詳細
│       ├── components/          # UIコンポーネント
│       ├── services/api.ts      # API接続
│       └── types/api.ts         # 型定義
└── claude-rules/                # Claude用ルール
```

## 🏗️ システム構成

### 開発環境
- **フロントエンド**: Next.js (ポート: 43000)
- **バックエンド**: Express API (ポート: 43001)
- **データベース**: Supabase PostgreSQL
- **ストレージ**: Supabase Storage

### 本番環境
- **フロントエンド**: Vercel
- **バックエンド**: Vercel Functions
- **データベース**: Supabase PostgreSQL
- **ストレージ**: Supabase Storage

## 🔌 APIエンドポイント（読み取り専用）

### ヘルスチェック
```bash
GET /api/health
GET /api/health?detailed=true  # 詳細チェック付き
```

### 試験情報
```bash
# 試験一覧取得
GET /api/exams
```

### 問題情報
```bash
# 問題一覧取得
GET /api/questions?year=2023&season=春期&page=1&limit=20

# 問題詳細取得
GET /api/questions/:id
```

※ 問題の作成・更新・削除はローカル環境でのみ実行可能です

## 🧪 テスト方法

### フロントエンド確認
```bash
# Webブラウザでアクセス
open http://localhost:43000
```

### API確認
```bash
# ヘルスチェック
curl http://localhost:43001/api/health

# 試験一覧取得
curl http://localhost:43001/api/exams

# 問題一覧取得
curl http://localhost:43001/api/questions

# 問題詳細取得（IDは実際のものを使用）
curl http://localhost:43001/api/questions/{question_id}
```

## 📊 データベース構造

- **exams**: 試験情報（年度、季節）
- **questions**: 問題本体
- **choices**: 選択肢（ア、イ、ウ、エ）
- **answers**: 正解と解説
- **categories**: 問題カテゴリ
- **question_images**: 問題内の画像
- **import_history**: PDFインポート履歴

## 🔧 開発

### ローカル開発
```bash
# フロントエンド
cd frontend
npm install
npm run dev

# バックエンド
cd backend
npm install
npm run dev
```

### Docker開発
```bash
# 全体ビルド
docker compose build

# 起動
docker compose up -d

# 特定サービスのみ
docker compose up -d frontend
docker compose up -d backend
```

### Vercelデプロイ
```bash
# APIサーバーのデプロイ（プロジェクトルートで実行）
vercel --prod

# 環境変数の設定
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
# ... 他の環境変数
```

## 📝 注意事項

- PDFの解析精度は100%ではありません
- 複雑なレイアウトや図表を含む問題は手動調整が必要な場合があります
- Supabaseの無料プランには制限があるため、大量のPDFをインポートする際は注意してください

## 🐛 トラブルシューティング

### Supabase接続エラー
- 環境変数が正しく設定されているか確認
- Supabaseプロジェクトがアクティブか確認

### PDF解析エラー
- PDFファイルが破損していないか確認
- ファイルサイズが50MB以下か確認

### Docker起動エラー
- ポート43000（フロントエンド）、43001（バックエンド）が使用されていないか確認
- `docker compose down`してから再起動

### フロントエンドがAPIに接続できない
- `API_BASE_URL`環境変数が正しく設定されているか確認
- CORSエラーの場合は`CORS_ORIGIN`設定を確認

## 📥 PDFインポート方法

### 1. PDFファイルの準備
```bash
# IPAから過去問PDFをダウンロード
mkdir -p pdfs/2024
# https://www.jitec.ipa.go.jp/ から該当年度のPDFをダウンロード
```

### 2. インポート実行（専用コンテナ）
```bash
# インポートツールコンテナで実行
docker compose exec tools node import-pdf.js /pdfs/2024/fe24s_am.pdf 2024 春期

# 複数ファイルの一括インポート
docker compose exec tools sh -c 'for pdf in /pdfs/2024/*.pdf; do node import-pdf.js "$pdf" 2024 春期; done'
```

### 3. 結果確認
```bash
# APIで確認
curl "http://localhost:43001/api/questions?year=2024&season=春期"

# フロントエンドで確認  
open http://localhost:43000
```

詳細は `pdfs/README.md` を参照してください。