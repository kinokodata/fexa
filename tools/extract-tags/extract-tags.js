import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .envファイルを読み込む
dotenv.config({ path: join(__dirname, '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// カテゴリIDをキャッシュ
let categoryCache = {};

// 小分類カテゴリを取得
async function getCategoryId(categoryName) {
  if (categoryCache[categoryName]) {
    return categoryCache[categoryName];
  }
  
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('category_level', 'minor')
    .ilike('name', `%${categoryName}%`)
    .limit(1)
    .single();
  
  if (data) {
    categoryCache[categoryName] = data.id;
    return data.id;
  }
  
  return null;
}

// IT用語の辞書（拡張可能）
const IT_KEYWORDS = {
  // ネットワーク
  'tcp/ip': { name: 'tcp_ip', display: 'TCP/IP', category: 'ネットワーク' },
  'tcp': { name: 'tcp', display: 'TCP', category: 'ネットワーク' },
  'ip': { name: 'ip', display: 'IP', category: 'ネットワーク' },
  'udp': { name: 'udp', display: 'UDP', category: 'ネットワーク' },
  'http': { name: 'http', display: 'HTTP', category: 'ネットワーク' },
  'https': { name: 'https', display: 'HTTPS', category: 'ネットワーク' },
  'ssl': { name: 'ssl', display: 'SSL', category: 'technology' },
  'tls': { name: 'tls', display: 'TLS', category: 'technology' },
  'dns': { name: 'dns', display: 'DNS', category: 'technology' },
  'dhcp': { name: 'dhcp', display: 'DHCP', category: 'technology' },
  'nat': { name: 'nat', display: 'NAT', category: 'technology' },
  'arp': { name: 'arp', display: 'ARP', category: 'technology' },
  'icmp': { name: 'icmp', display: 'ICMP', category: 'technology' },
  'smtp': { name: 'smtp', display: 'SMTP', category: 'technology' },
  'pop3': { name: 'pop3', display: 'POP3', category: 'technology' },
  'imap': { name: 'imap', display: 'IMAP', category: 'technology' },
  'ftp': { name: 'ftp', display: 'FTP', category: 'technology' },
  'telnet': { name: 'telnet', display: 'Telnet', category: 'technology' },
  'ssh': { name: 'ssh', display: 'SSH', category: 'technology' },
  'vpn': { name: 'vpn', display: 'VPN', category: 'technology' },
  'vlan': { name: 'vlan', display: 'VLAN', category: 'technology' },
  'ipv4': { name: 'ipv4', display: 'IPv4', category: 'technology' },
  'ipv6': { name: 'ipv6', display: 'IPv6', category: 'technology' },
  'ルータ': { name: 'router', display: 'ルータ', category: 'technology' },
  'スイッチ': { name: 'switch', display: 'スイッチ', category: 'technology' },
  'ハブ': { name: 'hub', display: 'ハブ', category: 'technology' },
  'ファイアウォール': { name: 'firewall', display: 'ファイアウォール', category: 'technology' },
  'プロキシ': { name: 'proxy', display: 'プロキシ', category: 'technology' },
  'ロードバランサ': { name: 'load_balancer', display: 'ロードバランサ', category: 'technology' },
  
  // セキュリティ
  '暗号': { name: 'encryption', display: '暗号化', category: 'セキュリティ' },
  '認証': { name: 'authentication', display: '認証', category: 'セキュリティ' },
  '認可': { name: 'authorization', display: '認可', category: 'concept' },
  'パスワード': { name: 'password', display: 'パスワード', category: 'concept' },
  'ハッシュ': { name: 'hash', display: 'ハッシュ', category: 'concept' },
  '公開鍵': { name: 'public_key', display: '公開鍵', category: 'concept' },
  '秘密鍵': { name: 'private_key', display: '秘密鍵', category: 'concept' },
  '電子署名': { name: 'digital_signature', display: '電子署名', category: 'concept' },
  '電子証明': { name: 'digital_certificate', display: '電子証明書', category: 'concept' },
  'pki': { name: 'pki', display: 'PKI', category: 'technology' },
  'ca': { name: 'ca', display: 'CA（認証局）', category: 'technology' },
  'ids': { name: 'ids', display: 'IDS', category: 'technology' },
  'ips': { name: 'ips', display: 'IPS', category: 'technology' },
  'waf': { name: 'waf', display: 'WAF', category: 'technology' },
  'ウイルス': { name: 'virus', display: 'ウイルス', category: 'concept' },
  'マルウェア': { name: 'malware', display: 'マルウェア', category: 'concept' },
  'ランサムウェア': { name: 'ransomware', display: 'ランサムウェア', category: 'concept' },
  'フィッシング': { name: 'phishing', display: 'フィッシング', category: 'concept' },
  'dos攻撃': { name: 'dos_attack', display: 'DoS攻撃', category: 'concept' },
  'ddos攻撃': { name: 'ddos_attack', display: 'DDoS攻撃', category: 'concept' },
  'sqlインジェクション': { name: 'sql_injection', display: 'SQLインジェクション', category: 'concept' },
  'xss': { name: 'xss', display: 'XSS', category: 'concept' },
  'csrf': { name: 'csrf', display: 'CSRF', category: 'concept' },
  
  // データベース
  'sql': { name: 'sql', display: 'SQL', category: 'データベース' },
  'select': { name: 'select', display: 'SELECT', category: 'concept' },
  'insert': { name: 'insert', display: 'INSERT', category: 'concept' },
  'update': { name: 'update', display: 'UPDATE', category: 'concept' },
  'delete': { name: 'delete', display: 'DELETE', category: 'concept' },
  'join': { name: 'join', display: 'JOIN', category: 'concept' },
  'inner join': { name: 'inner_join', display: 'INNER JOIN', category: 'concept' },
  'outer join': { name: 'outer_join', display: 'OUTER JOIN', category: 'concept' },
  'left join': { name: 'left_join', display: 'LEFT JOIN', category: 'concept' },
  'right join': { name: 'right_join', display: 'RIGHT JOIN', category: 'concept' },
  'トランザクション': { name: 'transaction', display: 'トランザクション', category: 'concept' },
  'acid': { name: 'acid', display: 'ACID', category: 'concept' },
  'コミット': { name: 'commit', display: 'コミット', category: 'concept' },
  'ロールバック': { name: 'rollback', display: 'ロールバック', category: 'concept' },
  '正規化': { name: 'normalization', display: '正規化', category: 'concept' },
  '第1正規形': { name: '1nf', display: '第1正規形', category: 'concept' },
  '第2正規形': { name: '2nf', display: '第2正規形', category: 'concept' },
  '第3正規形': { name: '3nf', display: '第3正規形', category: 'concept' },
  'er図': { name: 'er_diagram', display: 'ER図', category: 'concept' },
  'インデックス': { name: 'index', display: 'インデックス', category: 'concept' },
  'ビュー': { name: 'view', display: 'ビュー', category: 'concept' },
  'ストアドプロシージャ': { name: 'stored_procedure', display: 'ストアドプロシージャ', category: 'concept' },
  'トリガー': { name: 'trigger', display: 'トリガー', category: 'concept' },
  
  // プログラミング
  'アルゴリズム': { name: 'algorithm', display: 'アルゴリズム', category: 'アルゴリズム' },
  'データ構造': { name: 'data_structure', display: 'データ構造', category: 'concept' },
  '配列': { name: 'array', display: '配列', category: 'concept' },
  'リスト': { name: 'list', display: 'リスト', category: 'concept' },
  'スタック': { name: 'stack', display: 'スタック', category: 'concept' },
  'キュー': { name: 'queue', display: 'キュー', category: 'concept' },
  '木構造': { name: 'tree', display: '木構造', category: 'concept' },
  '二分木': { name: 'binary_tree', display: '二分木', category: 'concept' },
  '二分探索': { name: 'binary_search', display: '二分探索', category: 'concept' },
  'ハッシュテーブル': { name: 'hash_table', display: 'ハッシュテーブル', category: 'concept' },
  'ソート': { name: 'sort', display: 'ソート', category: 'concept' },
  'バブルソート': { name: 'bubble_sort', display: 'バブルソート', category: 'concept' },
  'クイックソート': { name: 'quick_sort', display: 'クイックソート', category: 'concept' },
  'マージソート': { name: 'merge_sort', display: 'マージソート', category: 'concept' },
  'ヒープソート': { name: 'heap_sort', display: 'ヒープソート', category: 'concept' },
  '再帰': { name: 'recursion', display: '再帰', category: 'concept' },
  'オブジェクト指向': { name: 'oop', display: 'オブジェクト指向', category: 'concept' },
  'クラス': { name: 'class', display: 'クラス', category: 'concept' },
  'インスタンス': { name: 'instance', display: 'インスタンス', category: 'concept' },
  '継承': { name: 'inheritance', display: '継承', category: 'concept' },
  'ポリモーフィズム': { name: 'polymorphism', display: 'ポリモーフィズム', category: 'concept' },
  'カプセル化': { name: 'encapsulation', display: 'カプセル化', category: 'concept' },
  
  // OS
  'プロセス': { name: 'process', display: 'プロセス', category: 'オペレーティングシステム' },
  'スレッド': { name: 'thread', display: 'スレッド', category: 'concept' },
  'マルチタスク': { name: 'multitasking', display: 'マルチタスク', category: 'concept' },
  'マルチスレッド': { name: 'multithreading', display: 'マルチスレッド', category: 'concept' },
  'デッドロック': { name: 'deadlock', display: 'デッドロック', category: 'concept' },
  'セマフォ': { name: 'semaphore', display: 'セマフォ', category: 'concept' },
  'ミューテックス': { name: 'mutex', display: 'ミューテックス', category: 'concept' },
  'メモリ管理': { name: 'memory_management', display: 'メモリ管理', category: 'concept' },
  '仮想記憶': { name: 'virtual_memory', display: '仮想記憶', category: 'concept' },
  'ページング': { name: 'paging', display: 'ページング', category: 'concept' },
  'スワップ': { name: 'swap', display: 'スワップ', category: 'concept' },
  'キャッシュ': { name: 'cache', display: 'キャッシュ', category: 'technology' },
  'バッファ': { name: 'buffer', display: 'バッファ', category: 'concept' },
  
  // プロジェクト管理
  'ウォーターフォール': { name: 'waterfall', display: 'ウォーターフォール', category: 'プロジェクト管理' },
  'アジャイル': { name: 'agile', display: 'アジャイル', category: 'method' },
  'スクラム': { name: 'scrum', display: 'スクラム', category: 'method' },
  'スプリント': { name: 'sprint', display: 'スプリント', category: 'concept' },
  'カンバン': { name: 'kanban', display: 'カンバン', category: 'method' },
  'ガントチャート': { name: 'gantt_chart', display: 'ガントチャート', category: 'concept' },
  'pert': { name: 'pert', display: 'PERT', category: 'method' },
  'クリティカルパス': { name: 'critical_path', display: 'クリティカルパス', category: 'concept' },
  'wbs': { name: 'wbs', display: 'WBS', category: 'concept' },
  'リスク管理': { name: 'risk_management', display: 'リスク管理', category: 'concept' },
};

// タグを抽出する関数
function extractTags(text) {
  const foundTags = new Set();
  const lowerText = text.toLowerCase();
  
  // キーワード辞書から検索
  for (const [keyword, tagInfo] of Object.entries(IT_KEYWORDS)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      foundTags.add(tagInfo);
    }
  }
  
  // 英数字の略語を抽出（2-10文字の大文字略語）
  const acronymPattern = /\b[A-Z]{2,10}\b/g;
  const acronyms = text.match(acronymPattern) || [];
  
  for (const acronym of acronyms) {
    const lowerAcronym = acronym.toLowerCase();
    if (IT_KEYWORDS[lowerAcronym]) {
      foundTags.add(IT_KEYWORDS[lowerAcronym]);
    } else if (acronym.length >= 3) {
      // 辞書にない3文字以上の略語も候補として追加
      foundTags.add({
        name: lowerAcronym,
        display: acronym,
        category: 'unknown'
      });
    }
  }
  
  return Array.from(foundTags);
}

// タグをDBに登録
async function registerTag(tagInfo) {
  // category_idは後で別途設定するため、ここでは設定しない
  const { data, error } = await supabase
    .from('tags')
    .upsert({
      name: tagInfo.name,
      display_name: tagInfo.display,
      category_type: tagInfo.category // カテゴリタイプを保持（後でcategory_idに変換する際の参考用）
    }, {
      onConflict: 'name',
      ignoreDuplicates: true
    })
    .select()
    .single();
    
  if (error && error.code !== '23505') { // 重複エラー以外
    console.error(`タグ登録エラー (${tagInfo.name}):`, error);
    return null;
  }
  
  return data;
}

// 問題とタグを関連付ける
async function linkQuestionTag(questionId, tagId) {
  const { data, error } = await supabase
    .from('question_tags')
    .upsert({
      question_id: questionId,
      tag_id: tagId
    }, {
      onConflict: 'question_id,tag_id',
      ignoreDuplicates: true
    });
    
  if (error && error.code !== '23505') {
    console.error(`関連付けエラー:`, error);
    return false;
  }
  
  return true;
}

// メイン処理
async function main() {
  console.log('タグ抽出処理を開始します...');
  
  // 処理対象を指定（コマンドライン引数から）
  const args = process.argv.slice(2);
  const targetYear = args[0] ? parseInt(args[0]) : null;
  const targetSeason = args[1] || null;
  const limit = args[2] ? parseInt(args[2]) : 100;
  
  // 問題を取得
  let query = supabase
    .from('questions')
    .select(`
      id,
      question_number,
      question_text,
      explanation,
      exam:exams!inner(year, season)
    `);
  
  if (targetYear) {
    query = query.eq('exam.year', targetYear);
  }
  if (targetSeason) {
    query = query.eq('exam.season', targetSeason);
  }
  
  query = query.limit(limit);
  
  const { data: questions, error } = await query;
  
  if (error) {
    console.error('問題取得エラー:', error);
    return;
  }
  
  console.log(`${questions.length}件の問題を処理します`);
  
  let totalTags = 0;
  let totalRelations = 0;
  
  for (const question of questions) {
    const exam = Array.isArray(question.exam) ? question.exam[0] : question.exam;
    console.log(`\n処理中: ${exam.year}年${exam.season} 問${question.question_number}`);
    
    // 問題文と解説からタグを抽出
    const textToAnalyze = `${question.question_text || ''} ${question.explanation || ''}`;
    const tags = extractTags(textToAnalyze);
    
    if (tags.length === 0) {
      console.log('  → タグが見つかりませんでした');
      continue;
    }
    
    console.log(`  → ${tags.length}個のタグを発見:`, tags.map(t => t.display).join(', '));
    
    // タグを登録して関連付け
    for (const tagInfo of tags) {
      // タグを登録または取得
      const { data: tagData } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagInfo.name)
        .single();
      
      let tagId;
      if (tagData) {
        tagId = tagData.id;
      } else {
        const newTag = await registerTag(tagInfo);
        if (newTag) {
          tagId = newTag.id;
          totalTags++;
        }
      }
      
      // 問題とタグを関連付け
      if (tagId) {
        const linked = await linkQuestionTag(question.id, tagId);
        if (linked) {
          totalRelations++;
        }
      }
    }
  }
  
  console.log('\n=== 処理完了 ===');
  console.log(`新規タグ登録数: ${totalTags}`);
  console.log(`関連付け作成数: ${totalRelations}`);
}

// 実行
main().catch(console.error);