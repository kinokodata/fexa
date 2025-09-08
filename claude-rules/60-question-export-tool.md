# Export Markdownツール開発仕様

text-data.mdファイルからSupabaseデータベースへ問題データをエクスポートするツール（export-markdown）の開発仕様です。

## 基本方針

### 独立コンテナ運用
- APIサーバーとは完全分離
- Dockerコンテナ内で実行（compose.yml profilesでtools指定）
- 必要時のみ起動・実行（docker compose run --rm）
- 環境変数は.envからcompose.yml経由で注入

### バッチ処理特化
- 大量データの一括処理に対応
- エラー耐性の高い設計（1問の失敗が全体を止めない）
- 処理進捗の可視化
- 正解・解説の自動抽出とDB保存

## ファイル構成

```
tools/
└── export-markdown/
    ├── Dockerfile
    ├── package.json
    ├── README.md
    ├── index.js           # メインスクリプト
    └── lib/
        ├── logger.js      # ログ機能
        ├── supabase.js    # DB接続
        └── mdParser.js    # Markdown解析エンジン
```

## 実行方法

### Docker環境での実行
```bash
# 単一ファイルのエクスポート
docker compose run --rm export-markdown node index.js /pdfs/2010_h/text-data.md

# 年度・季節を明示的に指定
docker compose run --rm export-markdown node index.js /pdfs/2018_a/text-data.md 2018 秋期

# 単体問題の上書きエクスポート
docker compose run --rm export-markdown node index.js /pdfs/2018_a/text-data.md --question 9 --overwrite

# 複数ファイルの一括エクスポート
docker compose run --rm export-markdown sh -c 'for md in /pdfs/*/text-data.md; do node index.js "$md"; done'
```

### 引数バリデーション
- 第1引数: text-data.mdファイルパス（必須）
- 第2引数: 年度（4桁数字、オプション - ディレクトリ名から自動取得）
- 第3引数: 季節（春期/秋期、オプション - ディレクトリ名から自動取得）
- オプション: --question N（特定問題のみ処理）
- オプション: --overwrite（既存データを強制上書き）

## Markdown解析仕様

### 対象ファイル
- Web版Claudeで生成された text-data.md ファイル
- 構造化されたMarkdown形式の問題データ
- 正解・解説を含む完全なデータ

### 問題検出パターン
```javascript
// 問題番号パターン（見出しから）
/^##\s*問\s*(\d+)/gm

// 選択肢パターン（ピリオドなし）
/^-\s*([アイウエ])\s*(.*)$/gm

// 画像リンクパターン
/!\[([^\]]*)\]\(\.\/images\/([^)]+)\)/g

// 正解パターン
/^\*\*正解:\s*([アイウエ])\*\*/gm

// 表形式パターン
/^\|\s*\|\s*(.+?)\s*\|(.+?)\|$/gm
```

### 選択肢形式の統一ルール

**テキスト選択肢:**
```markdown
- ア 選択肢の内容
- イ 選択肢の内容  
- ウ 選択肢の内容
- エ 選択肢の内容
```
**注意**: ピリオド（.）は付けない

**画像選択肢:**
```markdown
- ア ![選択肢ア](./images/q22_choice_a.png)
- イ ![選択肢イ](./images/q22_choice_b.png)
- ウ ![選択肢ウ](./images/q22_choice_c.png)
- エ ![選択肢エ](./images/q22_choice_d.png)
```

**表形式選択肢:**
```markdown
| | 真正性 | 信頼性 |
|---|-------|-------|
| ア | a | c |
| イ | b | a |
| ウ | b | d |
| エ | d | a |
```

### 解析対象要素
- 問題番号（見出し `## 問1` から抽出）
- 問題文（問題番号見出し後から選択肢開始まで）
- 選択肢ア〜エ（箇条書き形式）
- **正解**（`**正解: X**`から抽出）
- **解説**（正解の後から次の問題まで）
- 問題種別（午前/午後、ファイルパスから自動判定）
- 画像情報（問題文・選択肢内の画像リンク）

## データ保存仕様

### データベーステーブル
1. **exams**: 試験情報（年度・季節）
2. **questions**: 問題本体（explanation フィールド含む）
3. **choices**: 選択肢（is_correct フラグ、has_image フラグ、表形式対応）
4. **question_images**: 問題に含まれる画像情報  
5. **choice_images**: 選択肢に含まれる画像情報

