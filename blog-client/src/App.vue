<template>
  <div id="app">
    <header class="fixed top-0 left-0 right-0 h-16 z-50 bg-[#030812]/70 backdrop-blur-md border-b border-white/10">
      <div class="max-w-6xl mx-auto px-5 flex items-center justify-between h-full">
        <router-link to="/" class="flex items-center gap-2 text-lg font-bold text-white">
          <el-icon :size="22" class="text-blue-200"><Monitor /></el-icon>
          <span class="hidden sm:inline">陈Hello的博客</span>
        </router-link>
        <nav class="hidden md:flex items-center gap-1">
          <router-link to="/" class="nav-link">
            <el-icon><HomeFilled /></el-icon> 首页
          </router-link>
          <div class="nav-link" @click="openProjects">
            <el-icon><Grid /></el-icon> 我的项目
          </div>
        </nav>
        <el-icon class="md:hidden text-xl cursor-pointer text-white" @click="showMobileMenu = !showMobileMenu"><Menu /></el-icon>
      </div>
      <!-- 移动端菜单 -->
      <div v-if="showMobileMenu" class="md:hidden bg-[#030812]/95 backdrop-blur-md border-b border-white/10 px-5 py-3">
        <router-link to="/" class="mobile-nav-link" @click="showMobileMenu = false">
          <el-icon><HomeFilled /></el-icon> 首页
        </router-link>
        <a class="mobile-nav-link" @click="openProjects">
          <el-icon><Grid /></el-icon> 我的项目
        </a>
      </div>
    </header>

    <main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="text-center py-6 text-xs text-white/40 border-t border-white/10 bg-[#020810]">
      <div class="max-w-6xl mx-auto px-5">
        <p>© {{ new Date().getFullYear() }} 陈Hello的博客 · Build your digital aura</p>
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
  @apply flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-white/70 transition-all duration-200 hover:text-white hover:bg-white/10 cursor-pointer;
}
.nav-link.router-link-active {
  @apply text-white bg-white/15 font-medium;
}
.mobile-nav-link {
  @apply flex items-center gap-2 px-4 py-3 rounded-lg text-white/70 transition-all duration-200 hover:text-white hover:bg-white/10 cursor-pointer;
}
</style>
