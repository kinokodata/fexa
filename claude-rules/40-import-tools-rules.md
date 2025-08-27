# インポートツール開発ルール

PDFファイルからSupabaseへの問題データインポートを行うツールの開発ルールです。

## 基本方針

### 独立コンテナ運用
- APIサーバーとは完全分離
- Dockerコンテナ内で実行
- 必要時のみ起動・実行

### バッチ処理特化
- 大量データの一括処理に対応
- エラー耐性の高い設計
- 処理進捗の可視化

## ファイル構成

```
tools/
├── Dockerfile
├── package.json
├── import-pdf.js           # メインスクリプト
└── lib/
    ├── logger.js          # ログ機能
    ├── supabase.js        # DB接続
    └── pdfParser.js       # PDF解析エンジン
```

## 実行方法

### Docker環境での実行
```bash
# 単一ファイルのインポート
docker compose exec tools node import-pdf.js /pdfs/2024/fe24s_am.pdf 2024 春期

# 複数ファイルの一括インポート
docker compose exec tools sh -c 'for pdf in /pdfs/2024/*.pdf; do node import-pdf.js "$pdf" 2024 春期; done'
```

### 引数バリデーション
- 第1引数: PDFファイルパス（必須）
- 第2引数: 年度（4桁数字、必須）
- 第3引数: 季節（春期/秋期、必須）

## PDF解析仕様

### 対象PDFファイル
- IPA公開の基本情報技術者試験過去問
- 午前問題・午後問題の両方に対応
- ファイルサイズ制限なし（処理時間は考慮）

### 問題検出パターン
```javascript
// 問題番号パターン
/問\s*(\d+)/g

// 選択肢パターン  
/^([アイウエ])\s+(.+)/

// ページ番号除外パターン
/－\s*\d+\s*－/
```

### 解析対象要素
- 問題番号（必須）
- 問題文（必須）
- 選択肢ア〜エ（オプション）
- 問題種別（午前/午後、自動判定）

## データ保存仕様

### データベーステーブル
1. **exams**: 試験情報（年度・季節）
2. **questions**: 問題本体
3. **choices**: 選択肢
4. **import_history**: インポート履歴

### 重複処理
- 同一試験・問題番号・問題種別の組み合わせをチェック
- 既存データがある場合はスキップ
- 強制上書きオプションは提供しない

### トランザクション
- 問題単位でトランザクション処理
- 1問の失敗が他に影響しない設計
- 部分的成功も記録

## エラーハンドリング

### 処理継続方針
- 1問の解析失敗で全体を停止しない
- エラー詳細をログ出力
- 成功分は確実に保存

### エラー分類
```javascript
// ファイルアクセスエラー
if (!await fs.access(pdfPath)) {
  throw new Error('PDFファイルが見つかりません');
}

// PDF解析エラー
try {
  const result = await pdf(buffer);
} catch (error) {
  throw new Error(`PDF解析失敗: ${error.message}`);
}

// データベースエラー
if (dbError) {
  logger.error(`問題${num}の保存エラー:`, dbError);
  errors.push({ questionNumber: num, error: dbError.message });
}
```

### リトライ機能
- データベース接続エラー時は3回まで自動リトライ
- PDF解析エラーは即座に失敗
- ネットワークエラーは指数バックオフで再試行

## ログ・進捗表示

### 標準出力形式
```
🚀 PDFインポート開始...
ファイル: /pdfs/2024/fe24s_am.pdf
年度: 2024年 春期
📄 PDFファイル読み込み完了
✅ 試験情報: 2024年 春期 (ID: xxx)
🔍 PDF解析開始...
📊 解析結果: 80問を検出
💾 問題保存中: 15/80
🎉 インポート完了!
```

### 統計情報
- 解析した問題数
- 成功した問題数
- エラーが発生した問題数
- 処理にかかった時間

### エラーレポート
```
❌ エラー一覧:
  - 問題15: 選択肢の解析に失敗
  - 問題32: データベース保存エラー
```

## Supabase連携

### 認証設定
```javascript
// SERVICE_ROLE_KEY を使用（書き込み権限必要）
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,  // 管理者権限
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);
```

### データ挿入パターン
```javascript
// 試験情報の upsert
const { data: exam } = await supabase
  .from('exams')
  .upsert({ year, season }, { onConflict: 'year,season' })
  .select()
  .single();

// 問題の挿入（重複チェック付き）
const { data: existing } = await supabase
  .from('questions')
  .select('id')
  .eq('exam_id', examId)
  .eq('question_number', num)
  .single();

if (!existing) {
  await supabase.from('questions').insert({ ... });
}
```

## 画像処理

### 画像抽出（将来実装）
- PDF内の図表・グラフを画像として抽出
- PNG/JPEG形式でSupabase Storageに保存
- 問題テーブルに画像フラグを設定

### ファイル命名規則
```
{year}/{season}/q{number}_{index}.png
例: 2024/春期/q15_1.png
```

## パフォーマンス

### 処理速度目標
- 小さなPDF（〜50問）: 5分以内
- 大きなPDF（100問+）: 15分以内
- 1問あたりの平均処理時間: 3秒

### メモリ使用量
- PDFファイル全体をメモリ読み込み
- 問題ごとに順次処理してメモリ開放
- 大きなファイルでも安定動作

### 並列処理
- 現在は逐次処理のみ
- 将来的に問題単位での並列処理を検討

## 環境変数

### 必須設定
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...（書き込み権限必要）
SUPABASE_STORAGE_BUCKET=fexa-images
```

## テスト・検証

### 動作確認手順
1. サンプルPDFファイルを準備
2. インポート実行
3. Supabaseでデータ確認
4. APIでデータ取得確認
5. フロントエンドで表示確認

### 品質チェック
- 問題文の文字化け確認
- 選択肢の欠損確認  
- 問題番号の重複確認
- 画像の正常抽出確認（将来）

この設計により、IPAの過去問PDFを効率的かつ安全にSupabaseに取り込むことができます。