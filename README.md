# Fexa - 基本情報技術者試験過去問データベース

基本情報技術者試験の過去問を管理・表示するための統合データベースシステムです。  
**モダンなWeb UI、認証システム、画像アップロード機能を備えた包括的なプラットフォーム**

## ✨ 主要機能

### 🔐 認証システム
- JWT ベース認証（アクセス/リフレッシュトークン）
- 管理者用ログイン画面
- 自動トークン更新とセッション管理

### 📝 問題管理
- 年度・季節別の問題一覧表示
- LaTeX数式レンダリング（KaTeX）
- Markdownテーブル対応
- 選択肢の表形式表示（問題レベルで管理）
- 問題・選択肢別の画像アップロード

### 🖼️ 画像管理システム
- UUID ベースのファイル管理
- ドラッグ&ドロップ対応アップロード
- Supabase Storage 統合
- 署名付きURL（24時間有効）
- 自動的な画像警告表示

### 🎨 ユーザーインターフェース
- Material-UI による現代的なデザイン
- レスポンシブ対応
- リアルタイムプレビュー
- エラー処理とユーザーフィードバック

## 🚀 技術スタック

### フロントエンド
- **Next.js 14** (App Router)
- **TypeScript**
- **Material-UI (MUI)**
- **KaTeX** (数式レンダリング)
- **React hooks** (状態管理)

### バックエンド
- **Express.js** (Node.js)
- **ES6 Modules**
- **JWT認証**
- **Multer** (ファイルアップロード)
- **Winston** (ログ管理)

### データベース・ストレージ
- **Supabase PostgreSQL**
- **Supabase Storage**
- **UUID** ベースのファイル管理

### インフラ
- **Docker Compose** (開発環境)
- **Vercel** (本番デプロイ対応)

## 🏗️ アーキテクチャ概要

### データベース設計
```sql
-- 最新のスキーマ構造
exams (id, year, season, exam_date)
questions (
  id, exam_id, question_number, question_type,
  question_text, has_image,
  has_choice_table, choice_table_type, choice_table_markdown
)
choices (id, question_id, choice_label, choice_text, is_correct, has_image)
question_images (id, question_id, image_type, caption)
choice_images (id, choice_id, image_type, caption)
answers (id, question_id, correct_choice, explanation)
```

### ファイル管理システム
```
Storage Structure:
{year}{season_code}/{time_code}_q{question_number}/{uuid}.{extension}

Example:
2018a/am_q77/550e8400-e29b-41d4-a716-446655440000.png
```

### API エンドポイント
```bash
# 認証
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout

# コンテンツ管理（要認証）
GET  /api/exams
GET  /api/questions
GET  /api/questions/:id
POST /api/images/upload/question/:id
POST /api/images/upload/choice/:id

# システム
GET  /api/health
```

## 🚀 セットアップ

### 1. 前提条件
- Docker & Docker Compose
- Supabaseアカウント
- Node.js 18以上（ローカル開発時）

### 2. 環境変数設定
```bash
cp .env.example .env
# 以下を設定：
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_STORAGE_BUCKET=fexa-images
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
```

### 3. データベース初期化
1. Supabaseプロジェクトを作成
2. `sql/` ディレクトリのSQLファイルを順次実行：
   ```sql
   -- 基本スキーマ
   init.sql
   
   -- 選択肢テーブル機能拡張
   add_choice_table_columns.sql
   remove_obsolete_choice_columns.sql
   ```

### 4. 開発環境起動
```bash
# Docker環境
docker compose up -d

# ローカル開発
cd frontend && npm install && npm run dev  # :43000
cd backend && npm install && npm run dev   # :43001
```

## 📁 プロジェクト構造

