# API開発ルール

VercelデプロイのAPIおよびローカル開発用APIサーバーの開発ルールです。

## 基本方針

### 読み取り専用API
- **GET メソッドのみ対応**
- POST/PUT/DELETE は一切実装しない
- データ作成・更新はインポートツール専用

### Vercel Functions対応
- 各エンドポイントは独立したファイル
- `api/` ディレクトリ配下に配置
- サーバーレス環境での軽量動作を重視

## ファイル構成

```
api/
├── health.js              # ヘルスチェック
├── exams/
│   └── index.js          # 試験一覧
└── questions/
    ├── index.js          # 問題一覧
    └── [id].js           # 問題詳細

backend/src/
└── server.js             # ローカル開発用簡易サーバー
```

## エンドポイント設計

### ヘルスチェック
```
GET /api/health
GET /api/health?detailed=true
```
- Supabase接続状態を確認
- detailed=true で詳細診断
- レスポンス時間 < 1秒

### 試験一覧
```
GET /api/exams
```
- 年度・季節の組み合わせ一覧
- 新しい年度順でソート
- 問題数も含めて返却

### 問題一覧
```
GET /api/questions
GET /api/questions?year=2024&season=春期
GET /api/questions?page=2&limit=10
```
- デフォルト: 20件/ページ
- 年度・季節でフィルタリング可能
- 選択肢も含めて返却

### 問題詳細
```
GET /api/questions/{id}
```
- UUID指定で1問の詳細取得
- 選択肢・解答・画像も含む
- 404時は適切なエラーレスポンス

## レスポンス形式

### 成功レスポンス
```javascript
{
  "success": true,
  "data": { ... },
  "pagination": {        // 一覧系のみ
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### エラーレスポンス
```javascript
{
  "success": false,
  "error": {
    "message": "日本語エラーメッセージ",
    "details": "技術的詳細（開発環境のみ）"
  }
}
```

## Supabase連携

### クライアント初期化
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,  // 読み取り専用
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);
```

### クエリパターン
```javascript
// 基本取得
const { data, error } = await supabase
  .from('questions')
  .select('*')
  .eq('exam_id', examId);

// JOINを含む取得
const { data, error } = await supabase
  .from('questions')
  .select(`
    *,
    exam:exams(year, season),
    choices(choice_label, choice_text)
  `);
```

## エラーハンドリング

### Supabaseエラー処理
```javascript
if (error) {
  if (error.code === 'PGRST116') {
    return res.status(404).json({
      success: false,
      error: { message: 'データが見つかりません' }
    });
  }
  throw error;
}
```

### 一般的なエラー処理
```javascript
try {
  // API処理
} catch (error) {
  logger.error('APIエラー:', error);
  res.status(500).json({
    success: false,
    error: {
      message: 'サーバーエラーが発生しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
  });
}
```

## CORS設定

### 許可オリジン
- `http://localhost:43000` (開発環境フロントエンド)
- `https://*.vercel.app` (本番フロントエンド)
- カスタムドメイン（環境変数で指定）

### ヘッダー設定
```javascript
res.setHeader('Access-Control-Allow-Origin', origin);
res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

## パフォーマンス

### 応答時間目標
- ヘルスチェック: < 500ms
- 単純取得: < 1秒
- 複雑なJOIN: < 2秒

### キャッシュ戦略
- Vercel Edge Cache活用
- 頻繁に変更されないデータは長めのTTL
- 開発環境では無効化

### データ量制限
- 一覧取得: 最大100件/リクエスト
- 問題詳細: 1件ずつ
- 大きなレスポンスはページング必須

## ログ・モニタリング

### ログ出力
```javascript
// 構造化ログ
logger.info('API呼び出し', {
  endpoint: req.path,
  method: req.method,
  params: req.query,
  userAgent: req.headers['user-agent']
});
```

### エラートラッキング
- 全てのエラーをログ出力
- 本番環境では詳細情報を隠す
- レスポンス時間の監視

## 環境変数

### 必須設定
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
CORS_ORIGIN=http://localhost:43000
```

### オプション設定
```env
LOG_LEVEL=info
API_BASE_URL=http://localhost:43001
```

## テスト方法

### cURLテスト
```bash
# ヘルスチェック
curl http://localhost:43001/api/health

# 試験一覧
curl http://localhost:43001/api/exams

# 問題一覧
curl "http://localhost:43001/api/questions?year=2024"

# 問題詳細
curl http://localhost:43001/api/questions/{id}
```

### ブラウザテスト
- フロントエンドから実際にAPIを呼び出し
- ネットワークタブでレスポンス確認
- エラー状態の動作確認

この設計により、外部システムから安全にデータを取得できる、堅牢で高速なAPIを提供します。