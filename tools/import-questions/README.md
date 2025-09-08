# import-questions ツール

データベースに登録済みの問題データをMarkdown形式でインポートするツールです。

## 📋 機能

このツールは既存のデータベースから問題データを取得し、`text-data-import-YYYYMMDD-HHMMSS.md`形式のMarkdownファイルを生成します。

**注意**: このツールは新規データのエクスポートではなく、既存データのインポート用です。

## 🔄 ワークフロー内での位置づけ

1. PDFを Claude Web版で解析 → text-data.md 生成
2. text-data.md をデータベースへ登録（別ツール）
3. 【このツール】データベースから Markdown 形式でエクスポート

## 📦 必要な環境変数

```bash
API_BASE_URL=http://backend:3000           # APIサーバーのURL
APPLICATION_SERVICE_USER=service@example.com  # API認証用ユーザー
APPLICATION_SERVICE_PASSWORD=password         # API認証用パスワード
```

## 🚀 使用方法

### Dockerコンテナでの実行（推奨）

```bash
# コンテナビルド
docker compose build import-questions

# 実行例: 2010年春期のデータをエクスポート
docker compose run --rm import-questions node index.js 2010 h

# 実行例: 2019年秋期のデータをエクスポート
docker compose run --rm import-questions node index.js 2019 a
```

### ローカル実行

```bash
# 依存パッケージのインストール
npm install

# 環境変数を設定
export API_BASE_URL=http://localhost:43001
export APPLICATION_SERVICE_USER=service@example.com
export APPLICATION_SERVICE_PASSWORD=password

# 実行
node index.js 2010 h
```

## 📝 コマンドライン引数

```bash
node index.js <年度> <季節>
```

- `年度`: 西暦4桁（例: 2010, 2019）
- `季節`: 
  - `h`: 春期（haru）
  - `a`: 秋期（aki）

## 📂 出力ファイル

出力先: `/pdfs/<年度>_<季節>/`

- `text-data-import-YYYYMMDD-HHMMSS.md` - タイムスタンプ付きファイル
- `text-data-import-latest.md` - 最新版へのシンボリックリンク

### 出力ファイル形式

```markdown
# 平成XX年度YY期 基本情報技術者試験 午前問題 解答・解説

## 問1
問題文...

- ア 選択肢1
- イ 選択肢2
- ウ 選択肢3
- エ 選択肢4

**正解: ア**

解説文...

## 問2
...
```

## 🔍 主要機能

1. **API認証**: Bearer Token認証でAPIサーバーに接続
2. **問題データ取得**: 指定した年度・季節の問題を最大100件取得
3. **Markdown変換**: 
   - 問題文、選択肢、正解、解説を構造化
   - 画像参照を適切なパスに変換
   - 選択肢表のMarkdown対応
4. **ファイル出力**: タイムスタンプ付きで保存、最新版リンク更新

## ⚠️ 注意事項

- このツールはデータベースからのエクスポート専用です
- 新規問題の登録には`text-data.md`を別途用意する必要があります
- API認証情報は環境変数で適切に管理してください
- 出力先ディレクトリは自動作成されます

## 🐛 トラブルシューティング

### 認証エラー
```
認証情報が設定されていません
```
→ `APPLICATION_SERVICE_USER`と`APPLICATION_SERVICE_PASSWORD`環境変数を確認

### 問題データ取得エラー
```
問題データ取得に失敗: 404 Not Found
```
→ 指定した年度・季節のデータが存在するか確認

### ディレクトリ作成エラー
```
EACCES: permission denied
```
→ Dockerボリュームマウントの権限を確認

## 📊 処理フロー

1. コマンドライン引数の解析（年度、季節）
2. APIサーバーへの認証
3. 問題データの取得（最大100件）
4. 各問題をMarkdown形式に変換
5. ファイル出力（タイムスタンプ付き）
6. 最新版シンボリックリンクの更新

## 🔗 関連ツール

- `/tools/export-markdown/` - Markdownからsupabaseにエクスポート
