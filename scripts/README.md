# Scripts

Docker環境での開発を簡略化するためのbashスクリプト集

## 使用方法

### 開発環境の起動
```bash
./scripts/start-dev.sh
```
- frontend (http://localhost:43000) とbackend (http://localhost:43001) を起動

### 試験解答のエクスポート
```bash
./scripts/export-answers.sh 2019 春期
./scripts/export-answers.sh 2018 秋期
```
- 指定した年度・季節の試験解答データを生成
- `pdfs/{year}_{season}/answers.json` に出力

### ログの確認
```bash
./scripts/logs.sh           # 全サービスのログ
./scripts/logs.sh frontend  # フロントエンドのログのみ
./scripts/logs.sh backend   # バックエンドのログのみ
```

### 環境のクリーンアップ
```bash
./scripts/clean-containers.sh
```
- コンテナ停止、未使用リソースの削除

## ディレクトリ構造

- `unused/` - 使用されなくなったJavaScriptファイルとnode_modules
- `*.sh` - Docker操作を簡略化するbashスクリプト

## 注意事項

- すべてのスクリプトはプロジェクトルートから実行してください
- Docker Composeが利用可能である必要があります