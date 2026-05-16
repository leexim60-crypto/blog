import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

function slugify(text) {
  return text.replace(/[*`~\[\]]/g, '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, '')
}

const renderer = {
  heading(text, level, raw) {
    const id = slugify(raw || text)
    return `<h${level} id="${id}">${text}</h${level}>`
  }
}

const marked = new Marked(
  { gfm: true, breaks: false },
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
marked.use({ renderer })

// 给 img 标签添加 loading="lazy"
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'IMG') {
    node.setAttribute('loading', 'lazy')
    node.setAttribute('alt', node.getAttribute('alt') || '')
  }
})

export function renderMarkdown(content) {
  if (!content) return ''
  const rawHtml = marked.parse(content)
  return DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['id'] })
}

export function extractHeadings(content) {
  if (!content) return []
  const result = []
  const regex = /^(#{2,3})\s+(.+)$/gm
  let match
  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].replace(/[*`~\[\]]/g, '').trim()
    result.push({ level, text, id: slugify(text) })
  }
  return result
}
