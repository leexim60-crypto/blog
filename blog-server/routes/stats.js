const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// 站点上线日期（用于「本站已运行 N 天」小组件）
const SITE_START = process.env.SITE_START_DATE || '2026-05-16';

/**
 * 站点公开统计（首页小组件用，无需登录）
 * GET /api/stats/site
 * 返回：日记数 / 公开日记数 / 文章数 / 总浏览量 / 运行天数
 */
router.get('/site', async (req, res) => {
  const data = {
    diaries: 0,
    publicDiaries: 0,
    posts: 0,
    views: 0,
    days: 0,
    start: SITE_START
  };

  // 日记统计
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) AS public_count,
              COALESCE(SUM(view_count), 0) AS views
       FROM diaries`
    );
    data.diaries = Number(rows[0].total) || 0;
    data.publicDiaries = Number(rows[0].public_count) || 0;
    data.views += Number(rows[0].views) || 0;
  } catch (err) {
    console.error('统计日记失败:', err.message);
  }

  // 文章统计（表不存在时忽略，不影响整体接口）
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(view_count), 0) AS views FROM posts`
    );
    data.posts = Number(rows[0].total) || 0;
    data.views += Number(rows[0].views) || 0;
  } catch (err) {
    console.error('统计文章失败:', err.message);
  }

  // 运行天数
  const start = new Date(SITE_START + 'T00:00:00');
  if (!isNaN(start.getTime())) {
    data.days = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
  }

  res.json({ code: 200, data });
});

module.exports = router;
