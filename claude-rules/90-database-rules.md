# データベース設計・操作ルール

## スキーマ構造

### 主要テーブル
- `exams`: 試験情報（年度・季節）
- `questions`: 問題本文・メタデータ
- `choices`: 選択肢（通常形式）
- `answers`: 正解・解説
- `categories`: 分野分類

### テーブル形式選択肢の扱い
- **格納場所**: `questions`テーブルのフィールド
  - `has_choice_table`: boolean（表形式選択肢の有無）
  - `choice_table_type`: varchar（'markdown' または 'image'）
  - `choice_table_markdown`: text（Markdownテーブル形式）

- **非推奨**: `choices`テーブルでの表形式データ格納
  - `is_table_format`, `table_headers`, `table_data` は削除済み

### 画像管理
- `question_images`: 問題に付随する画像
- `choice_images`: 選択肢に付随する画像
- 画像URLは相対パス（`./images/filename.png`）で格納

## データ操作ルール

### 問題登録時
1. 表形式選択肢の判定を行う
2. 表形式の場合：
   - Markdownテーブルを生成
   - `questions`テーブルに格納
   - `choices`テーブルには簡略化されたレコードを作成
3. 通常形式の場合：
   - `choices`テーブルに詳細データを格納

### データ整合性
- UUIDを主キーとして使用
- 外部キー制約を適切に設定
- CASCADE削除の設定（問題削除時に関連データも削除）

### 認証・権限
- Service Keyを使用したSupabase接続
- Row Level Security (RLS) の適用
- JWT認証によるAPI保護

## ツール・ライブラリ使用ルール

### Supabaseクライアント
- `@supabase/supabase-js` を使用
- 環境変数での接続情報管理
- エラーハンドリングの徹底

### データ変換
- Markdown → データベース: パース処理で構造化
- データベース → API: JSON形式で応答
- 表形式データ: Markdownテーブル形式で保存・配信