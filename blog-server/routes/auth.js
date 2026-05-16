const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ code: 400, message: '用户名长度需在3-50个字符之间' });
    }

    if (password.length < 6) {
      return res.status(400).json({ code: 400, message: '密码长度不能少于6个字符' });
    }

    // 检查用户名是否已存在
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
      [username, hashedPassword, nickname || username]
    );

    const token = jwt.sign({ id: result.insertId, username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      code: 200,
      message: '注册成功',
      data: {
        token,
        user: { id: result.insertId, username, nickname: nickname || username }
      }
    });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(400).json({ code: 400, message: '用户名或密码错误' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ code: 400, message: '用户名或密码错误' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          bio: user.bio
        }
      }
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

// 获取当前用户信息
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, nickname, avatar, bio, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    res.json({ code: 200, data: users[0] });
  } catch (err) {
    console.error('获取用户信息错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

// 更新用户信息
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, avatar, bio } = req.body;

    await pool.query(
      'UPDATE users SET nickname = ?, avatar = ?, bio = ? WHERE id = ?',
      [nickname, avatar, bio, req.user.id]
    );

    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    console.error('更新用户信息错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后重试' });
  }
});

module.exports = router;
