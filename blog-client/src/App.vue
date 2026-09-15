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
          <router-link to="/diary" class="nav-link">
            <el-icon><Notebook /></el-icon> 我的日记
          </router-link>
          <div class="nav-link" @click="openProjects">
            <el-icon><Grid /></el-icon> 我的项目
          </div>
        </nav>
        <!-- 登录区 -->
        <div class="hidden md:flex items-center gap-2">
          <template v-if="userStore.isLoggedIn">
            <el-dropdown @command="onUserCommand">
              <span class="flex items-center gap-1.5 text-sm text-white/80 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <el-icon><UserFilled /></el-icon> {{ userStore.user?.nickname || userStore.user?.username }}
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="diary">我的日记</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <el-button v-else size="small" round type="primary" plain @click="userStore.openLogin()">
            登录
          </el-button>
        </div>
        <el-icon class="md:hidden text-xl cursor-pointer text-white" @click="showMobileMenu = !showMobileMenu"><Menu /></el-icon>
      </div>
      <!-- 移动端菜单 -->
      <div v-if="showMobileMenu" class="md:hidden bg-[#030812]/95 backdrop-blur-md border-b border-white/10 px-5 py-3">
        <router-link to="/" class="mobile-nav-link" @click="showMobileMenu = false">
          <el-icon><HomeFilled /></el-icon> 首页
        </router-link>
        <router-link to="/diary" class="mobile-nav-link" @click="showMobileMenu = false">
          <el-icon><Notebook /></el-icon> 我的日记
        </router-link>
        <a class="mobile-nav-link" @click="openProjects">
          <el-icon><Grid /></el-icon> 我的项目
        </a>
        <a v-if="!userStore.isLoggedIn" class="mobile-nav-link" @click="userStore.openLogin(); showMobileMenu = false">
          <el-icon><UserFilled /></el-icon> 登录
        </a>
        <a v-else class="mobile-nav-link" @click="onUserCommand('logout')">
          <el-icon><SwitchButton /></el-icon> 退出登录 ({{ userStore.user?.nickname }})
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

    <!-- 全局登录对话框 -->
    <LoginDialog />

    <footer class="text-center py-6 text-xs text-white/40 border-t border-white/10 bg-[#020810]">
      <div class="max-w-6xl mx-auto px-5">
        <p>© {{ new Date().getFullYear() }} 陈Hello的博客 · Build your digital aura</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useProjectsStore } from './stores/projects'
import { useUserStore } from './stores/user'
import LoginDialog from './components/LoginDialog.vue'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const userStore = useUserStore()
const showMobileMenu = ref(false)

watch(() => route.path, () => {
  showMobileMenu.value = false
})

function openProjects() {
  showMobileMenu.value = false
  projectsStore.open()
}

function onUserCommand(cmd) {
  if (cmd === 'logout') {
    userStore.logout()
    showMobileMenu.value = false
    ElMessage.success('已退出登录')
  } else if (cmd === 'diary') {
    router.push('/diary')
  }
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
