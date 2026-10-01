<template>
  <div id="app" class="app-shell">
    <!-- 跳转到主内容：键盘/读屏用户友好 -->
    <a class="skip-link" href="#main">跳到主要内容</a>

    <header
      class="site-header"
      :class="{
        'is-scrolled': scrolled,
        'is-hidden': headerHidden && !mobileOpen
      }"
    >
      <div class="site-header__inner shell">
        <!-- 品牌 -->
        <router-link to="/" class="brand" aria-label="返回首页">
          <span class="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="32" height="32">
              <defs>
                <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#8dbcff" />
                  <stop offset="1" stop-color="#c4a6ff" />
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="15" fill="none" stroke="url(#brandGrad)" stroke-width="1.2" opacity="0.5" />
              <path
                d="M19.6 7.4a8.6 8.6 0 1 0 5 12.2 9.4 9.4 0 0 1-5-12.2Z"
                fill="url(#brandGrad)"
              />
              <circle cx="23.4" cy="9.6" r="1.5" fill="#fff" />
            </svg>
          </span>
          <span class="brand__text">
            <span class="brand__name">陈Hello</span>
            <span class="brand__sub">Observatory</span>
          </span>
        </router-link>

        <!-- 桌面导航：底部有一条会滑动的指示条 -->
        <nav ref="navRef" class="site-nav" aria-label="主导航">
          <span class="site-nav__ink" :style="inkStyle" aria-hidden="true"></span>
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="site-nav__link"
            :class="{ 'is-active': isActive(item.to) }"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </router-link>
          <button class="site-nav__link" type="button" @click="openProjects">
            <el-icon><Grid /></el-icon>
            <span>我的项目</span>
          </button>
        </nav>

        <!-- 账户区 -->
        <div class="site-actions">
          <template v-if="userStore.isLoggedIn">
            <el-dropdown trigger="click" @command="onUserCommand">
              <button class="user-chip" type="button">
                <span class="user-chip__avatar">{{ initial }}</span>
                <span class="user-chip__name">{{ userStore.user?.nickname || userStore.user?.username }}</span>
                <el-icon class="user-chip__caret"><ArrowDown /></el-icon>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="diary">
                    <el-icon><Notebook /></el-icon> 我的日记
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon> 退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>

          <button v-else class="btn-aurora site-actions__cta" type="button" @click="userStore.openLogin()">
            <span class="site-actions__spark" aria-hidden="true">✦</span>
            登录 / 注册
          </button>
        </div>

        <!-- 移动端开关 -->
        <button
          class="menu-toggle"
          type="button"
          :aria-expanded="mobileOpen"
          aria-controls="mobile-menu"
          :aria-label="mobileOpen ? '关闭菜单' : '打开菜单'"
          @click="mobileOpen = !mobileOpen"
        >
          <span class="menu-toggle__bars" :class="{ 'is-open': mobileOpen }">
            <i></i><i></i>
          </span>
        </button>
      </div>

      <!-- 阅读进度：贴在导航下沿 -->
      <div class="read-progress" aria-hidden="true">
        <span :style="{ transform: `scaleX(${progress})` }"></span>
      </div>
    </header>

    <!-- 移动端全屏菜单 -->
    <Transition name="menu">
      <div
        v-if="mobileOpen"
        id="mobile-menu"
        class="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="站点导航"
      >
        <nav class="mobile-menu__nav">
          <router-link
            v-for="(item, i) in navItems"
            :key="item.to"
            :to="item.to"
            class="mobile-menu__link"
            :style="{ '--i': i }"
            @click="mobileOpen = false"
          >
            <span class="mobile-menu__index num">0{{ i + 1 }}</span>
            <span class="mobile-menu__label">{{ item.label }}</span>
            <el-icon class="mobile-menu__arrow"><Right /></el-icon>
          </router-link>
          <button
            class="mobile-menu__link"
            type="button"
            :style="{ '--i': navItems.length }"
            @click="openProjects"
          >
            <span class="mobile-menu__index num">0{{ navItems.length + 1 }}</span>
            <span class="mobile-menu__label">我的项目</span>
            <el-icon class="mobile-menu__arrow"><Right /></el-icon>
          </button>
        </nav>

        <div class="mobile-menu__foot" :style="{ '--i': navItems.length + 1 }">
          <template v-if="userStore.isLoggedIn">
            <button class="btn-ghost" type="button" @click="onUserCommand('diary')">
              <el-icon><Notebook /></el-icon> 我的日记
            </button>
            <button class="btn-ghost" type="button" @click="onUserCommand('logout')">
              <el-icon><SwitchButton /></el-icon> 退出登录
            </button>
          </template>
          <button v-else class="btn-aurora mobile-menu__cta" type="button" @click="userStore.openLogin(); mobileOpen = false">
            ✦ 登录 / 注册，开启你的星球
          </button>
        </div>
      </div>
    </Transition>

    <main id="main" tabindex="-1">
      <router-view v-slot="{ Component, route: r }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="r.path" />
        </Transition>
      </router-view>
    </main>

    <footer class="site-footer">
      <div class="shell">
        <div class="site-footer__grid">
          <div class="site-footer__brand">
            <p class="site-footer__title">陈Hello 的数字小宇宙</p>
            <p class="site-footer__desc">
              一个记录项目与心情的地方。夜空每天都不一样，所以这里也一直在变。
            </p>
          </div>

          <div class="site-footer__col">
            <p class="site-footer__head">导航</p>
            <router-link to="/" class="site-footer__link">首页</router-link>
            <router-link to="/diary" class="site-footer__link">我的日记</router-link>
            <button class="site-footer__link" type="button" @click="openProjects">我的项目</button>
          </div>

          <div class="site-footer__col">
            <p class="site-footer__head">这一刻</p>
            <p class="site-footer__meta num">{{ clockText }}</p>
            <p class="site-footer__meta">Build your digital aura</p>
          </div>
        </div>

        <div class="site-footer__bottom">
          <p>© {{ year }} 陈Hello的博客</p>
          <button class="to-top" type="button" @click="toTop">
            回到顶部 <el-icon><Top /></el-icon>
          </button>
        </div>
      </div>
    </footer>

    <!-- 全局登录对话框 -->
    <LoginDialog />
    <!-- 全局项目侧边栏（任意页面可打开） -->
    <ProjectsDrawer />
    <!-- 页面小挂件（右侧悬浮，可折叠 / 可自定义） -->
    <WidgetBoard />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useProjectsStore } from './stores/projects'
