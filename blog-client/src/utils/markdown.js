import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'
import 'highlight.js/styles/github-dark.css'

marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value
      }
      return hljs.highlightAuto(code).value
    }
  })
)

marked.setOptions({ breaks: true })

/**
 * Markdown 转 HTML（带 XSS 消毒 + 代码高亮）
 */
export function renderMarkdown(text) {
  return DOMPurify.sanitize(marked.parse(text || ''))
}

/**
 * 去除 Markdown 标记，提取纯文本摘要
 */
export function plainText(text, maxLen = 120) {
  const raw = String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`~\-|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return raw.length > maxLen ? raw.slice(0, maxLen) + '…' : raw
}
