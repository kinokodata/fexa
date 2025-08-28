-- 基本情報技術者試験の詳細カテゴリ階層データ

-- 親カテゴリの挿入（既存データを更新）
INSERT INTO categories (name, description, parent_id) VALUES
    ('テクノロジ', '技術要素、コンピュータシステム、技術要素', NULL),
    ('マネジメント', 'プロジェクトマネジメント、サービスマネジメント', NULL),
    ('ストラテジ', '企業と法務、経営戦略、システム戦略', NULL)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 子カテゴリの挿入
WITH parent_categories AS (
    SELECT id, name FROM categories WHERE parent_id IS NULL
)
INSERT INTO categories (name, description, parent_id) VALUES
    -- テクノロジ系の子カテゴリ
    ('基礎理論', 'アルゴリズム、プログラミング、情報に関する理論', (SELECT id FROM parent_categories WHERE name = 'テクノロジ')),
    ('コンピュータシステム', 'コンピュータ構成要素、システム構成要素、ソフトウェア', (SELECT id FROM parent_categories WHERE name = 'テクノロジ')),
    ('技術要素', 'ヒューマンインターフェース、マルチメディア、データベース、ネットワーク、セキュリティ', (SELECT id FROM parent_categories WHERE name = 'テクノロジ')),
    
    -- マネジメント系の子カテゴリ
    ('プロジェクトマネジメント', 'プロジェクトマネジメント', (SELECT id FROM parent_categories WHERE name = 'マネジメント')),
    ('サービスマネジメント', 'サービスマネジメント、システム監査', (SELECT id FROM parent_categories WHERE name = 'マネジメント')),
    
    -- ストラテジ系の子カテゴリ
    ('システム戦略', 'システム戦略、システム企画', (SELECT id FROM parent_categories WHERE name = 'ストラテジ')),
    ('経営戦略', '経営戦略マネジメント、技術戦略マネジメント、ビジネスインダストリ', (SELECT id FROM parent_categories WHERE name = 'ストラテジ')),
    ('企業と法務', '企業活動、法務', (SELECT id FROM parent_categories WHERE name = 'ストラテジ'))
ON CONFLICT (name) DO NOTHING;

-- さらに詳細なサブカテゴリの挿入
WITH tech_categories AS (
    SELECT c.id, c.name 
    FROM categories c 
    JOIN categories p ON c.parent_id = p.id 
    WHERE p.name = 'テクノロジ'
)
INSERT INTO categories (name, description, parent_id) VALUES
    -- 基礎理論のサブカテゴリ
    ('離散数学', '集合・論理演算、数値表現、データ構造', (SELECT id FROM tech_categories WHERE name = '基礎理論')),
    ('アルゴリズムとプログラミング', 'アルゴリズム、プログラミング言語', (SELECT id FROM tech_categories WHERE name = '基礎理論')),
    
    -- コンピュータシステムのサブカテゴリ  
    ('コンピュータ構成要素', 'プロセッサ、メモリ、入出力装置', (SELECT id FROM tech_categories WHERE name = 'コンピュータシステム')),
    ('システム構成要素', 'システム構成、クライアントサーバシステム', (SELECT id FROM tech_categories WHERE name = 'コンピュータシステム')),
    ('ソフトウェア', 'オペレーティングシステム、ミドルウェア', (SELECT id FROM tech_categories WHERE name = 'コンピュータシステム')),
    
    -- 技術要素のサブカテゴリ
    ('データベース', 'データベース方式、データベース言語、トランザクション処理', (SELECT id FROM tech_categories WHERE name = '技術要素')),
    ('ネットワーク', 'ネットワーク方式、通信プロトコル', (SELECT id FROM tech_categories WHERE name = '技術要素')),
    ('セキュリティ', '情報セキュリティ、セキュリティ技術評価', (SELECT id FROM tech_categories WHERE name = '技術要素')),
    ('システム開発技術', 'システム開発技術、ソフトウェア開発管理技術', (SELECT id FROM tech_categories WHERE name = '技術要素'))
ON CONFLICT (name) DO NOTHING;

-- カテゴリ階層表示用のビューも作成
CREATE OR REPLACE VIEW category_hierarchy AS
WITH RECURSIVE category_tree AS (
    -- ルートカテゴリ
    SELECT 
        id,
        name,
        description,
        parent_id,
        0 as level,
        CAST(name AS TEXT) as path
    FROM categories 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- 子カテゴリ
    SELECT 
        c.id,
        c.name,
        c.description,
        c.parent_id,
        ct.level + 1,
        ct.path || ' > ' || c.name
    FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree
ORDER BY path;