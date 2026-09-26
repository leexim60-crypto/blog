/**
 * Cloudflare Pages Function：把同源的 /api/* 反向代理到 Render 上的博客后端。
 *
 * 为什么需要它：Vercel 的 rewrites 可以把 /api/* 转发到外部域名，
 * 但 Cloudflare Pages 的 _redirects 只支持站内跳转、不支持跨域代理，
 * 所以这里用 Functions 做代理，保持前端代码里 /api 同源调用不变。
 *
 * 好处：前端代码零改动，且不依赖 CORS（同源请求），也避免暴露后端地址。
 * 代价：每次 /api 请求会消耗一次 Functions 调用（免费版 10 万次/天）。
 *
 * 想直连后端（不走代理）也可以：在 Cloudflare 项目里设置环境变量
 *   VITE_API_URL = https://blog-server-j4je.onrender.com/api
 * 然后重新部署，前端会直接跨域请求后端（后端已放开 CORS）。
 */

// 后端地址：优先读环境变量 API_ORIGIN，方便换域名时不用改代码
const DEFAULT_ORIGIN = 'https://blog-server-j4je.onrender.com'

export async function onRequest(context) {
  const { request, params, env } = context
  const origin = (env && env.API_ORIGIN) || DEFAULT_ORIGIN

  // [[path]] 捕获的是数组，例如 /api/diaries/12 -> ['diaries', '12']
  const segments = params.path
  const path = Array.isArray(segments) ? segments.join('/') : segments || ''

  const incoming = new URL(request.url)
  const target = `${origin}/api/${path}${incoming.search}`

  // 复制请求头，去掉与目标主机相关、会导致后端校验失败的字段
  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('content-length') // 交给 fetch 重新计算
  headers.set('X-Forwarded-Host', incoming.host)
  headers.set('X-Forwarded-Proto', incoming.protocol.replace(':', ''))

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      // GET/HEAD 不能带 body，其余方法直接把流透传
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body
    })

    // 透传响应；编码相关头部必须去掉，否则浏览器会按错误的压缩方式解析
    const outHeaders = new Headers(upstream.headers)
    outHeaders.delete('content-encoding')
    outHeaders.delete('content-length')
    outHeaders.delete('transfer-encoding')
    outHeaders.delete('connection')

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: outHeaders
    })
  } catch (err) {
    // 后端休眠/宕机时返回结构化错误，前端按统一格式提示
    return new Response(
      JSON.stringify({ code: 502, message: '后端服务暂时不可用，请稍后重试' }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      }
    )
  }
}
