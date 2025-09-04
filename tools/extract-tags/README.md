# タグ抽出ツール

問題文と解説文からIT用語のタグ（ナレッジキーワード）を自動抽出して登録するツール

## 概要

このツールは以下の処理を行います：
1. 問題文と解説文からIT用語を抽出
2. タグとしてデータベースに登録
3. 問題とタグの関連付けを作成

## 使用方法

### Docker Composeを使用

```bash
# 全問題を処理（最大100件）
docker compose run --rm extract-tags

# 特定年度の問題を処理
docker compose run --rm extract-tags 2023 春期

# 件数を指定
docker compose run --rm extract-tags 2023 春期 50
```

### 直接実行

```bash
cd tools/extract-tags
npm install
node extract-tags.js [year] [season] [limit]
```

## タグのカテゴリ

- **technology**: 具体的な技術（HTTP, SQL, TCP/IPなど）
- **concept**: 概念・理論（アルゴリズム、正規化、認証など）
- **method**: 手法・方法論（アジャイル、ウォーターフォールなど）
- **standard**: 規格・標準（ISO, JISなど）
- **unknown**: 自動抽出された未分類の用語

## データベース構造

### tagsテーブル
- id: UUID (PK)
- name: タグ名（一意）
- display_name: 表示名
- description: 説明
- category: カテゴリ
- usage_count: 使用回数

### question_tagsテーブル
- id: UUID (PK)
- question_id: 問題ID (FK)
- tag_id: タグID (FK)
- relevance_score: 関連度（0.0-1.0）
- is_primary: 主要タグフラグ

## 拡張方法

`extract-tags.js`の`IT_KEYWORDS`オブジェクトに新しいキーワードを追加することで、抽出対象を増やせます：

```javascript
const IT_KEYWORDS = {
  // 新しいキーワードを追加
  '新技術': { name: 'new_tech', display: '新技術', category: 'technology' },
  // ...
};
```

## 注意事項

- 既に登録済みのタグは重複登録されません
- 問題とタグの関連付けも重複しません
- 大文字小文字は正規化されます（検索時は case-insensitive）