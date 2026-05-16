require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'personal_blog',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 云数据库（TiDB 等）需要 SSL 连接
if (process.env.DB_SSL === 'true') {
  config.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(config);

module.exports = pool;
