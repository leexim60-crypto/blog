import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  // 生产环境可通过 VITE_API_URL 直连后端；默认同源 /api（本地走 vite proxy，线上走 vercel rewrite）
  baseURL: import.meta.env.VITE_API_URL || '/api',
  // Render 免费版冷启动唤醒约需 50 秒，超时需留足余量
  timeout: 60000
})

// 请求拦截：自动带上 token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('blog_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：统一错误提示
// 文案面向用户而不是开发者：免费实例冷启动/网络异常时给出可行动的说法，
// 避免把 “Cannot GET /api/...” 这类技术细节直接丢到界面上。
request.interceptors.response.use(
  res => res.data,
  err => {
    const status = err.response?.status
    let msg = err.response?.data?.message

    if (!err.response) {
      // 超时或无法连接：大概率是后端免费实例冷启动休眠，正在唤醒
      msg = '后端正在唤醒（免费实例休眠中），大约 1 分钟后重试'
    } else if (!msg || typeof msg !== 'string') {
      if (status === 401) msg = '登录状态已过期，请重新登录'
      else if (status === 403) msg = '没有权限执行这个操作'
      else if (status === 404) msg = '内容不存在，可能已被删除'
      else if (status >= 500) msg = '服务器开小差了，请稍后再试'
      else msg = `请求失败（${status}）`
    }

    ElMessage.error(msg)
    return Promise.reject(err)
  }
)

export default request
