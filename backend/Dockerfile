FROM node:20-alpine

WORKDIR /app

# 依存関係ファイルをコピー
COPY package*.json ./

# 依存関係のインストール（開発環境）
RUN npm install && npm cache clean --force

# アプリケーションコードをコピー
COPY . .

# tempディレクトリを作成
RUN mkdir -p /app/temp

EXPOSE 3000

CMD ["npm", "run", "dev"]