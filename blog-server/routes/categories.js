const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// 获取分类列表
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.query(
      `SELECT c.*, COUNT(p.id) as post_count
       FROM categories c
       LEFT JOIN posts p ON c.id = p.category_id AND p.is_published = 1
       GROUP BY c.id
       ORDER BY c.id ASC`
    );

    res.json({ code: 200, data: categories });
  } catch (err) {
    console.error('获取分类列表错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

// 获取标签列表
router.get('/tags', async (req, res) => {
  try {
    const [tags] = await pool.query(
      `SELECT t.*, COUNT(pt.post_id) as post_count
       FROM tags t
       LEFT JOIN post_tags pt ON t.id = pt.tag_id
       GROUP BY t.id
       ORDER BY post_count DESC`
    );

    res.json({ code: 200, data: tags });
  } catch (err) {
    console.error('获取标签列表错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

module.exports = router;
