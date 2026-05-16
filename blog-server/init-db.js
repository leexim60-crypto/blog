require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  const connConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  // 云数据库需要 SSL 连接
  if (process.env.DB_SSL === 'true') {
    connConfig.ssl = { rejectUnauthorized: false };
  }

  const conn = await mysql.createConnection(connConfig);

  const dbName = process.env.DB_NAME || 'personal_blog';
  console.log('连接MySQL成功，开始初始化数据库...');

  // 创建数据库
  await conn.query(`CREATE DATABASE IF NOT EXISTS ${dbName} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE ${dbName}`);

  // 先删除旧表（按外键依赖顺序：子表先删）
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  await conn.query('DROP TABLE IF EXISTS post_tags');
  await conn.query('DROP TABLE IF EXISTS posts');
  await conn.query('DROP TABLE IF EXISTS tags');
  await conn.query('DROP TABLE IF EXISTS categories');
  await conn.query('DROP TABLE IF EXISTS users');
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('旧表已清理，开始重建...');

  // 创建users表
  await conn.query(`
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      nickname VARCHAR(50) DEFAULT '',
      avatar VARCHAR(255) DEFAULT '',
      bio TEXT,
      role ENUM('admin', 'user') DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 创建categories表
  await conn.query(`
    CREATE TABLE categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      icon VARCHAR(50) DEFAULT '',
      description TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 创建posts表
  await conn.query(`
    CREATE TABLE posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      content LONGTEXT NOT NULL,
      summary VARCHAR(500) DEFAULT '',
      category_id INT,
      author_id INT,
      cover_image VARCHAR(255) DEFAULT '',
      is_published TINYINT DEFAULT 1,
      view_count INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 创建tags表
  await conn.query(`
    CREATE TABLE tags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(30) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 创建post_tags关联表
  await conn.query(`
    CREATE TABLE post_tags (
      post_id INT NOT NULL,
      tag_id INT NOT NULL,
      PRIMARY KEY (post_id, tag_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 添加索引提升查询性能
  await conn.query('CREATE INDEX idx_posts_published ON posts (is_published)');
  await conn.query('CREATE INDEX idx_posts_category ON posts (category_id)');
  await conn.query('CREATE INDEX idx_posts_created ON posts (created_at DESC)');
  await conn.query('CREATE INDEX idx_tags_name ON tags (name)');
  console.log('索引已创建');

  // 插入预设分类
  await conn.query(`
    INSERT INTO categories (name, icon, description) VALUES
    ('代码', 'Monitor', '编程技术分享、代码片段、项目实战'),
    ('面试八股', 'Document', '前端面试题、八股文、高频考点'),
    ('感悟', 'Star', '技术感悟、成长心得、生活随想')
  `);
  console.log('预设分类已创建');

  // 创建默认管理员账户
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await conn.query(
    'INSERT INTO users (username, password, nickname, bio) VALUES (?, ?, ?, ?)',
    ['admin', hashedPassword, '前端工程师', '热爱技术，热爱生活。一名专注于前端开发的工程师。']
  );
  // 设置管理员角色
  await conn.query("UPDATE users SET role = 'admin' WHERE username = 'admin'");
  console.log('默认管理员账户已创建 (用户名: admin, 密码: admin123)');

  // 插入示例标签
  await conn.query(`
    INSERT INTO tags (name) VALUES
    ('JavaScript'), ('Vue'), ('React'), ('CSS'), ('Node.js'),
    ('面试'), ('算法'), ('网络'), ('性能优化'), ('随笔')
  `);

  // 获取分类ID
  const [cats] = await conn.query('SELECT id, name FROM categories');
  const catMap = {};
  cats.forEach(c => { catMap[c.name] = c.id; });

  // 获取用户ID
  const [users] = await conn.query('SELECT id FROM users LIMIT 1');
  const authorId = users[0].id;

  // 示例文章1 - 代码分类
  const [result1] = await conn.query(
    `INSERT INTO posts (title, content, summary, category_id, author_id, is_published, view_count) VALUES (?, ?, ?, ?, ?, 1, 128)`,
    [
      'Vue 3 Composition API 实战指南',
      `# Vue 3 Composition API 实战指南

## 前言

Vue 3 引入了 Composition API，这是一种全新的组件逻辑组织方式。相比 Options API，它提供了更好的逻辑复用和代码组织能力。

## 核心概念

### ref 和 reactive

\`\`\`javascript
import { ref, reactive } from 'vue'

// ref 用于基本类型
const count = ref(0)
console.log(count.value) // 0

// reactive 用于对象
const state = reactive({
  name: '张三',
  age: 25
})
\`\`\`

### computed 计算属性

\`\`\`javascript
import { computed } from 'vue'

const fullName = computed(() => {
  return firstName.value + ' ' + lastName.value
})
\`\`\`

### watch 侦听器

\`\`\`javascript
import { watch } from 'vue'

watch(count, (newVal, oldVal) => {
  console.log(\`count 从 \${oldVal} 变为 \${newVal}\`)
})
\`\`\`

## 自定义 Hooks

\`\`\`javascript
// useCounter.js
import { ref } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  const increment = () => count.value++
  const decrement = () => count.value--
  return { count, increment, decrement }
}
\`\`\`

## 总结

Composition API 让我们能够更灵活地组织组件逻辑，配合 \`<script setup>\` 语法糖，开发体验更加流畅。`,
      'Vue 3 引入了 Composition API，这是一种全新的组件逻辑组织方式。本文通过实战案例详细介绍 ref、reactive、computed、watch 等核心概念。',
      catMap['代码'],
      authorId
    ]
  );

  // 关联标签
  const [tags] = await conn.query('SELECT id, name FROM tags');
  const tagMap = {};
  tags.forEach(t => { tagMap[t.name] = t.id; });
  await conn.query('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [result1.insertId, tagMap['Vue']]);
  await conn.query('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [result1.insertId, tagMap['JavaScript']]);

  // 示例文章2 - 面试八股
  const [result2] = await conn.query(
    `INSERT INTO posts (title, content, summary, category_id, author_id, is_published, view_count) VALUES (?, ?, ?, ?, ?, 1, 256)`,
    [
      '前端高频面试题：浏览器渲染原理',
      `# 前端高频面试题：浏览器渲染原理

## 浏览器渲染流程

### 1. 解析HTML构建DOM树

浏览器接收到HTML字节流，通过分词器将其转化为Token，再构建成DOM树节点，最终形成DOM树。

### 2. 构建CSSOM树

CSS解析与HTML解析互不影响，解析CSS形成CSSOM（CSS Object Model）。

### 3. 构建渲染树

\`\`\`
DOM树 + CSSOM树 → 渲染树(Render Tree)
\`\`\`

渲染树只包含可见节点，不包含 \`display: none\` 的元素。

### 4. 布局（Layout/Reflow）

计算每个节点在屏幕上的确切位置和大小。

### 5. 绘制（Paint）

将渲染树转化为屏幕上的像素。

## 重排与重绘

### 重排（Reflow）

当元素的尺寸、布局发生变化时触发：

\`\`\`javascript
// 触发重排的操作
element.style.width = '100px'
element.appendChild(childNode)
window.resize
\`\`\`

### 重绘（Repaint）

当元素外观改变但不影响布局时触发：

\`\`\`javascript
// 触发重绘的操作
element.style.color = 'red'
element.style.visibility = 'hidden'
\`\`\`

## 性能优化建议

1. **减少DOM操作**：批量修改DOM或使用DocumentFragment
2. **避免频繁读取布局属性**：offsetTop、scrollTop等
3. **使用transform代替top/left**：transform不会触发重排
4. **使用will-change提示浏览器**：提前告知浏览器哪些属性会变化

\`\`\`css
.animated-element {
  will-change: transform;
  transform: translateZ(0); /* 创建独立图层 */
}
\`\`\`

## 面试高频追问

> Q: 为什么 \`transform\` 不触发重排？
> A: 因为transform是在合成层(Composite)处理的，不涉及布局计算，由GPU直接处理。`,
      '浏览器渲染原理是前端面试中的高频考点。本文详细解析从HTML解析到像素上屏的完整流程，以及重排重绘的优化策略。',
      catMap['面试八股'],
      authorId
    ]
  );
  await conn.query('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [result2.insertId, tagMap['面试']]);
  await conn.query('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [result2.insertId, tagMap['性能优化']]);

  // 示例文章3 - 感悟分类
  const [result3] = await conn.query(
    `INSERT INTO posts (title, content, summary, category_id, author_id, is_published, view_count) VALUES (?, ?, ?, ?, ?, 1, 64)`,
    [
      '写代码三年后，我学到的几件事',
      `# 写代码三年后，我学到的几件事

## 代码不是最重要的

刚开始写代码的时候，我觉得技术就是一切。三年后我发现，**理解需求比写代码更重要**。

一段完美但解决错误问题的代码，不如一段简陋但精准解决问题的代码。

## 学会说"我不知道"

曾经害怕在团队中暴露自己的无知。后来发现，坦诚地说"我不知道，但我会去研究"反而赢得了更多信任。

## 技术深度 vs 技术广度

前两年疯狂学各种框架，第三年开始意识到**深度比广度更有价值**。

- 不是会用10个框架，而是深入理解1个
- 不是知道100个API，而是理解底层原理

## 写好文档就是写好代码

\`\`\`
好代码 > 好注释 > 好文档 > 无文档的天才代码
\`\`\`

三个月后你回看自己写的"天才代码"，如果没有文档，你会想骂人。

## 保持好奇心

技术更新很快，焦虑是常态。但只要保持好奇心，把学习当作乐趣而不是负担，就不会被淘汰。

---

*以上是我三年来的一些感悟，希望对同行有所启发。欢迎交流。*`,
      '写代码三年后的一些技术感悟和成长心得。关于技术深度、沟通、文档、好奇心的思考。',
      catMap['感悟'],
      authorId
    ]
  );
  await conn.query('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [result3.insertId, tagMap['随笔']]);

  console.log('示例文章已创建');
  console.log('数据库初始化完成！');
  await conn.end();
}

initDatabase().catch(err => {
  console.error('初始化失败:', err.message);
  process.exit(1);
});