### 重要フィールド

**questions テーブル:**
```javascript
{
  exam_id: examId,
  question_number: num,
  question_type: '午前',
  question_text: text,
  explanation: explanation,  // 解説文
  has_choice_table: boolean,
  choice_table_markdown: markdown
}
```

**choices テーブル:**
```javascript
{
  question_id: questionId,
  choice_label: 'ア',
  choice_text: text,
  is_correct: boolean,  // 正解フラグ
  has_image: boolean
}
```

### 重複処理
- 同一試験・問題番号・問題種別の組み合わせをチェック
- 既存データがある場合は選択肢の完全性をチェック
- 不完全な場合は削除して再登録
- --overwriteオプションで強制上書き可能

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
if (!await fs.access(mdPath)) {
  throw new Error('text-data.mdファイルが見つかりません');
}

// 年度・季節の自動判定
const dirName = path.dirname(mdPath);
const yearMatch = dirName.match(/(\d{4})_([ah])/);
// 2010_h → 2010年春期
// 2019_a → 2019年秋期

// データベースエラー
if (dbError) {
  logger.error(`問題${num}の保存エラー:`, dbError);
  errors.push({ questionNumber: num, error: dbError.message });
}
```

### リトライ機能
- データベース接続エラー時は即座に失敗
- Markdown解析エラーは即座に失敗
- ネットワークエラーは指数バックオフで再試行

## ログ・進捗表示

### 標準出力形式
```
🚀 Markdownエクスポート開始...
ファイル: /pdfs/2010_h/text-data.md
年度: 2010年 春期
📄 Markdownファイル読み込み完了
✅ 試験情報: 2010年 春期 (ID: xxx)
🔍 Markdown解析開始...
📊 解析結果: 73問を検出
🖼️  画像参照: 25個を検出
💾 問題保存中: 15/73
🎉 エクスポート完了!
```

### 統計情報
- 解析した問題数
- 成功した問題数
- スキップした問題数
- 再登録した問題数
- エラーが発生した問題数
- 処理にかかった時間

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
  const { data: question } = await supabase.from('questions').insert({
    exam_id: examId,
    question_number: num,
    question_text: text,
    explanation: explanation,  // 解説
    has_images: images.length > 0
  }).select().single();
  
  // 選択肢の保存（正解フラグ付き）
  const choices = await supabase.from('choices').insert(
    choicesData.map(c => ({
      ...c,
      is_correct: c.option === correctAnswer
    }))
  );
}
```

## 環境変数

### 必須設定
```env
# .envファイルに記載
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...（書き込み権限必要）
SUPABASE_STORAGE_BUCKET=fexa-images
```

### compose.yml設定
```yaml
export-markdown:
  build:
    context: ./tools/export-markdown
    dockerfile: Dockerfile
  environment:
    SUPABASE_URL: ${SUPABASE_URL}
    SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY}
    SUPABASE_STORAGE_BUCKET: ${SUPABASE_STORAGE_BUCKET}
  volumes:
    - ./tools/export-markdown:/app
    - /app/node_modules
    - ./pdfs:/pdfs  # PDFディレクトリ共有
  working_dir: /app
  profiles:
    - tools
```

## テスト・検証

### 動作確認手順
1. Web版Claudeでtext-data.md生成
2. エクスポート実行
3. Supabaseでデータ確認
4. 正解・解説の保存確認
5. フロントエンドで表示確認

### 品質チェック
- 問題文の解析精度確認
- 選択肢の欠損確認  
- 正解フラグの正確性確認
- 解説文の完全性確認
- 画像参照情報の正確性確認

## パフォーマンス

### 処理速度目標
- 小さなMarkdown（〜50問）: 2分以内
- 大きなMarkdown（80問+）: 3分以内
- 1問あたりの平均処理時間: 1秒

### メモリ使用量
- Markdownファイル全体をメモリ読み込み
- 問題ごとに順次処理してメモリ開放
- 大きなファイルでも安定動作

この設計により、Web版Claudeで生成されたtext-data.mdファイルを効率的かつ安全にSupabaseに取り込み、正解・解説付きの完全な問題データベースを構築できます。