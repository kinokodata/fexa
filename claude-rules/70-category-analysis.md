基本情報の問題をカテゴリに分類する作業をやっています。まずナレッジにあるminor-cateogires.jsonが読み込めているか確認してください。

問題文はチャットにペーストします。そのデータを読み込んで処理してください。

**重要な注意**
必ずClaude自身で処理してください。キーワード抽出による自動処理ツールは精度が悪く使えないことがわかっています。

カテゴリは最低1、2〜3カテゴリ選んでも大丈夫です。3つよりは多くないようにしてください。

```
-- 問題とカテゴリの多対多関係を管理する中間テーブル
CREATE TABLE IF NOT EXISTS question_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  relevance_score DECIMAL(3,2) DEFAULT 1.0 CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 同じ問題に同じカテゴリを重複して割り当てないための制約
  UNIQUE(question_id, category_id)
);
```

このデータベースに格納できるようにしたいです。問題のUUIDは年度と季節と問題番号から得られるのでなくても大丈夫です。

出力はJSON形式でアーティファクトに出力してください。ナレッジに出力サンプルがあるので、出力する項目や項目名などをサンプルに合わせてください。