<template>
  <div id="app">
    <header class="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm border-b border-stone-200 z-50">
      <div class="max-w-6xl mx-auto px-5 flex items-center justify-between h-full">
        <router-link to="/" class="flex items-center gap-2 text-lg font-bold text-primary-600">
          <el-icon :size="22"><Monitor /></el-icon>
          <span>前端工程师的博客</span>
        </router-link>
        <nav class="hidden md:flex items-center gap-1">
          <router-link to="/" class="nav-link">
            <el-icon><HomeFilled /></el-icon> 首页
          </router-link>
          <router-link to="/about" class="nav-link">
            <el-icon><User /></el-icon> 关于
          </router-link>
          <template v-if="authStore.isLoggedIn">
            <router-link to="/admin" class="nav-link">
              <el-icon><Setting /></el-icon> 管理
            </router-link>
            <el-dropdown trigger="click">
              <span class="nav-link cursor-pointer flex items-center gap-1">
                <el-icon><UserFilled /></el-icon>
                {{ authStore.user?.nickname || authStore.user?.username }}
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="router.push('/admin')">
                    <el-icon><Setting /></el-icon> 后台管理
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">
                    <el-icon><SwitchButton /></el-icon> 退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <router-link v-else to="/login" class="nav-link-login">
            <el-icon><Key /></el-icon> 登录
          </router-link>
        </nav>
        <el-icon class="md:hidden text-xl cursor-pointer text-stone-600" @click="showMobileMenu = !showMobileMenu"><Menu /></el-icon>
      </div>
      <!-- 移动端菜单 -->
      <div v-if="showMobileMenu" class="md:hidden bg-white border-b border-stone-200 px-5 py-3">
        <router-link to="/" class="mobile-nav-link" @click="showMobileMenu = false">
          <el-icon><HomeFilled /></el-icon> 首页
        </router-link>
        <router-link to="/about" class="mobile-nav-link" @click="showMobileMenu = false">
          <el-icon><User /></el-icon> 关于
        </router-link>
        <template v-if="authStore.isLoggedIn">
          <router-link to="/admin" class="mobile-nav-link" @click="showMobileMenu = false">
            <el-icon><Setting /></el-icon> 管理
          </router-link>
          <a class="mobile-nav-link" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon> 退出登录
          </a>
        </template>
        <router-link v-else to="/login" class="mobile-nav-link" @click="showMobileMenu = false">
          <el-icon><Key /></el-icon> 登录
        </router-link>
      </div>
    </header>

    <main class="min-h-[calc(100vh-64px-80px)] pt-[calc(64px+20px)] pb-10">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="text-center py-5 text-xs text-stone-400 border-t border-stone-200 bg-white">
      <div class="max-w-6xl mx-auto px-5">
        <p>© {{ new Date().getFullYear() }} 前端工程师的博客 · 热爱技术，热爱生活</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const showMobileMenu = ref(false)

watch(() => route.path, () => {
  showMobileMenu.value = false
})

function handleLogout() {
  authStore.logout()
  showMobileMenu.value = false
  ElMessage.success('已退出登录')
  router.push('/')
}
</script>

<style scoped>
.nav-link {
  @apply flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-stone-600 transition-all duration-200 hover:text-primary-600 hover:bg-primary-50;
}
.nav-link.router-link-active {
  @apply text-primary-600 bg-primary-50 font-medium;
}
.nav-link-login {
  @apply flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-white bg-primary-500 hover:bg-primary-600 transition-all duration-200;
}
.mobile-nav-link {
  @apply flex items-center gap-2 px-4 py-3 rounded-lg text-stone-600 transition-all duration-200 hover:text-primary-600 hover:bg-primary-50;
}
</style>
