# Export Answer Tool

試験問題の解答データをエクスポートするツール

## 使用方法

### Docker環境での実行

```bash
# 試験解析の実行（推奨）
docker compose run --rm export-answer node index.js 2019 春期

# 他の例
docker compose run --rm export-answer node index.js 2018 秋期
docker compose run --rm export-answer node index.js 2009 秋期
```

### ローカル環境での実行

```bash
# 依存関係のインストール
npm install

# 試験解析の実行
npm run analyze 2019 春期
# または
node index.js 2019 春期
```

## 出力先

解答データは以下のパターンで保存されます：

```
pdfs/
  2009_a/answers.json  # 2009年秋期
  2019_h/answers.json  # 2019年春期  
  2019_a/answers.json  # 2019年秋期
  2018_a/answers.json  # 2018年秋期
```

## 対応する試験

- 基本情報技術者試験の各年度・季節
- 季節コード: h=春期, a=秋期

## 出力形式

```json
{
  "question_uuid": {
    "question_number": 1,
    "correct_choice": "ア",
    "explanation": "解説文...",
    "choices": [
      {
        "label": "ア",
        "text": "選択肢テキスト",
        "is_correct": true
      }
    ]
  }
}
```