FROM node:18-alpine

WORKDIR /app

# 复制后端依赖文件
COPY blog-server/package*.json ./
RUN npm install --production

# 复制后端源码
COPY blog-server/ .

EXPOSE 10000

CMD ["node", "app.js"]
