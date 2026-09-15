require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const categoryRoutes = require('./routes/categories');
const diaryRoutes = require('./routes/diaries');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 配置
// 本项目认证采用 JWT Authorization header（非 cookie），无 CSRF 风险，
// 因此默认允许任意来源，不依赖部署平台的环境变量配置
// 如需收紧白名单，可设置环境变量 CORS_ALLOWED_ORIGINS（逗号分隔）
const strictOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : null;

app.use(cors({
  origin: function (origin, callback) {
    // 允许无 origin 的请求（如 Postman、服务端调用）
    if (!origin) return callback(null, true);
    if (!strictOrigins || strictOrigins.includes('*') || strictOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('不允许的跨域请求'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/diaries', diaryRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'Blog API is running' });
});

app.listen(PORT, () => {
  console.log(`博客后端服务已启动: http://localhost:${PORT}`);
});