import { useUserStore } from './stores/user'
import LoginDialog from './components/LoginDialog.vue'
import ProjectsDrawer from './components/ProjectsDrawer.vue'
import WidgetBoard from './components/widgets/WidgetBoard.vue'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const userStore = useUserStore()

const navItems = [
  { to: '/', label: '首页', icon: 'HomeFilled' },
  { to: '/diary', label: '我的日记', icon: 'Notebook' }
]

const navRef = ref(null)
const mobileOpen = ref(false)
const scrolled = ref(false)
const headerHidden = ref(false)
const progress = ref(0)

const year = new Date().getFullYear()
const initial = computed(() => {
  const name = userStore.user?.nickname || userStore.user?.username || '?'
  return String(name).trim().charAt(0).toUpperCase()
})

/* ---------------- 导航指示条：测量当前项位置后平滑滑动 ---------------- */
const inkStyle = ref({ opacity: 0 })

function isActive(to) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

async function updateInk() {
  await nextTick()
  const nav = navRef.value
  if (!nav) return
  const links = Array.from(nav.querySelectorAll('.site-nav__link'))
  // 首页/日记用 router-link，项目按钮不带 is-active
  const activeIndex = navItems.findIndex((item) => isActive(item.to))
  const target = links[activeIndex]
  if (!target || window.innerWidth < 768) {
    inkStyle.value = { opacity: 0 }
    return
  }
  inkStyle.value = {
    opacity: 1,
    transform: `translateX(${target.offsetLeft}px)`,
    width: `${target.offsetWidth}px`
  }
}

