const express = require('express');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取文章列表（公开）
router.get('/', async (req, res) => {
  try {
    let { page = 1, pageSize = 10, category_id, keyword, tag } = req.query;
    page = Math.max(1, parseInt(page) || 1);
    pageSize = Math.min(50, Math.max(1, parseInt(pageSize) || 10));
    const offset = (page - 1) * pageSize;

    let whereClauses = ['p.is_published = 1'];
    let params = [];

    if (category_id) {
      whereClauses.push('p.category_id = ?');
      params.push(category_id);
    }

    if (keyword) {
      whereClauses.push('(p.title LIKE ? OR p.summary LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    let joinClause = '';
    if (tag) {
      joinClause = 'INNER JOIN post_tags pt2 ON p.id = pt2.post_id INNER JOIN tags t2 ON pt2.tag_id = t2.id';
      whereClauses.push('t2.name = ?');
      params.push(tag);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // 查询总数
    const [countResult] = await pool.query(
      `SELECT COUNT(DISTINCT p.id) as total FROM posts p ${joinClause} ${whereStr}`,
      params
    );
    const total = countResult[0].total;

    // 查询文章列表
    const [posts] = await pool.query(
      `SELECT p.*, c.name as category_name, c.icon as category_icon, u.nickname as author_name,
       (SELECT GROUP_CONCAT(t.name) FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id = p.id) as tags
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.author_id = u.id
       ${joinClause}
       ${whereStr}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      code: 200,
      data: {
        list: posts,
        total,
        page,
        pageSize
      }
    });
  } catch (err) {
    console.error('获取文章列表错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

// 获取所有文章（管理后台用，包含未发布）
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    let { page = 1, pageSize = 10, category_id, keyword } = req.query;
    page = Math.max(1, parseInt(page) || 1);
    pageSize = Math.min(50, Math.max(1, parseInt(pageSize) || 10));
    const offset = (page - 1) * pageSize;

    let whereClauses = [];
    let params = [];

    if (category_id) {
      whereClauses.push('p.category_id = ?');
      params.push(category_id);
    }

    if (keyword) {
      whereClauses.push('(p.title LIKE ? OR p.summary LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM posts p ${whereStr}`,
      params
    );
    const total = countResult[0].total;

    const [posts] = await pool.query(
      `SELECT p.*, c.name as category_name, u.nickname as author_name,
       (SELECT GROUP_CONCAT(t.name) FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id = p.id) as tags
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.author_id = u.id
       ${whereStr}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      code: 200,
      data: { list: posts, total, page, pageSize }
    });
  } catch (err) {
    console.error('获取文章列表错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

// 获取文章详情
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      return res.status(400).json({ code: 400, message: '无效的文章ID' });
    }

    const [posts] = await pool.query(
      `SELECT p.*, c.name as category_name, c.icon as category_icon, u.nickname as author_name,
       (SELECT GROUP_CONCAT(t.name) FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id = p.id) as tags
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({ code: 404, message: '文章不存在' });
    }

    // 增加浏览次数
    await pool.query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [id]);

    res.json({ code: 200, data: posts[0] });
  } catch (err) {
    console.error('获取文章详情错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

// 创建文章
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, summary, category_id, cover_image, is_published = 1, tags } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ code: 400, message: '请输入文章标题' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ code: 400, message: '请输入文章内容' });
    }

    const [result] = await pool.query(
      `INSERT INTO posts (title, content, summary, category_id, author_id, cover_image, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), content, summary || '', category_id || null, req.user.id, cover_image || '', is_published]
    );

    // 处理标签
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        const trimmed = tagName.trim();
        if (!trimmed) continue;
        // 先查找或创建标签
        let [existingTag] = await pool.query('SELECT id FROM tags WHERE name = ?', [trimmed]);
        let tagId;
        if (existingTag.length > 0) {
          tagId = existingTag[0].id;
        } else {
          const [tagResult] = await pool.query('INSERT INTO tags (name) VALUES (?)', [trimmed]);
          tagId = tagResult.insertId;
        }
        await pool.query('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [result.insertId, tagId]);
      }
    }

    res.json({ code: 200, message: '发布成功', data: { id: result.insertId } });
  } catch (err) {
    console.error('创建文章错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

// 更新文章
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      return res.status(400).json({ code: 400, message: '无效的文章ID' });
    }

    const { title, content, summary, category_id, cover_image, is_published, tags } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ code: 400, message: '请输入文章标题' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ code: 400, message: '请输入文章内容' });
    }

    // 检查文章是否存在
    const [existing] = await pool.query('SELECT id FROM posts WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '文章不存在' });
    }

    await pool.query(
      `UPDATE posts SET title = ?, content = ?, summary = ?, category_id = ?, cover_image = ?, is_published = ?, updated_at = NOW()
       WHERE id = ?`,
      [title.trim(), content, summary || '', category_id || null, cover_image || '', is_published ?? 1, id]
    );

    // 更新标签：先删除旧标签关联，再插入新的
    await pool.query('DELETE FROM post_tags WHERE post_id = ?', [id]);
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        const trimmed = tagName.trim();
        if (!trimmed) continue;
        let [existingTag] = await pool.query('SELECT id FROM tags WHERE name = ?', [trimmed]);
        let tagId;
        if (existingTag.length > 0) {
          tagId = existingTag[0].id;
        } else {
          const [tagResult] = await pool.query('INSERT INTO tags (name) VALUES (?)', [trimmed]);
          tagId = tagResult.insertId;
        }
        await pool.query('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [id, tagId]);
      }
    }

    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    console.error('更新文章错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

// 删除文章
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      return res.status(400).json({ code: 400, message: '无效的文章ID' });
    }

    const [existing] = await pool.query('SELECT id FROM posts WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '文章不存在' });
    }

    await pool.query('DELETE FROM post_tags WHERE post_id = ?', [id]);
    await pool.query('DELETE FROM posts WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    console.error('删除文章错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

module.exports = router;
