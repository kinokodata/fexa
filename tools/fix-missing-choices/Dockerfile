FROM node:20-alpine

WORKDIR /app

# package.jsonをコピーして依存関係をインストール
COPY package.json ./
RUN npm install

# スクリプトとentrypointをコピー
COPY fix-missing-choices-from-md.cjs ./
COPY entrypoint.sh ./

# entrypointを実行可能にする
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]