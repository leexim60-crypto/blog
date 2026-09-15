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
request.interceptors.response.use(
  res => res.data,
  err => {
    let msg = err.response?.data?.message
    // 超时或无法连接：大概率是后端免费实例冷启动休眠，正在唤醒
    if (!err.response) {
      msg = '连接后端超时：免费服务器可能正在唤醒（约需1分钟），请稍等后重试'
    }
    ElMessage.error(msg || '网络错误，请稍后重试')
    return Promise.reject(err)
  }
)

export default request
