<template>
  <Teleport to="body">
    <!-- 项目侧边栏（顶栏触发，深色玻璃风格，全站可用） -->
    <el-drawer
      v-model="projectsStore.showDrawer"
      title="我的项目"
      direction="rtl"
      size="400px"
      class="projects-drawer"
    >
      <div class="flex flex-col gap-4">
        <a
          v-for="proj in projectsStore.projects"
          :key="proj.name"
          :href="proj.url"
          target="_blank"
          rel="noopener noreferrer"
          class="project-card !rounded-2xl p-5 flex flex-col gap-3"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg"
              :style="{ background: `linear-gradient(135deg, ${proj.color}, ${proj.color}cc)` }"
            >
              <el-icon :size="22" class="text-white"><component :is="proj.icon" /></el-icon>
            </div>
            <div class="min-w-0">
              <h3 class="text-base font-semibold text-white truncate">{{ proj.name }}</h3>
              <span class="text-xs text-white/40 truncate block">{{ proj.url.replace(/^https?:\/\//, '') }}</span>
            </div>
          </div>
          <p class="text-sm text-white/60 leading-relaxed">{{ proj.desc }}</p>
          <span class="text-xs flex items-center gap-1 self-start text-white/50">
            访问项目 <el-icon><TopRight /></el-icon>
          </span>
        </a>
        <el-empty v-if="projectsStore.projects.length === 0" description="还没有项目" />
      </div>
    </el-drawer>
  </Teleport>
</template>

<script setup>
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

/* 侧边栏深色化 */
:deep(.el-drawer) {
  background-color: #061428 !important;
}

:deep(.el-drawer__header) {
  color: #fff;
  margin-bottom: 16px;
}

:deep(.el-drawer__close-btn) {
  color: rgba(255, 255, 255, 0.7);
}

:deep(.el-drawer__body) {
  padding-top: 0;
}

@media (max-width: 768px) {
  :deep(.el-drawer) {
    width: 85% !important;
  }
}
</style>