```
fexa/
├── frontend/src/
│   ├── app/                          # Next.js App Router
│   │   ├── login/page.tsx           # 認証ページ
│   │   ├── exams/[year]/[season]/   # 年度・季節別問題一覧
│   │   └── questions/[id]/          # 問題詳細ページ
│   ├── components/
│   │   ├── AuthProvider.tsx         # 認証コンテキスト
│   │   ├── MathRenderer.tsx         # LaTeX/Markdown レンダリング
│   │   └── ImageUpload.tsx          # ファイルアップロード
│   └── services/api.ts              # API クライアント
├── backend/src/
│   ├── routes/
│   │   ├── auth.js                  # 認証エンドポイント
│   │   ├── questions.js             # 問題管理API
│   │   └── images.js                # 画像アップロードAPI
│   ├── middleware/
│   │   └── auth.js                  # JWT認証ミドルウェア
│   └── lib/
│       ├── supabase.js              # DB/Storage クライアント
│       └── logger.js                # ログシステム
├── sql/                             # データベーススキーマ
└── claude-rules/                    # 開発ルール・ガイドライン
```

## 🔄 最近の主要変更

### バックエンド再構築 ("backend作り直し")
- **モジュラー化**: ルート、ミドルウェア、ユーティリティの分離
- **ES6 Modules**: 完全な ES6 import/export 移行
- **統合認証**: 全エンドポイントでJWT認証必須化
- **エラーハンドリング**: 統一されたエラーレスポンス形式

### 選択肢テーブルシステム再設計
**旧システム**: 複雑なテーブルデータを choices テーブルで管理
**新システム**: シンプルな Markdown テーブルを questions テーブルで一元管理

```sql
-- 削除されたカラム
choices: is_table_format, table_headers, table_data

-- 新規追加カラム  
questions: has_choice_table, choice_table_type, choice_table_markdown
```

### 画像システム強化
- **UUID ベース**: データベースIDとファイル名の統一
- **動的パス生成**: メタデータからの自動パス構築
- **警告システム**: 不足画像の自動検出と表示
- **セキュア アクセス**: 署名付きURL による安全なファイル配信

## 🧪 開発・テスト

### 認証テスト
```bash
# ログイン
curl -X POST http://localhost:43001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# 認証が必要なAPI
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:43001/api/questions
```

### 画像アップロード
```bash
# 問題画像アップロード
curl -X POST http://localhost:43001/api/images/upload/question/QUESTION_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test-image.png"
```

## 🔧 開発ガイドライン

### コード規約
- **TypeScript**: 厳格な型チェック使用
- **ES6 Modules**: import/export 必須
- **エラーハンドリング**: 統一されたエラーレスポンス
- **認証**: 全保護ルートでJWT検証

### データベース変更
1. SQLファイルを `sql/` ディレクトリに作成
2. マイグレーション手順をドキュメント化
3. 後方互換性の確保

### UI/UX パターン
- **Material-UI**: 一貫したデザインシステム
- **レスポンシブ**: モバイルファースト
- **アクセシビリティ**: ARIA ラベルと適切な色コントラスト
- **エラー表示**: ユーザーフレンドリーなメッセージ

## 🚨 重要な注意事項

### セキュリティ
- 本番環境では認証情報をハードコードしない
- 環境変数で機密情報を管理
- CORS設定を適切に構成

### パフォーマンス
- 大きな画像ファイル（10MB制限）
- データベースクエリの最適化
- 適切なページネーション実装

### 互換性
- 既存の選択肢テーブルデータとの後方互換性
- 段階的なマイグレーション対応

## 🐛 トラブルシューティング

### よくある問題

**認証エラー**
```bash
# トークンの確認
curl -H "Authorization: Bearer $TOKEN" http://localhost:43001/api/health
```

**画像アップロードエラー**
```bash
# ファイルサイズとフォーマット確認
file test-image.png
du -h test-image.png
```

**データベース接続エラー**
```bash
# Supabase接続テスト
curl "https://YOUR_PROJECT.supabase.co/rest/v1/exams" \
  -H "apikey: YOUR_ANON_KEY"
```

## 📈 今後の開発予定

- [ ] 問題検索機能の強化
- [ ] 画像OCR機能の追加  
- [ ] マルチユーザー対応
- [ ] バックアップ・リストア機能
- [ ] パフォーマンス最適化

---

**Fexa** は現代的な Web 技術スタックを使用して構築された、包括的な試験問題管理システムです。継続的な改善と拡張により、教育分野でのデジタルツール活用を支援します。