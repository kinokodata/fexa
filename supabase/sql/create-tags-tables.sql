-- タグ（ナレッジキーワード）テーブルの作成
CREATE TABLE IF NOT EXISTS tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    description TEXT,
    category VARCHAR(50), -- 'technology', 'concept', 'standard', 'method', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- タグの使用頻度を追跡するカラムを追加
ALTER TABLE tags ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- 問題-タグ関連テーブル
CREATE TABLE IF NOT EXISTS question_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3, 2) DEFAULT 1.0 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    UNIQUE(question_id, tag_id)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_question_tags_question ON question_tags(question_id);
CREATE INDEX IF NOT EXISTS idx_question_tags_tag ON question_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_question_tags_primary ON question_tags(is_primary);

-- Row Level Security (RLS) を有効化
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_tags ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー（読み取りは全員、書き込みは認証済みユーザー）
CREATE POLICY "Tags are viewable by everyone" 
    ON tags FOR SELECT 
    USING (true);

CREATE POLICY "Tags are insertable by authenticated users" 
    ON tags FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Tags are updatable by authenticated users" 
    ON tags FOR UPDATE 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Question tags are viewable by everyone" 
    ON question_tags FOR SELECT 
    USING (true);

CREATE POLICY "Question tags are insertable by authenticated users" 
    ON question_tags FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Question tags are updatable by authenticated users" 
    ON question_tags FOR UPDATE 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Question tags are deletable by authenticated users" 
    ON question_tags FOR DELETE 
    USING (auth.uid() IS NOT NULL);

-- よく使われるIT用語のタグを初期データとして投入
INSERT INTO tags (name, display_name, category, description) VALUES
    -- ネットワーク関連
    ('tcp_ip', 'TCP/IP', 'technology', 'TCP/IPプロトコルスイート'),
    ('osi', 'OSI参照モデル', 'concept', 'OSI7層モデル'),
    ('http', 'HTTP', 'technology', 'HyperText Transfer Protocol'),
    ('https', 'HTTPS', 'technology', 'HTTP Secure'),
    ('dns', 'DNS', 'technology', 'Domain Name System'),
    ('dhcp', 'DHCP', 'technology', 'Dynamic Host Configuration Protocol'),
    ('ipv4', 'IPv4', 'technology', 'Internet Protocol version 4'),
    ('ipv6', 'IPv6', 'technology', 'Internet Protocol version 6'),
    ('routing', 'ルーティング', 'concept', 'パケットの経路制御'),
    ('vlan', 'VLAN', 'technology', 'Virtual LAN'),
    
    -- セキュリティ関連
    ('encryption', '暗号化', 'concept', 'データの暗号化技術'),
    ('firewall', 'ファイアウォール', 'technology', 'ネットワークセキュリティ機器'),
    ('ids', 'IDS', 'technology', '侵入検知システム'),
    ('ips', 'IPS', 'technology', '侵入防止システム'),
    ('ssl', 'SSL', 'technology', 'Secure Sockets Layer'),
    ('tls', 'TLS', 'technology', 'Transport Layer Security'),
    ('authentication', '認証', 'concept', 'ユーザー認証'),
    ('authorization', '認可', 'concept', 'アクセス権限管理'),
    ('hash', 'ハッシュ', 'concept', 'ハッシュ関数'),
    ('public_key', '公開鍵', 'concept', '公開鍵暗号'),
    
    -- データベース関連
    ('sql', 'SQL', 'technology', 'Structured Query Language'),
    ('rdbms', 'RDBMS', 'technology', '関係データベース管理システム'),
    ('normalization', '正規化', 'concept', 'データベース正規化'),
    ('transaction', 'トランザクション', 'concept', 'データベーストランザクション'),
    ('acid', 'ACID', 'concept', 'Atomicity, Consistency, Isolation, Durability'),
    ('index', 'インデックス', 'concept', 'データベースインデックス'),
    ('join', 'JOIN', 'concept', 'テーブル結合'),
    ('er_diagram', 'ER図', 'concept', 'Entity-Relationship Diagram'),
    
    -- プログラミング関連
    ('algorithm', 'アルゴリズム', 'concept', 'プログラムの処理手順'),
    ('data_structure', 'データ構造', 'concept', 'データの組織化方法'),
    ('array', '配列', 'concept', '配列データ構造'),
    ('list', 'リスト', 'concept', 'リストデータ構造'),
    ('stack', 'スタック', 'concept', 'LIFO型データ構造'),
    ('queue', 'キュー', 'concept', 'FIFO型データ構造'),
    ('tree', '木構造', 'concept', 'ツリー構造'),
    ('binary_tree', '二分木', 'concept', '二分探索木'),
    ('sort', 'ソート', 'concept', '整列アルゴリズム'),
    ('search', '探索', 'concept', '探索アルゴリズム'),
    ('recursion', '再帰', 'concept', '再帰的処理'),
    ('oop', 'オブジェクト指向', 'concept', 'Object-Oriented Programming'),
    
    -- OS関連
    ('process', 'プロセス', 'concept', 'OSプロセス管理'),
    ('thread', 'スレッド', 'concept', 'マルチスレッド処理'),
    ('memory_management', 'メモリ管理', 'concept', 'メモリ管理技術'),
    ('virtual_memory', '仮想記憶', 'concept', '仮想メモリシステム'),
    ('cache', 'キャッシュ', 'technology', 'キャッシュメモリ'),
    ('scheduling', 'スケジューリング', 'concept', 'プロセススケジューリング'),
    
    -- プロジェクト管理
    ('waterfall', 'ウォーターフォール', 'method', 'ウォーターフォール開発'),
    ('agile', 'アジャイル', 'method', 'アジャイル開発'),
    ('scrum', 'スクラム', 'method', 'スクラム開発手法'),
    ('gantt_chart', 'ガントチャート', 'concept', 'プロジェクトスケジュール表'),
    ('pert', 'PERT', 'method', 'Program Evaluation and Review Technique'),
    ('critical_path', 'クリティカルパス', 'concept', 'クリティカルパス法')
ON CONFLICT (name) DO NOTHING;

-- タグの使用統計を更新するトリガー関数
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
DROP TRIGGER IF EXISTS update_tag_usage_on_insert ON question_tags;
CREATE TRIGGER update_tag_usage_on_insert
    AFTER INSERT OR DELETE ON question_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_usage_count();

-- ビュー：問題とタグの結合ビュー
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
    t.category as tag_category,
    qt.relevance_score,
    qt.is_primary,
    qt.created_at
FROM question_tags qt
JOIN questions q ON qt.question_id = q.id
JOIN tags t ON qt.tag_id = t.id
LEFT JOIN exams e ON q.exam_id = e.id;

-- 統計ビュー：タグ使用頻度ランキング
CREATE OR REPLACE VIEW tag_usage_stats AS
SELECT 
    t.id,
    t.name,
    t.display_name,
    t.category,
    t.usage_count,
    RANK() OVER (ORDER BY t.usage_count DESC) as usage_rank
FROM tags t
WHERE t.usage_count > 0
ORDER BY t.usage_count DESC;