export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getCategoryType(name) {
  const map = { '代码': '', '面试八股': 'warning', '感悟': 'success' }
  return map[name] || 'info'
}

export function estimateReadTime(content) {
  if (!content) return '1 分钟'
  const chars = content.replace(/\s/g, '').length
  const minutes = Math.max(1, Math.ceil(chars / 400))
  return `${minutes} 分钟`
}
