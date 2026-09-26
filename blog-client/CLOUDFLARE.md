# 部署到 Cloudflare Pages（前端）

本项目前端（`blog-client`）可以部署在 Vercel，也可以部署在 Cloudflare Pages。
下面是 Cloudflare Pages 的完整步骤，以及一个**关键差异**的说明。

---

## 一、关键差异：`/api/*` 不能用 `_redirects` 代理

Vercel 的 `vercel.json` 里有这段：

```json
"rewrites": [
  { "source": "/api/(.*)", "destination": "https://blog-server-j4je.onrender.com/api/$1" }
]
```

它把同源的 `/api/*` 转发到 Render 后端。**Cloudflare Pages 的 `_redirects` 做不到这件事**：

| 能力 | Vercel rewrites | Cloudflare Pages `_redirects` |
|---|---|---|
| 站内重写 | ✅ | ✅（Proxying） |
| 代理到**外部域名** | ✅ | ❌ 不支持 |

所以迁移到 Cloudflare 时，用 **Pages Functions** 顶上：

```
blog-client/
├── functions/
│   └── api/
│       └── [[path]].js   ← 把 /api/* 反向代理到 Render 后端
└── public/
    └── _routes.json      ← 限定只有 /api/* 才走 Function
```

`_routes.json` 很重要：不写它的话，加了 Functions 之后**所有**请求（包括 JS/CSS/图片）
都会消耗 Functions 调用额度；写清楚 include/exclude 后，静态资源依然走免费无限量的静态分发。

---

## 二、部署步骤

### 1. 创建 Pages 项目

1. 打开 https://dash.cloudflare.com/ → 左侧 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 授权 GitHub，选择仓库 `leexim60-crypto/blog`
3. 填写构建设置（**注意根目录是 `blog-client`**）：

| 配置项 | 值 |
|---|---|
| Production branch | `main` |
| Framework preset | `Vue`（或 None） |
| **Root directory** | `blog-client` |
| Build command | `npm run build` |
| Build output directory | `dist` |

4. **Save and Deploy**，等 1~2 分钟。

> ⚠️ 不设置 Root directory 会构建失败——仓库根目录是博客的整体工程，
> 前端在 `blog-client/` 子目录里。

### 2. （可选）设置环境变量

如果要**跳过代理、让前端直连后端**，在
**Settings → Environment variables** 添加：

| 变量名 | 值 |
|---|---|
| `VITE_API_URL` | `https://blog-server-j4je.onrender.com/api` |

后端已放开 CORS（`Access-Control-Allow-Origin: *` 逻辑），直连是可行的。
两种方式二选一即可：

- **不设置** → 走 `functions/api/[[path]].js` 同源代理（推荐，前端零改动、不暴露后端地址）
- **设置** → 前端跨域直连后端（省掉 Functions 调用次数）

### 3. 换后端域名时

后端如果换了 Render 地址，改一个地方就行，不用动前端代码：

- 走代理：Cloudflare 项目 → **Settings → Environment variables** 加 `API_ORIGIN = https://新地址`
- 走直连：改 `VITE_API_URL`

---

## 三、部署后自检

| 检查项 | 预期 |
|---|---|
| `https://<你的项目>.pages.dev/api/health` | `{"code":200,"message":"Blog API is running"}` |
| `https://<你的项目>.pages.dev/api/stats/site` | 返回统计 JSON（说明代理通了） |
| 首页 | 星空横幅 + 项目卡片（含四国战机） |
| `/games/strikers-1945.html` | 游戏能打开，左上角有「← 返回博客」 |
| 右侧挂件栏 | 时钟 / 天气 / 小站统计（有真实数字）/ 倒计时 / 一言 / 音乐 / 每日一图 / 日历 |
| 刷新 `/diary` 这类路由 | 不 404（没放 `404.html`，Pages 自动按 SPA 回退到 `index.html`） |

> 注意：**不要**在 `public/` 里放 `404.html`。Pages 只要发现顶层有 `404.html`
> 就不再按 SPA 处理，`/diary` 这类前端路由刷新会直接 404。

---

## 四、其他注意事项

1. **游戏页面不会被 HTML 规范化影响**
   `/games/strikers-1945.html` 是带扩展名的实际文件，会原样返回（Pages 的
   「HTML 去扩展名跳转」只针对没有同名文件的情况）。

2. **后端仍是 Render**
   这次只迁前端。后端（Express + MySQL/TiDB）留在 Render 上，
   冷启动约 1 分钟，前端已有「唤醒中」提示。

3. **静态资源缓存**
   Pages 自带 CDN 缓存，不要额外加 Cache Rules，否则新部署可能被旧缓存挡住。

4. **同时保留 Vercel 也没问题**
   两边都连同一个仓库、同一分支，改一次代码两边都会自动构建，
   相当于多了一个备用访问入口。

5. **想完全脱离 Render**（进阶，非必须）
   Workers 的 wall-clock 时长没有硬上限，理论上可以重写后端，但需要
   一个兼容 MySQL 协议的托管库。当前 TiDB Cloud 是 MySQL 协议，
   Workers 里跑 `mysql2` 不可行（需要 Node 的 net/tls socket），
   得换 TiDB 的 HTTP Data Service 或改用 D1。
   工作量不小，建议先只迁前端。
