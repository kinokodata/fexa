FROM node:20-alpine

WORKDIR /app

# package.jsonをコピーして依存関係をインストール
COPY package.json ./
RUN npm install

# スクリプトをコピー
COPY extract-tags.js ./

# 実行
ENTRYPOINT ["node", "extract-tags.js"]