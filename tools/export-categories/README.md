# Export Categories Tool

Claude Web版で作成された `category-data.json` ファイルをデータベースの `question_categories` テーブルに登録するツールです。

## 📋 機能

- `category-data.json` から問題とカテゴリの紐づけ情報を読み込み
- APIサーバー経由でデータベースに登録
- 重複チェックとエラーハンドリング
- 処理進捗の表示

## 🚀 使用方法

### Docker環境での実行（推奨）

```bash
# 2010年春期のカテゴリデータを登録
docker compose run --rm export-categories node index.js 2010 h

# 2019年秋期のカテゴリデータを登録
docker compose run --rm export-categories node index.js 2019 a
```

### 引数

- 第1引数: 年度（4桁数字）
- 第2引数: 季節
  - `h`: 春期（haru）
  - `a`: 秋期（aki）

## 📝 入力ファイル形式

読み込み対象: `/pdfs/YYYY_X/category-data.json`

```json
{
  "2010年春期": [
    {
      "questionNumber": 1,
      "categories": [
        {
          "field": "テクノロジ系",
          "major": "基礎理論",
          "medium": "基礎理論", 
          "minor": "離散数学",
          "knowledge": "集合・論理演算"
        }
      ]
    }
  ]
}
```

## 🔄 処理フロー

1. APIサーバーに認証
2. `category-data.json` ファイルの読み込み
3. 各問題のカテゴリ情報を解析
4. データベースの問題IDとカテゴリIDを照合
5. `question_categories` テーブルに登録
6. 処理結果のレポート表示

## 📊 出力例

```
🚀 カテゴリエクスポート開始
📅 対象: 2010年春期
🔐 API認証を実行中...
✅ 認証成功
📁 カテゴリデータファイルを読み込み中: /pdfs/2010_h/category-data.json
📊 処理対象: 73問の問題
💾 カテゴリ登録中: 15/73
🎉 すべての処理が正常に完了しました！
```

## ⚠️ 注意事項

- Claude Web版で作成された `category-data.json` が必要
- APIサーバーが起動している必要があります
- 重複するカテゴリ登録は自動的にスキップされます

## 🔗 関連ファイル

- `/pdfs/YYYY_X/category-data.json`: 入力ファイル（Claude Web版で作成）
- データベーステーブル: `question_categories`

## 環境変数

```env
API_BASE_URL=http://backend:3000
APPLICATION_SERVICE_USER=service@example.com
APPLICATION_SERVICE_PASSWORD=password
```