/* ---------------- 滚动：毛玻璃 / 隐藏 / 阅读进度 ---------------- */
let lastY = 0
let ticking = false

function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    const y = window.scrollY
    scrolled.value = y > 12

    // 向下滚动隐藏导航、向上滚动立即出现；顶部附近始终显示
    const delta = y - lastY
    if (y < 140) headerHidden.value = false
    else if (delta > 6) headerHidden.value = true
    else if (delta < -4) headerHidden.value = false
    lastY = y

    const max = document.documentElement.scrollHeight - window.innerHeight
    progress.value = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0
    ticking = false
  })
}

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/* ---------------- 页脚时钟：每分钟走一次就够，不必每秒 ---------------- */
const clockText = ref('')
let clockTimer = null

function tickClock() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  clockText.value = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}`
}

/* ---------------- 其它 ---------------- */
function openProjects() {
  mobileOpen.value = false
  projectsStore.open()
}

function onUserCommand(cmd) {
  mobileOpen.value = false
  if (cmd === 'logout') {
    userStore.logout()
    ElMessage.success('已退出登录')
  } else if (cmd === 'diary') {
    router.push('/diary')
  }
}

function onKeydown(e) {
  if (e.key === 'Escape') mobileOpen.value = false
}

// 移动端菜单打开时锁定页面滚动，关闭时恢复
watch(mobileOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

watch(() => route.path, () => {
  mobileOpen.value = false
  updateInk()
})

let resizeObserver = null

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', updateInk, { passive: true })
  tickClock()
  clockTimer = setInterval(tickClock, 30_000)
  updateInk()

  if (navRef.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(updateInk)
    resizeObserver.observe(navRef.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', updateInk)
  clearInterval(clockTimer)
  resizeObserver?.disconnect()
  document.body.style.overflow = ''
})
</script>

<style scoped>
.app-shell {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}

/* 键盘用户跳过导航 */
.skip-link {
  position: fixed;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  padding: 0.6rem 1.1rem;
  border-radius: var(--r-full);
  background: var(--ink-600);
  border: 1px solid var(--hairline-strong);
  color: #fff;
  font-size: var(--step--1);
  transition: top var(--dur-2) var(--ease-out-quart);
}
.skip-link:focus {
  top: 10px;
}

/* ============================= 顶部导航 ============================= */
.site-header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: var(--z-header);
  height: var(--header-h);
  transition:
    transform var(--dur-3) var(--ease-out-expo),
    background-color var(--dur-3) var(--ease-out-quart),
    border-color var(--dur-3) var(--ease-out-quart),
    backdrop-filter var(--dur-3) var(--ease-out-quart);
  border-bottom: 1px solid transparent;
}
.site-header.is-scrolled {
  background: rgba(4, 7, 15, 0.72);
  border-bottom-color: var(--hairline);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}
.site-header.is-hidden {
  transform: translateY(-100%);
}

.site-header__inner {
  height: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

/* ---- 品牌 ---- */
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  margin-right: auto;
  min-width: 0;
}
.brand__mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex: none;
  transition: transform var(--dur-3) var(--ease-spring);
}
.brand:hover .brand__mark {
  transform: rotate(-14deg) scale(1.06);
}
.brand__mark svg {
  filter: drop-shadow(0 0 10px rgba(120, 160, 255, 0.45));
}
.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  min-width: 0;
}
.brand__name {
  font-size: var(--step-0);
  font-weight: 680;
  letter-spacing: -0.01em;
  color: var(--text-hi);
  white-space: nowrap;
}
.brand__sub {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--text-faint);
}

/* ---- 桌面导航 ---- */
.site-nav {
  position: relative;
  display: none;
  align-items: center;
  gap: 0.15rem;
  padding: 0.28rem;
  border-radius: var(--r-full);
  border: 1px solid var(--hairline);
  background: var(--surface-1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
@media (min-width: 768px) {
  .site-nav {
    display: flex;
  }
}

.site-nav__ink {
  position: absolute;
  top: 0.28rem;
  left: 0;
  height: calc(100% - 0.56rem);
  border-radius: var(--r-full);
  background: linear-gradient(120deg, rgba(110, 168, 255, 0.28), rgba(167, 139, 250, 0.28));
  box-shadow: inset 0 0 0 1px rgba(160, 190, 255, 0.28);
  transition:
    transform var(--dur-3) var(--ease-out-expo),
    width var(--dur-3) var(--ease-out-expo),
    opacity var(--dur-2) linear;
  pointer-events: none;
}

.site-nav__link {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.42rem 0.95rem;
  border: none;
  border-radius: var(--r-full);
  background: transparent;
  color: var(--text-dim);
  font-size: var(--step--1);
  font-weight: 520;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--dur-2) var(--ease-out-quart);
}
.site-nav__link:hover {
  color: #fff;
}
.site-nav__link.is-active {
  color: #fff;
}
.site-nav__link .el-icon {
  font-size: 0.95em;
  opacity: 0.8;
}

/* ---- 账户区 ---- */
.site-actions {
  display: none;
  align-items: center;
  gap: 0.6rem;
  margin-left: auto;
}
@media (min-width: 768px) {
  .site-actions {
    display: flex;
  }
}

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.75rem 0.3rem 0.3rem;
  border-radius: var(--r-full);
  border: 1px solid var(--hairline);
  background: var(--surface-1);
  color: var(--text);
  font-size: var(--step--1);
  cursor: pointer;
  transition:
    background-color var(--dur-2) var(--ease-out-quart),
    border-color var(--dur-2) var(--ease-out-quart),
    color var(--dur-2) var(--ease-out-quart);
}
.user-chip:hover {
  background: var(--surface-3);
  border-color: var(--hairline-strong);
  color: #fff;
}
.user-chip__avatar {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.6875rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--aurora-a), var(--aurora-b));
}
.user-chip__name {
  max-width: 7rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-chip__caret {
  font-size: 0.7em;
  opacity: 0.6;
}

.site-actions__cta {
  padding: 0.5rem 1.1rem;
  font-size: var(--step--1);
}
.site-actions__spark {
  display: inline-block;
  font-size: 0.7em;
  animation: spark-spin 5s linear infinite;
}
@keyframes spark-spin {
  0%,
  100% {
    transform: rotate(0) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.25);
  }
}

/* ---- 移动端开关 ---- */
.menu-toggle {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  margin-left: auto;
  border-radius: var(--r-s);
  border: 1px solid var(--hairline);
  background: var(--surface-1);
  cursor: pointer;
}
@media (min-width: 768px) {
  .menu-toggle {
    display: none;
  }
}
.menu-toggle__bars {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 18px;
}
.menu-toggle__bars i {
  display: block;
  height: 1.5px;
  width: 100%;
  border-radius: 2px;
  background: var(--text-hi);
  transition: transform var(--dur-3) var(--ease-out-expo), opacity var(--dur-2) linear;
}
.menu-toggle__bars.is-open i:first-child {
  transform: translateY(3.25px) rotate(45deg);
}
.menu-toggle__bars.is-open i:last-child {
  transform: translateY(-3.25px) rotate(-45deg);
}

/* ---- 阅读进度 ---- */
.read-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1.5px;
  overflow: hidden;
}
.read-progress span {
  display: block;
  height: 100%;
  transform-origin: 0 50%;
  transform: scaleX(0);
  background: linear-gradient(90deg, var(--aurora-a), var(--aurora-b), var(--aurora-c));
  box-shadow: 0 0 12px rgba(120, 160, 255, 0.7);
  transition: transform 120ms linear;
}

/* ============================= 移动端菜单 ============================= */
.mobile-menu {
  position: fixed;
  inset: var(--header-h) 0 0 0;
  z-index: calc(var(--z-header) - 1);
  display: flex;
  flex-direction: column;
  padding: var(--space-m) var(--gutter) calc(var(--space-l) + env(safe-area-inset-bottom));
  background:
    radial-gradient(70% 40% at 20% 0%, rgba(110, 168, 255, 0.14), transparent 62%),
    radial-gradient(60% 40% at 90% 10%, rgba(167, 139, 250, 0.12), transparent 60%),
    rgba(4, 7, 15, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow-y: auto;
}
@media (min-width: 768px) {
  .mobile-menu {
    display: none;
  }
}

.mobile-menu__nav {
  display: flex;
  flex-direction: column;
}

.mobile-menu__link {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-s) 0.25rem;
  border: none;
  border-bottom: 1px solid var(--hairline);
  background: transparent;
  color: var(--text-hi);
  font-size: var(--step-2);
  font-weight: 620;
  letter-spacing: -0.01em;
  text-align: left;
  cursor: pointer;
  opacity: 0;
  animation: menu-item-in 520ms var(--ease-out-expo) forwards;
  animation-delay: calc(var(--i) * 60ms + 60ms);
}
@keyframes menu-item-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.mobile-menu__index {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-faint);
  letter-spacing: 0.1em;
}
.mobile-menu__label {
  flex: 1;
}
.mobile-menu__arrow {
  color: var(--text-faint);
  transition: transform var(--dur-2) var(--ease-out-expo), color var(--dur-2);
}
.mobile-menu__link:active .mobile-menu__arrow {
  transform: translateX(4px);
  color: var(--aurora-a);
}
.mobile-menu__link.router-link-active .mobile-menu__label {
  background: linear-gradient(120deg, var(--aurora-a), var(--aurora-b));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.mobile-menu__foot {
  margin-top: auto;
  padding-top: var(--space-m);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  opacity: 0;
  animation: menu-item-in 520ms var(--ease-out-expo) forwards;
  animation-delay: calc(var(--i) * 60ms + 120ms);
}
.mobile-menu__cta {
  padding: 0.9rem;
  font-size: var(--step-0);
}

.menu-enter-active,
.menu-leave-active {
  transition: opacity var(--dur-3) var(--ease-out-quart);
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}

/* ============================= 页脚 ============================= */
.site-footer {
  margin-top: auto;
  padding: var(--space-xl) 0 var(--space-m);
  border-top: 1px solid var(--hairline);
  background: linear-gradient(180deg, transparent, rgba(4, 8, 18, 0.6));
}
.site-footer__grid {
  display: grid;
  gap: var(--space-l);
  grid-template-columns: 1fr;
  padding-bottom: var(--space-l);
}
@media (min-width: 720px) {
  .site-footer__grid {
    grid-template-columns: 2fr 1fr 1fr;
    gap: var(--space-m);
  }
}
.site-footer__title {
  font-size: var(--step-1);
  font-weight: 640;
  color: var(--text-hi);
  margin-bottom: 0.5rem;
}
.site-footer__desc {
  max-width: 34ch;
  font-size: var(--step--1);
  color: var(--text-dim);
  line-height: 1.75;
}
.site-footer__col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.45rem;
}
.site-footer__head {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin-bottom: 0.3rem;
}
.site-footer__link {
  border: none;
  background: none;
  padding: 0;
  font-size: var(--step--1);
  color: var(--text-dim);
  cursor: pointer;
  transition: color var(--dur-2), transform var(--dur-2) var(--ease-out-expo);
}
.site-footer__link:hover {
  color: #fff;
  transform: translateX(3px);
}
.site-footer__meta {
  font-size: var(--step--1);
  color: var(--text-dim);
}
.site-footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
  flex-wrap: wrap;
  padding-top: var(--space-s);
  border-top: 1px solid var(--hairline);
  font-size: var(--step--2);
  color: var(--text-faint);
}
.to-top {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  border-radius: var(--r-full);
  border: 1px solid var(--hairline);
  background: var(--surface-1);
  color: var(--text-dim);
  font-size: var(--step--2);
  cursor: pointer;
  transition: all var(--dur-2) var(--ease-out-quart);
}
.to-top:hover {
  color: #fff;
  border-color: var(--hairline-strong);
  background: var(--surface-3);
  transform: translateY(-2px);
}
</style>
