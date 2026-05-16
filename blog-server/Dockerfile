FROM node:18-alpine

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存
COPY package*.json ./
RUN npm install --production

# 复制源代码
COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
