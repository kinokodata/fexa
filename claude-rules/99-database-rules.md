# データベース設計・操作ルール

## スキーマ構造

### 主要テーブル (UUID主キー)
- `exams`: 試験情報（年度・季節）
- `questions`: 問題本文・メタデータ・チェック状態
- `choices`: 選択肢（通常形式）
- `answers`: 正解・解説
- `categories`: 分野分類
- `question_images`: 問題画像情報
- `choice_images`: 選択肢画像情報

### テーブル形式選択肢の扱い
- **格納場所**: `questions`テーブルのフィールド
  - `has_choice_table`: boolean（表形式選択肢の有無）
  - `choice_table_type`: varchar（'markdown' または 'image'）
  - `choice_table_markdown`: text（Markdownテーブル形式）

- **非推奨**: `choices`テーブルでの表形式データ格納

### 画像管理
- `question_images`: 問題に付随する画像 (UUID主キー)
- `choice_images`: 選択肢に付随する画像 (UUID主キー)
- Supabase Storageで管理、署名付きURLで配信
- ファイルパス: `{year}{season}/{timeCode}_q{number}/{uuid}.{ext}`
- 署名付きURLの有効期限: 24時間

### 問題チェック機能
- `questions`テーブルの追加フィールド:
  - `is_checked`: boolean（チェック完了フラグ）
  - `checked_at`: timestamp（チェック日時）
  - `checked_by`: varchar（チェック者名）
  - `explanation`: text（解説）

## データ操作ルール

### 問題登録時
1. エクスポートツールで Markdown をパース
2. 表形式選択肢の判定を行う
3. 表形式の場合：
   - Markdownテーブルを生成
   - `questions`テーブルに格納
   - `choices`テーブルには簡略化されたレコードを作成
4. 通常形式の場合：
   - `choices`テーブルに詳細データを格納
5. 画像情報の参照を保存（実ファイルは後からアップロード）

### データ整合性
- UUIDを主キーとして使用
- 外部キー制約を適切に設定
- CASCADE削除の設定（問題削除時に関連データも削除）

### 認証・権限
- Service Role Keyを使用したSupabase接続
- Row Level Security (RLS) の適用
- JWT認証によるAPI保護
- MCPサーバーは Service Role Key でフルアクセス

## ツール・ライブラリ使用ルール

### Supabaseクライアント
- `@supabase/supabase-js` v2.x を使用
- TypeScript 型安全性での実装
- 環境変数での接続情報管理
- エラーハンドリングの徹底

### データ変換
- Markdown → データベース: エクスポートツールでパース処理
- データベース → API: Vercel Functions で JSON 応答
- 表形式データ: Markdownテーブル形式で保存・配信
- 画像: Supabase Storage で管理、署名付きURLでアクセス

## MCP（Model Context Protocol）サーバー連携

### 目的
- Claude Codeからの直接データベース操作を可能にする
- 開発・デバッグ時の効率的なデータ確認・修正

### 実装詳細
- `mcp-servers/supabase/` ディレクトリに配置
- `.env.local` から環境変数を読み込み
- Service Role Key による全権限アクセス
- Claude Code の拡張機能として動作

### 提供機能
- `query_table`: テーブルからのデータ検索
- `update_data`: データの更新（将来実装予定）
- `insert_data`: データの挿入（将来実装予定）

### セキュリティ考慮
- ローカル開発環境でのみ使用
- 本番データベースへの直接アクセスは制限
- ログ出力による操作履歴の記録

## 運用ルール

### データ一貫性の維持
- 問題データの手動修正後は関連テーブルの整合性チェック
- 画像アップロード後の `has_image` フラグ更新
- 選択肢の順序（ア、イ、ウ、エ）の保持

### バックアップ・復旧
- Supabase の自動バックアップ機能を活用
- 重要なデータ変更前の手動バックアップ
- テストデータと本番データの分離

### パフォーマンス最適化
- 頻繁にアクセスされるテーブルのインデックス設定
- N+1 クエリの回避
- 署名付きURLのキャッシュ活用