FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY . .

RUN chmod +x index.js

USER node

CMD ["node", "index.js"]