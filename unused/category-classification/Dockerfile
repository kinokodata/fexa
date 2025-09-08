FROM node:18-alpine

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production

# アプリケーションコードをコピー
COPY . .

# デフォルトコマンドを設定（ENTRYPOINTは使わずCMDを使用）
CMD ["node", "classify.js"]