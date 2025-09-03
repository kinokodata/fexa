# 試験解答生成ルール

## 概要
特定年度・季節の試験問題を解析し、解答と解説を生成するプロセスのルール定義

## 処理フロー

### 1. 試験データ取得
**APIエンドポイント**: `http://localhost:43001/api/questions?year=YYYY&season=SEASON&limit=100`

**認証情報**:
```
email: info@kinokodata.net
password: RHAfFPaE3B-U
```

**手順**:
1. 認証トークンを取得
   ```bash
   curl -X POST "http://localhost:43001/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"info@kinokodata.net","password":"RHAfFPaE3B-U"}'
   ```

2. 試験データを取得
   ```bash
   TOKEN="<取得したトークン>"
   curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:43001/api/questions?year=2019&season=春期&limit=100" \
     > pdfs/2019_h/tmp_questions.json
   ```

### 2. 保存ルール

**ディレクトリ構造**:
```
pdfs/
  {year}_{season_code}/
    tmp_questions.json    # APIから取得した問題データ
    answers.json         # 生成した解答・解説データ
```

**季節コード変換**:
- 春期 → h
- 秋期 → a

**一時ファイル命名規則**:
- プレフィックス: `tmp_`
- 形式: `tmp_questions.json`

### 3. Claude Code による解析・生成（text-data.md直接編集方式）

**重要**: 解答生成では自動化ツールやスクリプトを一切使用せず、Claude CodeのAI分析のみで実行すること。

**新方式: text-data.mdへの直接追記**:
- text-data.mdファイルに問題文と選択肢が記載されている
- 各問題の選択肢の後に、正解と解説を直接追記する
- 画像が必要な場合は同階層のPDFファイルも参照する

**解析対象**:
- text-data.mdの問題文と選択肢をClaude Codeが直接読み取り
- 各問題の内容を技術的に分析
- IT知識に基づいて正解を決定
- 日本語で詳細な解説を生成

**生成方法（AI手動解析のみ）**:
- **禁止**: Python、shell、その他自動化ツールの使用
- **必須**: Claude CodeのLLM機能を使った問題読み取りと技術分析
- **手順**: 
  1. text-data.mdの問題文をClaude Codeが直接読み取り
  2. 基本情報技術者試験の知識で技術的に分析
  3. 正解を論理的に判定
  4. 各問題の選択肢の後にMultiEdit/Editツールで正解と解説を追記

**text-data.md記載形式**:
```markdown
## 問XX

問題文...

- ア. 選択肢1
- イ. 選択肢2
- ウ. 選択肢3
- エ. 選択肢4

**正解: X**

解説文...
```

**生成ルール**:
1. **正解決定基準**:
   - 基本情報技術者試験レベルのIT知識を適用
   - アルゴリズム、データ構造、ネットワーク、セキュリティ、データベース等の分野
   - 論理的推論と技術的正確性を重視
   - Claude CodeのAI判断のみで決定（ツール使用禁止）

2. **解説生成基準**:
   - 日本語で記述
   - ヘッダー・フッター不要（"## 解説"や"**正解: X**"は含めない）
   - 技術的根拠を明確に説明
   - 他の選択肢が不適切である理由も説明
   - 簡潔で教育的な内容
   - Claude CodeのAI知識で詳細に記述（効率より品質重視）

**品質vs効率の優先順位**:
- 効率性 < 技術的正確性
- 自動化 < AI手動解析
- 速度 < 解説品質

### 4. 出力形式

**answers.json構造**:
```json
{
  "question_uuid": {
    "question_number": 1,
    "correct_choice": "ア",
    "explanation": "解説文...",
    "choices": [
      {
        "label": "ア",
        "text": "選択肢テキスト",
        "is_correct": true
      },
      {
        "label": "イ", 
        "text": "選択肢テキスト",
        "is_correct": false
      }
    ]
  }
}
```

## 実行例

### 2019年春期の場合
1. 認証・データ取得:
   ```bash
   # pdfs/2019_h/tmp_questions.json に保存
   ```

2. Claude Code手動AI分析:
   - `tmp_questions.json`または`text-data.md`を読み込み
   - Claude CodeのAI機能で80問を1問ずつ技術的に解析
   - 自動化ツール使用禁止、手動でMultiEdit/Editツールで`answers.json`を生成

3. 結果確認:
   ```
   pdfs/2019_h/
     tmp_questions.json  # 一時データ
     answers.json        # 生成結果
   ```

## 注意事項

### セキュリティ
- 認証情報は環境変数または設定ファイルから取得推奨
- 一時ファイルも残す

### エラーハンドリング
- API接続失敗時の再試行
- 不正な問題データの検証
- 生成された解答の妥当性チェック

### 品質保証
- 生成した解答は技術的正確性を最重視
- 解説は学習者にとって理解しやすい内容
- 全問題を網羅的に処理

## 関連ツール（answers.json生成では使用禁止）
- `tools/export-answer/`: Docker化された自動解答生成ツール（answers.json生成では使用禁止）
- `scripts/export-answers.sh`: 解答生成簡略化スクリプト（answers.json生成では使用禁止）

**重要**: answers.json生成時はこれらのツールを使用せず、Claude CodeのAI解析のみで実行すること。

## データ形式互換性
- 生成されたanswers.jsonは既存のexport-answerツールと同じ形式
- データベース更新ツールとの連携が可能
- MCP Supabaseサーバーでの一括更新に対応