# Export Markdown Tool

text-data.mdファイルからSupabaseデータベースへ問題データをインポートするツールです。

## 📋 機能

- Markdownファイルの解析と問題データ抽出
- **正解・解説の自動抽出とデータベース保存**
- Supabaseへのデータ保存（試験・問題・選択肢・解説・画像参照情報）
- エラー耐性の高いバッチ処理
- 進捗表示と詳細ログ出力
- Docker環境での実行サポート

## 🚀 使用方法

### Docker環境での実行（推奨）

```bash
# 単一ファイルのインポート
docker compose run --rm export-markdown node index.js /pdfs/2010_h/text-data.md

# 年度・季節を明示的に指定
docker compose run --rm export-markdown node index.js /pdfs/2018_a/text-data.md 2018 秋期

# 単体問題の上書きインポート（問題文修正時など）
docker compose run --rm export-markdown node index.js /pdfs/2018_a/text-data.md --question 9 --overwrite

# 複数ファイルの一括インポート
docker compose run --rm export-markdown sh -c 'for md in /pdfs/*/text-data.md; do node index.js "$md"; done'
```

### ローカル環境での実行

```bash
npm install

# 通常のエクスポート
node index.js ./pdfs/2018_a/text-data.md

# 単体問題の上書きエクスポート
node index.js ./pdfs/2018_a/text-data.md --question 9 --overwrite
```

### オプション

- `--question N`: 指定した問題番号のみ処理する
- `--overwrite`: 既存データを強制上書きする（--questionと組み合わせて使用）

## 環境変数

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=fexa-images
```

## 📝 対応フォーマット

### 問題番号
```markdown
## 問1
## 問 2
```

### 正解と解説
```markdown
**正解: ア**

16進数2A.4Cを2進数に変換すると...（解説文）
```

### 選択肢

**テキスト選択肢:**
```markdown
- ア 選択肢の内容
- イ 選択肢の内容  
- ウ 選択肢の内容
- エ 選択肢の内容
```
**注意**: `- ア.` のようにピリオドは付けない

**画像選択肢:**
```markdown
- ア. ![選択肢ア](./images/q22_choice_a.png)
- イ. ![選択肢イ](./images/q22_choice_b.png)
- ウ. ![選択肢ウ](./images/q22_choice_c.png)
- エ. ![選択肢エ](./images/q22_choice_d.png)
```

**注意:** 選択肢が画像の場合でも、上記の統一形式で記述してください。パーサーが自動的にテキストと画像を識別します。

### 画像リンク
```markdown
![説明](./images/q1_1.png)
```

## 🔄 処理フロー

1. Markdownファイルの読み込み
2. 年度・季節情報の抽出（ディレクトリ名またはファイル内容から）
3. 問題・選択肢・**正解・解説**の解析
4. Supabaseへのデータ保存（重複チェック付き）
   - 試験テーブル（exams）
   - 問題テーブル（questions）- **explanation**フィールド含む
   - 選択肢テーブル（choices）- **is_correct**フラグ付き
   - 画像参照情報（question_images, choice_images）

## エラーハンドリング

- 1問の失敗が全体を停止しない
- データベース操作は自動リトライ
- 詳細なエラーログ出力
- 部分的成功でも結果を保存