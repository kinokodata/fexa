# Fexa Export Markdown Tool

text-data.mdファイルからSupabaseへ問題データをエクスポートするツールです。

## 機能

- Markdownファイルの解析と問題データ抽出
- Supabaseへのデータ保存（試験・問題・選択肢・画像参照情報）
- エラー耐性の高いバッチ処理
- 進捗表示と詳細ログ出力
- Docker環境での実行サポート

## 使用方法

### Docker環境での実行

```bash
# 単一ファイルのエクスポート
docker compose exec export-markdown node index.js /pdfs/2018_a/text-data.md

# 年度・季節を明示的に指定
docker compose exec export-markdown node index.js /pdfs/2018_a/text-data.md 2018 秋期

# 複数ファイルの一括エクスポート
docker compose exec export-markdown sh -c 'for md in /pdfs/*/text-data.md; do node index.js "$md"; done'
```

### ローカル環境での実行

```bash
npm install
node index.js ./pdfs/2018_a/text-data.md
```

## 環境変数

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=fexa-images
```

## 対応フォーマット

### 問題番号
```markdown
## 問1
## 問 2
```

### 選択肢
```markdown
- ア. 選択肢の内容
- イ、選択肢の内容
- ウ．選択肢の内容
- エ 選択肢の内容
```

### 画像リンク
```markdown
![説明](./images/q1_1.png)
```

## 処理フロー

1. Markdownファイルの読み込み
2. 年度・季節情報の抽出（ディレクトリ名またはファイル内容から）
3. 問題・選択肢・画像情報の解析
4. Supabaseへのデータ保存（重複チェック付き）
5. インポート履歴の記録

## エラーハンドリング

- 1問の失敗が全体を停止しない
- データベース操作は自動リトライ
- 詳細なエラーログ出力
- 部分的成功でも結果を保存