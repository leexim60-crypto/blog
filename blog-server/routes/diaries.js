const express = require('express');
const pool = require('../config/db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 心情/天气白名单长度校验
function validShort(v) {
  return typeof v === 'string' && v.length <= 20;
}

// 获取日记列表（公开日记所有人可见，登录后额外可见自己的私密日记）
// GET /api/diaries?page=1&pageSize=10&keyword=xxx&mine=1
router.get('/', optionalAuth, async (req, res) => {
  try {
    let { page = 1, pageSize = 10, keyword, mine } = req.query;
    page = Math.max(1, parseInt(page) || 1);
    pageSize = Math.min(50, Math.max(1, parseInt(pageSize) || 10));
    const offset = (page - 1) * pageSize;

    const whereClauses = [];
    const params = [];

    if (req.user) {
      if (mine === '1') {
        // 只看自己的（含私密）
        whereClauses.push('d.user_id = ?');
        params.push(req.user.id);
      } else {
        // 公开的 + 自己的（含私密）
        whereClauses.push('(d.is_public = 1 OR d.user_id = ?)');
        params.push(req.user.id);
      }
    } else {
      whereClauses.push('d.is_public = 1');
    }

    if (keyword && keyword.trim()) {
      whereClauses.push('(d.title LIKE ? OR d.content LIKE ?)');
      params.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`);
    }

    const whereStr = 'WHERE ' + whereClauses.join(' AND ');

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM diaries d ${whereStr}`,
      params
    );
    const total = countResult[0].total;

    const [diaries] = await pool.query(
      `SELECT d.id, d.user_id, d.title, d.content, DATE_FORMAT(d.diary_date, '%Y-%m-%d') as diary_date,
       d.mood, d.weather, d.is_public, d.view_count, d.created_at, d.updated_at, u.nickname as author_name
       FROM diaries d
       LEFT JOIN users u ON d.user_id = u.id
       ${whereStr}
       ORDER BY d.diary_date DESC, d.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      code: 200,
      data: { list: diaries, total, page, pageSize }
    });
  } catch (err) {
    console.error('获取日记列表错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

// 获取日记详情（私密日记仅作者本人可见）
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      return res.status(400).json({ code: 400, message: '无效的日记ID' });
    }

    const [diaries] = await pool.query(
      `SELECT d.id, d.user_id, d.title, d.content, DATE_FORMAT(d.diary_date, '%Y-%m-%d') as diary_date,
       d.mood, d.weather, d.is_public, d.view_count, d.created_at, d.updated_at, u.nickname as author_name
       FROM diaries d
       LEFT JOIN users u ON d.user_id = u.id
       WHERE d.id = ?`,
      [id]
    );

    if (diaries.length === 0) {
      return res.status(404).json({ code: 404, message: '日记不存在' });
    }

    const diary = diaries[0];
    const isOwner = req.user && req.user.id === diary.user_id;
    if (!diary.is_public && !isOwner) {
      return res.status(403).json({ code: 403, message: '这是一篇私密日记' });
    }

    // 增加浏览次数
    await pool.query('UPDATE diaries SET view_count = view_count + 1 WHERE id = ?', [id]);

    res.json({ code: 200, data: diary });
  } catch (err) {
    console.error('获取日记详情错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

// 创建日记（需登录）
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title = '', content, diary_date, mood = '', weather = '', is_public = 1 } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ code: 400, message: '日记内容不能为空' });
    }
    if (title.length > 200) {
      return res.status(400).json({ code: 400, message: '标题不能超过200个字符' });
    }
    if (!validShort(mood) || !validShort(weather)) {
      return res.status(400).json({ code: 400, message: '心情或天气格式不正确' });
    }

    // 日期校验：不填默认今天，支持补写往日
    let date = diary_date;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      date = new Date().toISOString().slice(0, 10);
    }

    const [result] = await pool.query(
      `INSERT INTO diaries (user_id, title, content, diary_date, mood, weather, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title.trim(), content, date, mood, weather, is_public ? 1 : 0]
    );

    res.json({ code: 200, message: '日记已保存', data: { id: result.insertId } });
  } catch (err) {
    console.error('创建日记错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

// 更新日记（仅作者本人）
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      return res.status(400).json({ code: 400, message: '无效的日记ID' });
    }

    const [existing] = await pool.query('SELECT user_id FROM diaries WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '日记不存在' });
    }
    if (existing[0].user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '只能修改自己的日记' });
    }

    const { title = '', content, diary_date, mood = '', weather = '', is_public } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ code: 400, message: '日记内容不能为空' });
    }
    if (title.length > 200) {
      return res.status(400).json({ code: 400, message: '标题不能超过200个字符' });
    }
    if (!validShort(mood) || !validShort(weather)) {
      return res.status(400).json({ code: 400, message: '心情或天气格式不正确' });
    }

    // 不传日期则保持原日期不变
    let date = diary_date;
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ code: 400, message: '日期格式不正确' });
    }

    await pool.query(
      `UPDATE diaries SET title = ?, content = ?, diary_date = COALESCE(?, diary_date),
       mood = ?, weather = ?, is_public = ?, updated_at = NOW()
       WHERE id = ?`,
      [title.trim(), content, date || null, mood, weather, is_public ? 1 : 0, id]
    );

    res.json({ code: 200, message: '日记已更新' });
  } catch (err) {
    console.error('更新日记错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

// 删除日记（仅作者本人）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      return res.status(400).json({ code: 400, message: '无效的日记ID' });
    }

    const [existing] = await pool.query('SELECT user_id FROM diaries WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '日记不存在' });
    }
    if (existing[0].user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '只能删除自己的日记' });
    }

    await pool.query('DELETE FROM diaries WHERE id = ?', [id]);
    res.json({ code: 200, message: '日记已删除' });
  } catch (err) {
    console.error('删除日记错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

module.exports = router;
