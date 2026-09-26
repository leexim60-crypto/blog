/**
 * 小组件通用请求工具
 * 用原生 fetch 而不是项目里的 axios 实例：
 * 小组件是「装饰性」的，第三方接口挂掉时不应该弹全局错误提示，
 * 每个组件自己降级显示即可。
 */

export async function fetchJson(url, { timeout = 8000, headers } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers,
      // 第三方接口不需要携带 cookie
      credentials: 'omit'
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

export function isAbortError(err) {
  return !!err && (err.name === 'AbortError' || err.code === 20)
}

/** 读 / 写 localStorage 缓存（带过期时间），失败静默 */
export function readCache(key, maxAgeMs) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (!obj || typeof obj.t !== 'number') return null
    if (Date.now() - obj.t > maxAgeMs) return null
    return obj.v
  } catch (e) {
    return null
  }
}

export function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value }))
  } catch (e) {
    /* 隐私模式下 localStorage 不可用，忽略 */
  }
}

export const pad2 = (n) => String(n).padStart(2, '0')

/** 数字千分位 */
export function formatNumber(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString('zh-CN')
}
