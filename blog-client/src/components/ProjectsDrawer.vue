<template>
  <Teleport to="body">
    <!-- 项目侧边栏（顶栏触发，深色玻璃风格，全站可用） -->
    <el-drawer
      v-model="projectsStore.showDrawer"
      title="我的项目"
      direction="rtl"
      size="400px"
      class="projects-drawer"
      modal-class="projects-drawer-mask"
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
</style>

<!--
  抽屉面板被 Teleport 到 body，且自定义 class 是经 $attrs 落到面板自身
  （.el-drawer）上的。scoped 的 :deep(.el-drawer) 会编译成
  [data-v-x] .el-drawer 这种「后代」选择器，而面板自己就带着 data-v-x，
  永远匹配不到 → 深色样式全部失效，抽屉保持 Element Plus 默认白底，
  白字叠白底自然「一点字都看不见」。
  所以这里必须用非 scoped 样式，并靠自定义 class 限定作用范围，
  避免污染其它抽屉/弹窗。
-->
<style>
.projects-drawer.el-drawer {
  background: linear-gradient(180deg, #0a1c33 0%, #061428 100%);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: -20px 0 60px rgba(2, 8, 20, 0.6);

  /* 让抽屉内所有 Element Plus 组件（el-empty 等）自动跟随深色主题 */
  --el-text-color-primary: #ffffff;
  --el-text-color-regular: rgba(255, 255, 255, 0.75);
  --el-text-color-secondary: rgba(255, 255, 255, 0.5);
  --el-text-color-placeholder: rgba(255, 255, 255, 0.35);
  --el-bg-color: #061428;
  --el-bg-color-overlay: #061428;
  --el-fill-color-blank: rgba(255, 255, 255, 0.05);
  --el-border-color: rgba(255, 255, 255, 0.12);
  --el-border-color-light: rgba(255, 255, 255, 0.1);
}

.projects-drawer .el-drawer__header {
  color: #fff;
  margin-bottom: 16px;
}

.projects-drawer .el-drawer__title {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.projects-drawer .el-drawer__close-btn {
  color: rgba(255, 255, 255, 0.7);
}

.projects-drawer .el-drawer__close-btn:hover i {
  color: #fff;
}

.projects-drawer .el-drawer__body {
  padding-top: 0;
}

/* 遮罩：加深 + 模糊，与博客玻璃质感统一 */
.projects-drawer-mask.el-overlay {
  background-color: rgba(2, 8, 20, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

@media (max-width: 768px) {
  .projects-drawer.el-drawer {
    width: 85% !important;
  }
}
</style>
