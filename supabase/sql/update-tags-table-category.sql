-- tagsテーブルに小分類カテゴリへの関連を追加（オプショナル）

-- 既存のcategoryカラムがある場合はリネーム（カテゴリタイプとして保持）
ALTER TABLE tags RENAME COLUMN category TO category_type;

-- 新しいcategory_idカラムを追加（小分類カテゴリへの外部キー、NULL許可）
ALTER TABLE tags 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- category_typeカラムが存在しない場合は追加
ALTER TABLE tags 
ADD COLUMN IF NOT EXISTS category_type VARCHAR(50);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_tags_category_id ON tags(category_id);

-- 既存のタグを適切な小分類カテゴリに関連付ける
-- （例：ネットワーク関連のタグを「ネットワーク」小分類に関連付け）

-- まず、小分類カテゴリの一覧を確認するためのクエリ
-- SELECT id, name, path FROM categories WHERE category_level = 'minor';

-- タグとカテゴリのマッピング例
-- ネットワーク技術関連
UPDATE tags 
SET category_id = (
    SELECT id FROM categories 
    WHERE category_level = 'minor' 
    AND name LIKE '%ネットワーク%'
    LIMIT 1
)
WHERE name IN ('tcp_ip', 'tcp', 'ip', 'udp', 'http', 'https', 'dns', 'dhcp', 'nat', 'arp', 
               'icmp', 'smtp', 'pop3', 'imap', 'ftp', 'telnet', 'ssh', 'vpn', 'vlan', 
               'ipv4', 'ipv6', 'router', 'switch', 'hub', 'proxy', 'load_balancer');

-- セキュリティ関連
UPDATE tags 
SET category_id = (
    SELECT id FROM categories 
    WHERE category_level = 'minor' 
    AND name LIKE '%セキュリティ%'
    LIMIT 1
)
WHERE name IN ('encryption', 'firewall', 'ids', 'ips', 'ssl', 'tls', 'authentication', 
               'authorization', 'hash', 'public_key', 'private_key', 'digital_signature',
               'digital_certificate', 'pki', 'ca', 'waf', 'virus', 'malware', 
               'ransomware', 'phishing', 'dos_attack', 'ddos_attack', 'sql_injection', 
               'xss', 'csrf', 'password');

-- データベース関連
UPDATE tags 
SET category_id = (
    SELECT id FROM categories 
    WHERE category_level = 'minor' 
    AND name LIKE '%データベース%'
    LIMIT 1
)
WHERE name IN ('sql', 'select', 'insert', 'update', 'delete', 'join', 'inner_join', 
               'outer_join', 'left_join', 'right_join', 'rdbms', 'normalization', 
               'transaction', 'acid', 'commit', 'rollback', '1nf', '2nf', '3nf', 
               'er_diagram', 'index', 'view', 'stored_procedure', 'trigger');

-- アルゴリズムとデータ構造関連
UPDATE tags 
SET category_id = (
    SELECT id FROM categories 
    WHERE category_level = 'minor' 
    AND (name LIKE '%アルゴリズム%' OR name LIKE '%データ構造%')
    LIMIT 1
)
WHERE name IN ('algorithm', 'data_structure', 'array', 'list', 'stack', 'queue', 
               'tree', 'binary_tree', 'binary_search', 'hash_table', 'sort', 
               'bubble_sort', 'quick_sort', 'merge_sort', 'heap_sort', 'recursion');

-- オブジェクト指向関連
UPDATE tags 
SET category_id = (
    SELECT id FROM categories 
    WHERE category_level = 'minor' 
    AND name LIKE '%オブジェクト指向%'
    LIMIT 1
)
WHERE name IN ('oop', 'class', 'instance', 'inheritance', 'polymorphism', 'encapsulation');

-- OS関連
UPDATE tags 
SET category_id = (
    SELECT id FROM categories 
    WHERE category_level = 'minor' 
    AND name LIKE '%オペレーティングシステム%'
    LIMIT 1
)
WHERE name IN ('process', 'thread', 'multitasking', 'multithreading', 'deadlock', 
               'semaphore', 'mutex', 'memory_management', 'virtual_memory', 'paging', 
               'swap', 'cache', 'buffer');

-- プロジェクト管理関連
UPDATE tags 
SET category_id = (
    SELECT id FROM categories 
    WHERE category_level = 'minor' 
    AND name LIKE '%プロジェクト%'
    LIMIT 1
)
WHERE name IN ('waterfall', 'agile', 'scrum', 'sprint', 'kanban', 'gantt_chart', 
               'pert', 'critical_path', 'wbs', 'risk_management');

-- ビューを更新して、カテゴリ情報を含める
DROP VIEW IF EXISTS question_tags_view;
CREATE OR REPLACE VIEW question_tags_view AS
SELECT 
    qt.id as relation_id,
    q.id as question_id,
    q.question_number,
    e.year,
    e.season,
    t.id as tag_id,
    t.name as tag_name,
    t.display_name as tag_display_name,
    t.category_id,
    c.name as category_name,
    c.path as category_path,
    qt.relevance_score,
    qt.is_primary,
    qt.created_at
FROM question_tags qt
JOIN questions q ON qt.question_id = q.id
JOIN tags t ON qt.tag_id = t.id
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN exams e ON q.exam_id = e.id;

-- タグ使用統計ビューも更新
DROP VIEW IF EXISTS tag_usage_stats;
CREATE OR REPLACE VIEW tag_usage_stats AS
SELECT 
    t.id,
    t.name,
    t.display_name,
    t.category_id,
    c.name as category_name,
    c.path as category_path,
    t.usage_count,
    RANK() OVER (ORDER BY t.usage_count DESC) as usage_rank
FROM tags t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.usage_count > 0
ORDER BY t.usage_count DESC;

-- カテゴリごとのタグ統計ビュー
CREATE OR REPLACE VIEW category_tag_stats AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    c.path as category_path,
    COUNT(DISTINCT t.id) as tag_count,
    SUM(t.usage_count) as total_usage
FROM categories c
LEFT JOIN tags t ON t.category_id = c.id
WHERE c.category_level = 'minor'
GROUP BY c.id, c.name, c.path
ORDER BY total_usage DESC;

-- 古いcategory_typeカラムを削除（必要に応じて実行）
-- ALTER TABLE tags DROP COLUMN category_type;