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
      <p class="drawer-intro">我部署上线的作品，点击卡片即可访问</p>

      <div class="drawer-list">
        <a
          v-for="(proj, i) in projectsStore.projects"
          :key="proj.name"
          v-spotlight
          :href="proj.url"
          target="_blank"
          rel="noopener noreferrer"
          class="drawer-card glass"
          :style="{ '--tint': proj.color, '--i': i }"
        >
          <span class="drawer-card__tint" aria-hidden="true"></span>

          <div class="drawer-card__top">
            <span class="drawer-card__icon" aria-hidden="true">
              <el-icon :size="20"><component :is="proj.icon" /></el-icon>
            </span>
            <span class="drawer-card__index num" aria-hidden="true">
              {{ String(i + 1).padStart(2, '0') }}
            </span>
          </div>

          <h3 class="drawer-card__name">{{ proj.name }}</h3>
          <p class="drawer-card__desc">{{ proj.desc }}</p>

          <span class="drawer-card__foot">
            <span class="drawer-card__url">{{ prettyUrl(proj.url) }}</span>
            <el-icon class="drawer-card__go"><TopRight /></el-icon>
          </span>
        </a>

        <p v-if="projectsStore.projects.length === 0" class="drawer-empty">
          还没有项目，稍后再来看看 ✨
        </p>
      </div>
    </el-drawer>
  </Teleport>
</template>

<script setup>
import { useProjectsStore } from '../stores/projects'

const projectsStore = useProjectsStore()

const prettyUrl = (url) => String(url).replace(/^https?:\/\//, '').replace(/\/$/, '')
</script>

<style scoped>
.drawer-intro {
  margin: 0 0 var(--space-s);
  font-size: var(--step--1);
  color: rgba(255, 255, 255, 0.5);
}

.drawer-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.drawer-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 1.1rem 1.15rem;
  border-radius: var(--r-m);
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
  /* 依次入场，抽屉打开时更有层次 */
  animation: drawer-card-in 520ms var(--ease-out-expo) backwards;
  animation-delay: calc(var(--i) * 60ms + 80ms);
}
@keyframes drawer-card-in {
  from {
    opacity: 0;
    transform: translateX(18px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.drawer-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--tint) 42%, rgba(255, 255, 255, 0.2));
  background: rgba(255, 255, 255, 0.075);
}

.drawer-card__tint {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--tint), transparent);
  transform: scaleX(0);
  opacity: 0;
  transition:
    transform var(--dur-4) var(--ease-out-expo),
    opacity var(--dur-3);
}
.drawer-card:hover .drawer-card__tint {
  transform: scaleX(1);
  opacity: 1;
}

.drawer-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}
.drawer-card__icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  color: #fff;
  background: linear-gradient(135deg, var(--tint), color-mix(in srgb, var(--tint) 62%, #000));
  box-shadow: 0 8px 20px color-mix(in srgb, var(--tint) 30%, transparent);
  transition: transform var(--dur-3) var(--ease-spring);
}
.drawer-card:hover .drawer-card__icon {
  transform: scale(1.07) rotate(-6deg);
}
.drawer-card__index {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.3);
}

.drawer-card__name {
  margin: 0.15rem 0 0;
  font-size: var(--step-1);
  font-weight: 620;
  letter-spacing: -0.015em;
  color: #fff;
}
.drawer-card__desc {
  margin: 0;
  font-size: var(--step--1);
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.55);
}

.drawer-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-top: 0.25rem;
  padding-top: 0.7rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.drawer-card__url {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: rgba(255, 255, 255, 0.35);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.drawer-card__go {
  color: rgba(255, 255, 255, 0.45);
  transition: transform var(--dur-3) var(--ease-spring), color var(--dur-2);
}
.drawer-card:hover .drawer-card__go {
  transform: translate(2px, -2px);
  color: #fff;
}

.drawer-empty {
  padding: var(--space-l) 0;
  text-align: center;
  font-size: var(--step--1);
  color: rgba(255, 255, 255, 0.4);
}

@media (max-width: 640px) {
  .drawer-card {
    padding: 1rem;
  }
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
  transition: color 0.2s ease, transform 0.2s ease;
}

.projects-drawer .el-drawer__close-btn:hover {
  color: #fff;
  transform: rotate(90deg);
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
    width: 88% !important;
  }
}
</style>
