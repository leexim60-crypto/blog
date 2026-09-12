<template>
  <div id="app">
    <header class="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm border-b border-stone-200 z-50">
      <div class="max-w-6xl mx-auto px-5 flex items-center justify-between h-full">
        <router-link to="/" class="flex items-center gap-2 text-lg font-bold text-primary-600">
          <el-icon :size="22"><Monitor /></el-icon>
          <span>陈Hello的博客</span>
        </router-link>
        <nav class="hidden md:flex items-center gap-1">
          <router-link to="/" class="nav-link">
            <el-icon><HomeFilled /></el-icon> 首页
          </router-link>
          <router-link to="/about" class="nav-link">
            <el-icon><User /></el-icon> 关于
          </router-link>
          <div class="nav-link cursor-pointer" @click="openProjects">
            <el-icon><Grid /></el-icon> 我的项目
          </div>
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
        <a class="mobile-nav-link" @click="openProjects">
          <el-icon><Grid /></el-icon> 我的项目
        </a>
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
        <p>© {{ new Date().getFullYear() }} 陈Hello的博客 · 项目导航与文章分享</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectsStore } from './stores/projects'

const route = useRoute()
const projectsStore = useProjectsStore()
const showMobileMenu = ref(false)

watch(() => route.path, () => {
  showMobileMenu.value = false
})

function openProjects() {
  showMobileMenu.value = false
  projectsStore.open()
}
</script>

<style scoped>
.nav-link {
  @apply flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-stone-600 transition-all duration-200 hover:text-primary-600 hover:bg-primary-50 cursor-pointer;
}
.nav-link.router-link-active {
  @apply text-primary-600 bg-primary-50 font-medium;
}
.mobile-nav-link {
  @apply flex items-center gap-2 px-4 py-3 rounded-lg text-stone-600 transition-all duration-200 hover:text-primary-600 hover:bg-primary-50 cursor-pointer;
}
</style>
