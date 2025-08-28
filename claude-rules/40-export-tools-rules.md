# エクスポートツール開発ルール

text-data.mdファイルからSupabaseへの問題データエクスポートを行うツールの開発ルールです。

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
docker compose exec export-markdown node index.js /pdfs/2018_a/text-data.md 2018 秋期

# 自動判定でエクスポート
docker compose exec export-markdown node index.js /pdfs/2018_a/text-data.md

# 複数ファイルの一括エクスポート
docker compose exec export-markdown sh -c 'for md in /pdfs/*/text-data.md; do node index.js "$md"; done'
```

### 引数バリデーション
- 第1引数: text-data.mdファイルパス（必須）
- 第2引数: 年度（4桁数字、オプション - ディレクトリ名から自動取得）
- 第3引数: 季節（春期/秋期、オプション - ディレクトリ名から自動取得）

## Markdown解析仕様

### 対象ファイル
- PDF解析によって生成された text-data.md ファイル
- 構造化されたMarkdown形式の問題データ
- 画像リンクを含む問題・選択肢に対応

### 問題検出パターン
```javascript
// 問題番号パターン（見出しから）
/^##\s*問\s*(\d+)/gm

// 選択肢パターン  
/^-\s*([アイウエ])[、．\s]\s*(.+)/gm

// 画像リンクパターン
/!\[([^\]]*)\]\(\.\/images\/(q?\d+_\d+\.png)\)/g
```

### 解析対象要素
- 問題番号（見出し `## 問1` から抽出）
- 問題文（問題番号見出し後から選択肢開始まで）
- 選択肢ア〜エ（箇条書き形式）
- 問題種別（午前/午後、ファイルパスから自動判定）
- 画像情報（問題文・選択肢内の画像リンク）

## データ保存仕様

### データベーステーブル
1. **exams**: 試験情報（年度・季節）
2. **questions**: 問題本体（画像参照情報含む）
3. **choices**: 選択肢（画像参照情報含む）
4. **question_images**: 問題に含まれる画像情報
5. **import_history**: インポート履歴

### 画像データ処理
```javascript
// 問題文内の画像検出・保存
const imageMatches = questionText.match(/!\[([^\]]*)\]\(\.\/images\/(q?\d+_\d+\.png)\)/g);
if (imageMatches) {
  for (const match of imageMatches) {
    const [, altText, filename] = match.match(/!\[([^\]]*)\]\(\.\/images\/(.+)\)/);
    await saveImageReference(questionId, filename, altText, 'question');
  }
}

// 選択肢内の画像検出・保存
const choiceImages = choiceText.match(/!\[([^\]]*)\]\(\.\/images\/(q?\d+_\d+\.png)\)/g);
if (choiceImages) {
  // 選択肢画像情報をchoicesテーブルに保存
  await saveImageReference(choiceId, filename, altText, 'choice');
}
```

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
if (!await fs.access(mdPath)) {
  throw new Error('text-data.mdファイルが見つかりません');
}

// Markdown解析エラー
try {
  const content = await fs.readFile(mdPath, 'utf8');
} catch (error) {
  throw new Error(`Markdown読み込み失敗: ${error.message}`);
}

// 画像参照エラー（存在チェック）
const imageExists = await fs.access(imagePath).catch(() => false);
if (!imageExists) {
  logger.warn(`画像ファイル未配置: ${imagePath}（手動アップロード待ち）`);
}

// データベースエラー
if (dbError) {
  logger.error(`問題${num}の保存エラー:`, dbError);
  errors.push({ questionNumber: num, error: dbError.message });
}
```

### リトライ機能
- データベース接続エラー時は3回まで自動リトライ
- Markdown解析エラーは即座に失敗
- ネットワークエラーは指数バックオフで再試行

## ログ・進捗表示

### 標準出力形式
```
🚀 Markdownエクスポート開始...
ファイル: /pdfs/2018_a/text-data.md
年度: 2018年 秋期
📄 Markdownファイル読み込み完了
✅ 試験情報: 2018年 秋期 (ID: xxx)
🔍 Markdown解析開始...
📊 解析結果: 80問を検出
🖼️  画像参照: 25個を検出（手動アップロード待ち）
💾 問題保存中: 15/80
🎉 エクスポート完了!
```

### 統計情報
- 解析した問題数
- 成功した問題数
- エラーが発生した問題数
- 検出した画像参照数
- 処理にかかった時間

### エラーレポート
```
❌ エラー一覧:
  - 問題15: 選択肢の解析に失敗
  - 問題32: データベース保存エラー

⚠️  画像ファイル未配置:
  - logic_symbols_1.png (論理回路記号表)
  - q4_huffman_table_1.png (ハフマン符号化表)
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
  const { data: question } = await supabase.from('questions').insert({
    exam_id: examId,
    question_number: num,
    question_text: questionText,
    has_images: imageReferences.length > 0
  }).select().single();
  
  // 画像参照情報を保存
  for (const imageRef of imageReferences) {
    await supabase.from('question_images').insert({
      question_id: question.id,
      filename: imageRef.filename,
      alt_text: imageRef.altText,
      is_uploaded: false  // 手動アップロード待ち
    });
  }
}
```

## 画像管理

### 画像参照情報の保存
- Markdownから画像リンクを抽出
- 画像ファイルの実在チェック（警告のみ）
- 画像メタデータをquestion_imagesテーブルに保存
- アップロード状態（is_uploaded）をfalseで初期化

### 画像アップロード待ち状態
```javascript
// 画像ファイルの存在確認
const imagePath = path.join(path.dirname(mdPath), 'images', filename);
const imageExists = await fs.access(imagePath).then(() => true).catch(() => false);

if (!imageExists) {
  logger.warn(`📸 画像ファイル未配置: ${filename} (${altText})`);
  // データベースには参照情報のみ保存、実ファイルは手動アップロード待ち
}
```

### ファイル命名規則
```
{year}/{season}/images/q{number}_{index}.png
例: /pdfs/2024/春期/images/q15_1.png
```

## パフォーマンス

### 処理速度目標
- 小さなMarkdown（〜50問）: 2分以内
- 大きなMarkdown（100問+）: 5分以内
- 1問あたりの平均処理時間: 1秒

### メモリ使用量
- Markdownファイル全体をメモリ読み込み
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
1. サンプルtext-data.mdファイルを準備
2. インポート実行
3. Supabaseでデータ確認
4. APIでデータ取得確認
5. フロントエンドで表示確認

### 品質チェック
- 問題文の解析精度確認
- 選択肢の欠損確認  
- 問題番号の重複確認
- 画像参照情報の正確性確認
- 画像ファイル配置状況の確認

## 画像アップロード機能との連携

### フロントエンドでの画像管理
- 未アップロード画像の一覧表示
- ドラッグ&ドロップでの画像アップロード
- アップロード後のis_uploadedフラグ更新
- 画像プレビュー機能

### 画像アップロード完了後の処理
```javascript
// 画像アップロード後の状態更新
await supabase
  .from('question_images')
  .update({ is_uploaded: true, uploaded_at: new Date() })
  .eq('filename', filename);
```

この設計により、text-data.mdファイルを効率的かつ安全にSupabaseに取り込み、後から画像を手動でアップロードできる柔軟なシステムを実現できます。