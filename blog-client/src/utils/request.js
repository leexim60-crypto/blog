import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  // 生产环境可通过 VITE_API_URL 直连后端；默认同源 /api（本地走 vite proxy，线上走 vercel rewrite）
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000
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
    const msg = err.response?.data?.message || '网络错误，请稍后重试'
    ElMessage.error(msg)
    return Promise.reject(err)
  }
)

export default request
