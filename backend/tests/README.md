# Backend API テスト

## セットアップ

### 1. 環境変数設定
`.env` ファイルに以下の変数が設定されていることを確認：

```bash
# API設定
API_BASE_URL=http://localhost:43001

# 認証情報
APPLICATION_SERVICE_USER=your_username
APPLICATION_SERVICE_PASSWORD=your_password

# Supabase設定
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

### 2. 前提条件
- APIサーバーが起動していること
- データベースに問題データとカテゴリデータが存在すること
- 認証情報が正しく設定されていること

## テスト実行

### 全テスト実行
```bash
cd backend
npm test
```

### 特定のテストファイル実行
```bash
cd backend
node --test tests/category-registration.test.js
```

### 詳細ログ付きで実行
```bash
cd backend
node --test --test-reporter=spec tests/category-registration.test.js
```

## テスト内容

### category-registration.test.js
カテゴリ登録APIの包括的なテスト：

1. **認証テスト**: サービスアカウントでの認証
2. **データ取得テスト**: テスト用の問題・カテゴリデータ取得
3. **関連付けテスト**: カテゴリの問題への関連付け
4. **重複チェックテスト**: 重複関連付けのエラーハンドリング
5. **取得テスト**: 関連付けられたカテゴリの取得
6. **削除テスト**: 関連付けの削除
7. **削除確認テスト**: 削除後の状態確認

## トラブルシューティング

### よくあるエラー

#### 認証エラー
```
認証リクエストが成功すること
```
→ `APPLICATION_SERVICE_USER` と `APPLICATION_SERVICE_PASSWORD` を確認

#### 接続エラー
```
fetch failed
```
→ APIサーバーが起動しているか確認（`npm run dev`）

#### データ不足エラー
```
問題データが1件以上存在すること
```
→ データベースに問題データが存在するか確認

#### カテゴリデータエラー
```
レベル4カテゴリが1件以上存在すること
```
→ データベースにカテゴリデータ（レベル4）が存在するか確認

## 注意事項

- テストは実際のデータベースに対して実行されます
- テスト用の関連付けは最後に削除されますが、失敗した場合は手動で削除が必要です
- 同時に複数のテストを実行すると、データの競合が発生する可能性があります