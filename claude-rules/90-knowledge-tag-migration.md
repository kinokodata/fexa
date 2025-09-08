# ナレッジカテゴリからタグシステムへの移行ルール

## 📋 移行の概要

既存のcategoriesテーブルの`category_type='knowledge'`データを新しいtagsテーブルに移行し、より柔軟なタグシステムを構築する。

## 🎯 移行の目的

1. **カテゴリとタグの分離**: 階層構造（カテゴリ）とフラット構造（タグ）を明確に分ける
2. **検索性の向上**: ナレッジキーワードによる柔軟な検索・分析を可能にする
3. **管理の効率化**: タグの追加・編集・関連付けを簡素化する

## 🔧 技術的な移行仕様

### データ構造の対応関係

| 移行元（categories） | 移行先（tags） | 備考 |
|---|---|---|
| `id` | `id` | **IDをそのまま維持**（重要） |
| `name` | `display_name` | 表示用の名前 |
| `name`（正規化） | `name` | 識別子用（小文字+アンダースコア） |
| `parent_id` | `category_id` | 小分類カテゴリとの関連 |
| `path` | `description` | 元のカテゴリパスを説明欄に記録 |

### 関連データの対応関係

| 移行元 | 移行先 | 備考 |
|---|---|---|
| `question_category_relations` | `question_tags` | 問題とタグの関連 |
| `category_id` | `tag_id` | **IDをそのまま維持** |
| `relevance_score` | `relevance_score` | 関連度スコア |
| `is_primary` | `is_primary` | 主要タグフラグ |

## 📁 実行ファイル

1. **`sql/create-tags-schema.sql`**: tagsとquestion_tagsテーブルの作成
2. **`sql/migrate-knowledge-to-tags.sql`**: knowledgeカテゴリの移行処理

## ⚠️ 重要な移行ルール

### 1. データの保護原則

- **元データは削除しない**: categoriesテーブルのknowledgeデータは保持
- **関連データも保持**: question_category_relationsも削除しない
- **後方互換性**: 既存システムが動作し続けることを保証

### 2. IDの継続性

- **knowledgeカテゴリのIDを継承**: tags.id = categories.id
- **関連の継続性**: question_tags.tag_id = question_category_relations.category_id
- **外部キーの整合性**: 既存の参照関係を維持

### 3. 移行の段階的実行

```sql
-- Phase 1: tagsテーブル作成
-- sql/create-tags-schema.sql を実行

-- Phase 2: データ移行（コピー）
-- sql/migrate-knowledge-to-tags.sql を実行

-- Phase 3: 検証期間
-- 両方のシステム（categories/tags）が並行稼働

-- Phase 4: 移行完了後（将来実行）
-- knowledgeカテゴリの削除（十分な検証後）
```

## 🔍 検証項目

### 移行直後の確認

```sql
-- 1. 移行されたタグ数の確認
SELECT COUNT(*) FROM tags WHERE description LIKE '%元カテゴリパス:%';

-- 2. 問題-タグ関連の確認
SELECT COUNT(*) FROM question_tags WHERE created_by = 'migration_from_categories';

-- 3. カテゴリ関連の確認
SELECT 
    c.name as category_name,
    COUNT(t.id) as tag_count
FROM categories c
LEFT JOIN tags t ON c.id = t.category_id
WHERE c.category_level = 'minor'
GROUP BY c.name
HAVING COUNT(t.id) > 0;
```

### データ整合性の確認

```sql
-- knowledgeカテゴリと対応するtagsのID一致確認
SELECT 
    c.id as category_id,
    t.id as tag_id,
    c.name as category_name,
    t.display_name as tag_name
FROM categories c
LEFT JOIN tags t ON c.id = t.id
WHERE c.category_type = 'knowledge'
  AND (t.id IS NULL OR c.id != t.id);  -- 不一致があれば表示
```

## 🚀 移行後の運用

### 新しいタグの追加

- **手動追加**: 管理画面やSQLで直接追加
- **自動抽出**: タグ抽出ツールで問題文から自動抽出
- **カテゴリ関連**: 後からcategory_idを設定可能

### 既存データとの共存

- **読み取り**: categories（knowledge）とtagsの両方から参照可能
- **更新**: 新規データはtagsテーブルを使用
- **削除**: 十分な検証期間後、knowledgeカテゴリを削除

## 📊 移行の利点

1. **パフォーマンス向上**: タグベースの検索が高速
2. **柔軟性**: 複数タグの組み合わせ検索
3. **管理の簡素化**: 階層構造に縛られない自由なタグ付け
4. **拡張性**: 新しいタグの動的追加が容易

## ⚡ 次のステップ

1. ✅ tagsテーブルスキーマ作成
2. ✅ knowledgeカテゴリ移行
3. 🔄 タグ抽出ツール開発
4. 📈 年度別タグ抽出実行
5. 🔍 データ分析・検証
6. 🗑️ 旧システムクリーンアップ（将来）

