import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('blog_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('blog_user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(tokenStr, userObj) {
    token.value = tokenStr
    user.value = userObj
    localStorage.setItem('blog_token', tokenStr)
    localStorage.setItem('blog_user', JSON.stringify(userObj))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('blog_token')
    localStorage.removeItem('blog_user')
  }

  return { token, user, isLoggedIn, setAuth, logout }
})
