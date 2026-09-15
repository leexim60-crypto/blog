<template>
  <div class="home">
    <!-- 全屏星空横幅 -->
    <SkyBanner @open-projects="projectsStore.open()" />

    <!-- 项目展示区 -->
    <section class="bg-[#040e1c] text-white py-20 px-5">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-2xl sm:text-3xl font-bold mb-3 tracking-wide">我的项目</h2>
          <p class="text-white/50 text-sm">我部署上线的作品，点击卡片即可访问</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <a
            v-for="proj in projectsStore.projects"
            :key="proj.name"
            :href="proj.url"
            target="_blank"
            rel="noopener noreferrer"
            class="project-card group relative rounded-2xl p-6 flex flex-col gap-4 overflow-hidden"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                :style="{ background: `linear-gradient(135deg, ${proj.color}, ${proj.color}cc)` }"
              >
                <el-icon :size="24" class="text-white"><component :is="proj.icon" /></el-icon>
              </div>
              <div class="min-w-0">
                <h3 class="text-lg font-semibold truncate">{{ proj.name }}</h3>
                <span class="text-xs text-white/40 truncate block">{{ proj.url.replace(/^https?:\/\//, '') }}</span>
              </div>
            </div>
            <p class="text-sm text-white/60 leading-relaxed flex-1">{{ proj.desc }}</p>
            <span class="text-xs flex items-center gap-1 self-start text-white/50 transition-colors duration-300 group-hover:text-white">
              访问项目 <el-icon class="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"><TopRight /></el-icon>
            </span>
          </a>
        </div>

        <el-empty v-if="projectsStore.projects.length === 0" description="还没有项目" />
      </div>
    </section>
    <!-- 项目侧边栏已抽为全局组件 ProjectsDrawer，在 App.vue 中挂载，全站可用 -->
  </div>
</template>

<script setup>
import SkyBanner from '../components/SkyBanner.vue'
import { useProjectsStore } from '../stores/projects'

const projectsStore = useProjectsStore()
</script>

<style scoped>
.project-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition:
    transform 300ms ease,
    background-color 300ms ease,
    border-color 300ms ease,
    box-shadow 300ms ease;
}

.project-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow: 0 20px 40px rgba(2, 8, 20, 0.5);
}

.project-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 0%, rgba(120, 160, 255, 0.12), transparent 60%);
  opacity: 0;
  transition: opacity 300ms ease;
  pointer-events: none;
}

.project-card:hover::before {
  opacity: 1;
}

/* 侧边栏深色化等抽屉样式已迁移至全局组件 ProjectsDrawer.vue */
</style>
