<template>
  <div class="home max-w-3xl mx-auto px-5">
    <!-- 头部横幅 -->
    <div class="card relative overflow-hidden p-12 mb-8 rounded-2xl bg-gradient-to-br from-rose-50 via-warm-50 to-amber-50 text-center">
      <div class="relative z-10">
        <div class="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-5 text-primary-500 shadow-md">
          <el-icon :size="40"><HomeFilled /></el-icon>
        </div>
        <h1 class="text-3xl font-bold text-stone-800 mb-3">Hi, 我是陈Hello</h1>
        <p class="text-base text-stone-500 mb-8">欢迎来到我的博客，这里汇总了我部署上线的项目，欢迎访问体验</p>
        <el-button type="primary" size="large" round @click="projectsStore.open()">
          <el-icon class="mr-1"><Grid /></el-icon> 查看我的项目
        </el-button>
      </div>
    </div>

    <!-- 项目侧边栏（与顶栏共用） -->
    <el-drawer
      v-model="projectsStore.showDrawer"
      title="我的项目"
      direction="rtl"
      size="420px"
    >
      <div class="flex flex-col gap-4">
        <a
          v-for="proj in projectsStore.projects"
          :key="proj.name"
          :href="proj.url"
          target="_blank"
          rel="noopener noreferrer"
          class="p-5 rounded-xl border border-stone-200 bg-white flex flex-col gap-3 hover:shadow-card-hover hover:border-primary-300 transition-all duration-300"
        >
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-lg text-white flex items-center justify-center flex-shrink-0" :style="{ background: proj.color }">
              <el-icon :size="22"><component :is="proj.icon" /></el-icon>
            </div>
            <div class="min-w-0">
              <h3 class="text-base font-semibold text-stone-800 truncate">{{ proj.name }}</h3>
              <span class="text-xs text-stone-400 truncate block">{{ proj.url.replace(/^https?:\/\//, '') }}</span>
            </div>
          </div>
          <p class="text-sm text-stone-500 leading-relaxed">{{ proj.desc }}</p>
          <span class="text-xs text-primary-600 flex items-center gap-1 self-start">
            访问项目 <el-icon><TopRight /></el-icon>
          </span>
        </a>
        <el-empty v-if="projectsStore.projects.length === 0" description="还没有项目" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { useProjectsStore } from '../stores/projects'

const projectsStore = useProjectsStore()
</script>

<style scoped>
@media (max-width: 768px) {
  :deep(.el-drawer) {
    width: 85% !important;
  }
}
</style>
