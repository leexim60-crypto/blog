import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

// 开发环境走 Vite 代理，生产环境用环境变量配置后端地址
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000
})

// 请求拦截器：自动带上登录token
api.interceptors.request.use(config => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

// 响应拦截器：统一处理错误
api.interceptors.response.use(
  response => {
    const { data } = response
    // 401 token过期或无效
    if (data.code === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      ElMessage.error('登录已过期，请重新登录')
      window.location.href = '/login'
      return Promise.reject(new Error('未授权'))
    }
    return data
  },
  error => {
    const { response } = error
    if (response) {
      // 服务器返回了错误状态码
      const { status, data } = response
      if (status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        ElMessage.error('登录已过期，请重新登录')
        window.location.href = '/login'
      } else if (status === 400) {
        ElMessage.error(data?.message || '请求参数错误')
      } else if (status === 404) {
        ElMessage.error(data?.message || '请求的资源不存在')
      } else if (status === 500) {
        ElMessage.error(data?.message || '服务器错误，请稍后重试')
      } else {
        ElMessage.error(`请求失败 (${status})`)
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export default api
