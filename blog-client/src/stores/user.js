import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '../utils/request'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('blog_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('blog_user') || 'null'))
  const showLogin = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(tokenVal, userVal) {
    token.value = tokenVal
    user.value = userVal
    localStorage.setItem('blog_token', tokenVal)
    localStorage.setItem('blog_user', JSON.stringify(userVal))
  }

  function clearAuth() {
    token.value = ''
    user.value = null
    localStorage.removeItem('blog_token')
    localStorage.removeItem('blog_user')
  }

  async function login(username, password) {
    const res = await request.post('/auth/login', { username, password })
    setAuth(res.data.token, res.data.user)
    return res.data.user
  }

  async function register(username, password, nickname) {
    const res = await request.post('/auth/register', { username, password, nickname })
    setAuth(res.data.token, res.data.user)
    return res.data.user
  }

  function logout() {
    clearAuth()
  }

  function openLogin() {
    showLogin.value = true
  }

  return { token, user, isLoggedIn, showLogin, login, register, logout, openLogin, setAuth, clearAuth }
})
