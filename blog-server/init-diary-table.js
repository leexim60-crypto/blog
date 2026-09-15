/**
 * 初始化日记表（可重复执行，CREATE TABLE IF NOT EXISTS）
 * 运行：npm run init-diary-table
 */
require('dotenv').config();
const pool = require('./config/db');

async function main() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS diaries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL COMMENT '作者用户ID',
        title VARCHAR(200) NOT NULL DEFAULT '' COMMENT '标题（可为空）',
        content TEXT NOT NULL COMMENT 'Markdown 正文',
        diary_date DATE NOT NULL COMMENT '日记日期（可补写往日）',
        mood VARCHAR(20) NOT NULL DEFAULT '' COMMENT '心情 emoji',
        weather VARCHAR(20) NOT NULL DEFAULT '' COMMENT '天气',
        is_public TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1公开 0私密',
        view_count INT NOT NULL DEFAULT 0 COMMENT '浏览次数',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_date (user_id, diary_date),
        INDEX idx_public (is_public)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='日记表'
    `);
    console.log('diaries 表创建成功（或已存在）');
    process.exit(0);
  } catch (err) {
    console.error('创建 diaries 表失败:', err.message);
    process.exit(1);
  }
}

main();
