/**
 * 纯文本处理工具
 * ------------------------------------------------------------------
 * 刻意与 utils/markdown.js 分开：
 * markdown.js 会静态引入 marked + highlight.js + DOMPurify（约 1MB），
 * 而列表页只需要「把 Markdown 压成一句摘要」。
 * 之前列表页 import { plainText } from './markdown' 会把整个高亮器
 * 拖进首包 —— 现在摘要类工具单独放这里，按需引入。
 */

/** 去掉 Markdown 标记，取前 maxLen 个字符作为摘要 */
export function plainText(text, maxLen = 120) {
  const raw = String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`~\-|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return raw.length > maxLen ? raw.slice(0, maxLen) + '…' : raw
}

/** 统计中文字符数（阅读时长的粗略依据） */
export function charCount(text) {
  return String(text || '').replace(/\s+/g, '').length
}

/** 按字数估算阅读时长（中文约 350 字/分钟） */
export function readingMinutes(text) {
  const n = charCount(text)
  return Math.max(1, Math.round(n / 350))
}

/** YYYY-MM-DD → { day, month, year, weekday } */
export function parseDate(dateStr) {
  const [y, m, d] = String(dateStr || '').split('-').map((v) => parseInt(v, 10))
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  let weekday = ''
  if (y && m && d) {
    weekday = weekdays[new Date(y, m - 1, d).getDay()]
  }
  return { year: y, month: m, day: d, weekday }
}

/** 格式化完整中文日期 */
export function fullDateCN(dateStr) {
  const { year, month, day } = parseDate(dateStr)
  if (!year) return ''
  return `${year}年${month}月${day}日`
}
