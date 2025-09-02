# Node.js 20 Alpine image  
FROM node:20-alpine

# 作業ディレクトリの設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install --only=production

# アプリケーションファイルをコピー
COPY src/ ./src/
COPY tsconfig.json ./

# ポート3000を公開
EXPOSE 3000

# 開発用のコマンド（Docker Composeで上書きされる）
CMD ["npm", "run", "dev"]