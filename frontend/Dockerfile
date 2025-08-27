FROM node:20-alpine

WORKDIR /app

# 依存関係ファイルをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install && npm cache clean --force

# アプリケーションコードをコピー
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]